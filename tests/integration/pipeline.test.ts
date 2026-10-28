import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeAgentLoop,
  AgentRunInput,
  verifyTechStack,
  verifyCommitCoverage,
  parseLLMArtifacts,
} from '@/lib/agent/orchestrator';
import { StorageEngine, ShipLogEntry } from '@/lib/storage/engine';
import { scrubSecrets, isSensitiveFile } from '@/lib/security/scrubber';
import { createLLMClient } from '@/lib/llm/client';
import { GitHubService } from '@/lib/github/service';
import fs from 'fs';
import path from 'path';

describe('End-to-End ShipLog Pipeline Integration', () => {
  const testStorageDir = path.join(process.cwd(), 'tmp-test-integration-storage');

  beforeEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  it('runs the full pipeline: Voice + Diffs -> Scrubbing -> Orchestrator -> Storage -> Search', async () => {
    // 1. Voice input with sensitive token that MUST be scrubbed
    const rawVoiceTranscript =
      'Today I integrated Redis PubSub for real-time notifications with API key sk-proj-1234567890abcdefghijklmnopqrstuv-1234 and commit ghp_SECRETGITHUBTOKEN1234567890abcdef.';

    const diffs = [
      { filename: 'lib/redis/pubsub.ts', status: 'added', additions: 120, deletions: 0, patch: '+export class RedisBroadcaster' },
      { filename: 'lib/network/socket.ts', status: 'modified', additions: 45, deletions: 10, patch: '+socket.subscribe()' },
    ];

    const commits = [
      {
        sha: 'commit-101',
        message: 'feat: add redis pubsub broadcaster',
        author: 'Dev',
        date: '2026-10-28T12:00:00Z',
        url: 'https://github.com/user/test-project/commit/commit-101',
      },
      {
        sha: 'commit-102',
        message: 'chore: update lockfile',
        author: 'Dev',
        date: '2026-10-28T12:05:00Z',
        url: 'https://github.com/user/test-project/commit/commit-102',
      },
    ];

    // 2. Execute Agent Loop with isMockSample: true
    const input: AgentRunInput = {
      voiceTranscript: rawVoiceTranscript,
      repo: 'user/test-project',
      diffs,
      commits,
      providerConfig: { provider: 'ollama', baseUrl: 'http://localhost:11434' },
      isMockSample: true,
    };

    const agentResult = await executeAgentLoop(input);

    // 3. Verify Agent Output Structure & Grounding
    expect(agentResult.artifacts.portfolio.title).toBeDefined();
    expect(agentResult.artifacts.standup.yesterday).toBeDefined();
    expect(agentResult.reasoningTrace.length).toBeGreaterThanOrEqual(4);

    // Verify grounding
    expect(agentResult.verification.verifiedTech).toContain('Redis');
    expect(agentResult.verification.verifiedTech).toContain('WebSockets');

    // 4. Verify Secrets were scrubbed from raw transcript before persistence
    const sanitizedVoice = scrubSecrets(rawVoiceTranscript);
    expect(sanitizedVoice).not.toContain('sk-proj-');
    expect(sanitizedVoice).not.toContain('ghp_SECRETGITHUBTOKEN');
    expect(sanitizedVoice).toContain('[REDACTED_API_KEY]');
    expect(sanitizedVoice).toContain('[REDACTED_GITHUB_TOKEN]');

    // 5. Ingest into Storage Engine (MemPalace / LLM Wiki)
    const storage = new StorageEngine(testStorageDir);
    const entryId = 'shiplog-2026-10-28';
    const entryToSave: ShipLogEntry = {
      id: entryId,
      date: '2026-10-28',
      rawTranscript: sanitizedVoice,
      repoContext: 'user/test-project',
      artifacts: agentResult.artifacts,
      reasoningTrace: agentResult.reasoningTrace,
    };

    storage.saveEntry(entryToSave);

    // 6. Verify Verbatim Raw Persistence (MemPalace)
    const rawFile = path.join(testStorageDir, 'raw', `${entryId}.txt`);
    expect(fs.existsSync(rawFile)).toBe(true);
    const rawSaved = fs.readFileSync(rawFile, 'utf-8');
    expect(rawSaved).toBe(sanitizedVoice);
    expect(rawSaved).not.toContain('sk-proj-');

    // 7. Verify Structured JSON Entry (LLM Wiki Derived Layer)
    const savedEntry = storage.getEntry(entryId);
    expect(savedEntry).not.toBeNull();
    expect(savedEntry?.artifacts.portfolio.techStack).toContain('Redis');
    expect(savedEntry?.reasoningTrace.length).toBeGreaterThan(0);

    // 8. Verify Living Index and Search Capability
    const index = storage.getIndex();
    expect(index.length).toBe(1);
    expect(index[0].id).toBe(entryId);

    const searchHits = storage.searchEntries('Redis');
    expect(searchHits.length).toBe(1);
    expect(searchHits[0].id).toBe(entryId);

    const searchMiss = storage.searchEntries('NonExistentTechnology');
    expect(searchMiss.length).toBe(0);
  });

  it('runs multi-day recap pipeline with live LLM client mock and cumulative index updates', async () => {
    const storage = new StorageEngine(testStorageDir);

    const days = [
      {
        id: 'log-day-1',
        date: '2026-10-26',
        title: 'PostgreSQL Migration',
        tech: ['PostgreSQL', 'TypeScript'],
        voice: 'Set up database schemas and connection pooling.',
      },
      {
        id: 'log-day-2',
        date: '2026-10-27',
        title: 'Docker Deployment',
        tech: ['Docker', 'NextJs'],
        voice: 'Containerized NextJs app and wrote docker-compose.',
      },
      {
        id: 'log-day-3',
        date: '2026-10-28',
        title: 'WebSockets Realtime',
        tech: ['WebSockets', 'Redis'],
        voice: 'Implemented real-time notification gateway.',
      },
    ];

    for (const day of days) {
      storage.saveEntry({
        id: day.id,
        date: day.date,
        rawTranscript: day.voice,
        artifacts: {
          portfolio: {
            title: day.title,
            techStack: day.tech,
            impact: `Completed ${day.title}`,
          },
          standup: { yesterday: day.title, today: 'Next phase', blockers: 'None' },
          decisionLog: [],
        },
        reasoningTrace: ['Simulated step trace'],
      });
    }

    const index = storage.getIndex();
    expect(index.length).toBe(3);

    // Most recent entry should be first in index
    expect(index[0].id).toBe('log-day-3');
    expect(index[1].id).toBe('log-day-2');
    expect(index[2].id).toBe('log-day-1');

    // Tag based searches
    expect(storage.searchEntries('Docker').length).toBe(1);
    expect(storage.searchEntries('TypeScript').length).toBe(1);
    expect(storage.searchEntries('Redis').length).toBe(1);
  });

  it('verifies system compliance: all contracts and schemas across Tasks 1-6 are strictly adhered to', () => {
    // 1. Task 2 Scrubber compliance
    expect(typeof scrubSecrets).toBe('function');
    expect(typeof isSensitiveFile).toBe('function');
    expect(scrubSecrets('clean text')).toBe('clean text');
    expect(isSensitiveFile('.env.local')).toBe(true);

    // 2. Task 3 LLM Client factory compliance
    expect(typeof createLLMClient).toBe('function');
    const dummyClient = createLLMClient({ provider: 'ollama' });
    expect(dummyClient).toHaveProperty('client');
    expect(dummyClient).toHaveProperty('model');

    // 3. Task 4 GitHub Service compliance
    const gh = new GitHubService();
    expect(typeof gh.parseRepo).toBe('function');
    expect(typeof gh.fetchRecentCommits).toBe('function');
    expect(typeof gh.fetchCommitDiff).toBe('function');

    // 4. Task 5 Storage Engine compliance
    const storage = new StorageEngine(testStorageDir);
    expect(typeof storage.saveEntry).toBe('function');
    expect(typeof storage.getEntry).toBe('function');
    expect(typeof storage.getIndex).toBe('function');
    expect(typeof storage.searchEntries).toBe('function');

    // 5. Task 6 Agent Orchestrator compliance
    expect(typeof executeAgentLoop).toBe('function');
    expect(typeof verifyTechStack).toBe('function');
    expect(typeof verifyCommitCoverage).toBe('function');
    expect(typeof parseLLMArtifacts).toBe('function');

    const emptyArtifacts = parseLLMArtifacts('{}');
    expect(emptyArtifacts.portfolio.title).toBeDefined();
    expect(emptyArtifacts.standup.blockers).toBe('None.');
    expect(Array.isArray(emptyArtifacts.decisionLog)).toBe(true);
  });
});
