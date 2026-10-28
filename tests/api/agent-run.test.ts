import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as orchestrator from '@/lib/agent/orchestrator';
import { StorageEngine } from '@/lib/storage/engine';
import { GitHubService } from '@/lib/github/service';
// Will import route handler
import { POST } from '@/app/api/agent/run/route';

describe('Stateless Serverless API Endpoint (/api/agent/run)', () => {
  const testStorageDir = path.join(process.cwd(), 'tmp-test-api-storage');

  beforeEach(() => {
    process.env.STORAGE_DIR = testStorageDir;
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    delete process.env.STORAGE_DIR;
    vi.restoreAllMocks();
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('Validation & Error Handling (400 / 500)', () => {
    it('returns 400 when body is invalid JSON', async () => {
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-{',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/json/i);
    });

    it('returns 400 when body is an array instead of a JSON object', async () => {
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ voiceTranscript: 'hello' }]),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/valid JSON object/i);
    });

    it('returns 400 when voiceTranscript is missing', async () => {
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMockSample: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/voiceTranscript/i);
    });

    it('returns 400 when voiceTranscript is non-string or empty', async () => {
      const testCases = [
        { voiceTranscript: '' },
        { voiceTranscript: '   ' },
        { voiceTranscript: 12345 },
        { voiceTranscript: null },
        { voiceTranscript: {} },
      ];

      for (const body of testCases) {
        const req = new Request('http://localhost:3000/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(/voiceTranscript/i);
      }
    });

    it('returns 400 when cloud provider is selected but x-provider-key is missing', async () => {
      const cloudProviders = ['gemini', 'openai', 'anthropic'];

      for (const provider of cloudProviders) {
        const req = new Request('http://localhost:3000/api/agent/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-provider-type': provider,
          },
          body: JSON.stringify({
            voiceTranscript: 'Implemented auth middleware with JWT tokens.',
          }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toMatch(new RegExp(`API key is required for provider: ${provider}`, 'i'));
      }
    });

    it('returns 500 when orchestrator loop throws an internal error', async () => {
      vi.spyOn(orchestrator, 'executeAgentLoop').mockRejectedValueOnce(
        new Error('LLM Provider connection timeout')
      );

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-type': 'ollama',
        },
        body: JSON.stringify({
          voiceTranscript: 'Some work done',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('LLM Provider connection timeout');
    });

    it('handles non-string provider or config fields defensively without unhandled 500 TypeError', async () => {
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: 'Some transcript',
          provider: 12345,
          apiKey: true,
          baseUrl: {},
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      // Non-string provider is safely ignored, defaulting to 'ollama' without throwing TypeError
      expect(res.status).toBe(200);
    });

    it('scrubs leaked secrets from 500 error messages', async () => {
      vi.spyOn(orchestrator, 'executeAgentLoop').mockRejectedValueOnce(
        new Error('Failed upstream request sk-proj-1234567890abcdefghijklmnopqrstuv-1234')
      );

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-type': 'ollama',
        },
        body: JSON.stringify({
          voiceTranscript: 'Some work done',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).not.toContain('sk-proj-');
      expect(data.error).toContain('[REDACTED_API_KEY]');
    });
  });

  describe('Success & Mock Execution (200)', () => {
    it('returns 200 with complete artifacts, reasoningTrace, verification, and saved entry when isMockSample is true', async () => {
      const transcript = 'Fixed WebSocket reconnection logic and refactored auth handler.';
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: transcript,
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.entryId).toMatch(/^shiplog-/);

      // Verify artifacts structure
      expect(data.artifacts).toBeDefined();
      expect(data.artifacts.portfolio.title).toBe('Resilient WebSocket Reconnection Layer');
      expect(data.artifacts.portfolio.techStack).toContain('WebSockets');
      expect(data.artifacts.standup.yesterday).toContain('WebSocket reconnection');
      expect(Array.isArray(data.artifacts.decisionLog)).toBe(true);
      expect(data.artifacts.decisionLog.length).toBeGreaterThan(0);

      // Verify reasoning trace and verification
      expect(Array.isArray(data.reasoningTrace)).toBe(true);
      expect(data.reasoningTrace.length).toBeGreaterThanOrEqual(4);
      expect(data.verification).toBeDefined();
      expect(Array.isArray(data.verification.verifiedTech)).toBe(true);
      expect(Array.isArray(data.verification.hallucinatedTech)).toBe(true);
      expect(data.verification.commitCoverage).toBeDefined();

      // Verify persistence in StorageEngine
      const storage = new StorageEngine(testStorageDir);
      const savedEntry = storage.getEntry(data.entryId);
      expect(savedEntry).not.toBeNull();
      expect(savedEntry?.id).toBe(data.entryId);
      expect(savedEntry?.rawTranscript).toBe(transcript);
      expect(savedEntry?.artifacts.portfolio.title).toBe('Resilient WebSocket Reconnection Layer');

      // Verify verbatim raw file exists
      const rawFilePath = path.join(testStorageDir, 'raw', `${data.entryId}.txt`);
      expect(fs.existsSync(rawFilePath)).toBe(true);
      expect(fs.readFileSync(rawFilePath, 'utf-8')).toBe(transcript);

      // Verify living index
      const index = storage.getIndex();
      expect(index.length).toBe(1);
      expect(index[0].id).toBe(data.entryId);
    });
  });

  describe('Zero-Persistence Header Extraction', () => {
    it('extracts provider config strictly from headers and passes to orchestrator', async () => {
      const spy = vi.spyOn(orchestrator, 'executeAgentLoop');

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-type': 'ollama',
          'x-provider-url': 'http://custom-ollama:11434',
          'x-provider-model': 'llama3.3',
          'x-github-token': 'ghp_headerToken1234567890abcdef',
        },
        body: JSON.stringify({
          voiceTranscript: 'Working on custom model fine-tuning.',
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          providerConfig: {
            provider: 'ollama',
            baseUrl: 'http://custom-ollama:11434',
            model: 'llama3.3',
          },
          githubToken: 'ghp_headerToken1234567890abcdef',
        })
      );
    });

    it('extracts cloud provider key strictly from headers', async () => {
      const spy = vi.spyOn(orchestrator, 'executeAgentLoop');

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-type': 'gemini',
          'x-provider-key': 'gemini-secret-api-key',
        },
        body: JSON.stringify({
          voiceTranscript: 'Summarized standup tasks.',
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          providerConfig: {
            provider: 'gemini',
            apiKey: 'gemini-secret-api-key',
          },
        })
      );
    });

    it('falls back to body providerConfig and apiKey when headers are absent', async () => {
      const spy = vi.spyOn(orchestrator, 'executeAgentLoop');

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: 'Refactored auth module.',
          providerConfig: {
            provider: 'gemini',
            apiKey: 'body-gemini-key',
          },
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          providerConfig: {
            provider: 'gemini',
            apiKey: 'body-gemini-key',
          },
        })
      );
    });
  });

  describe('StorageEngine Integration & Secret Scrubbing', () => {
    it('scrubs sensitive tokens from verbatim raw transcript before persistence', async () => {
      const rawWithSecrets =
        'Committed new feature with key sk-proj-1234567890abcdefghijklmnopqrstuv-1234 and github token ghp_SECRETGITHUBTOKEN1234567890abcdef.';

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: rawWithSecrets,
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      const storage = new StorageEngine(testStorageDir);
      const savedEntry = storage.getEntry(data.entryId);
      expect(savedEntry).not.toBeNull();

      // Secrets must be redacted
      expect(savedEntry?.rawTranscript).not.toContain('sk-proj-');
      expect(savedEntry?.rawTranscript).not.toContain('ghp_SECRETGITHUBTOKEN');
      expect(savedEntry?.rawTranscript).toContain('[REDACTED_API_KEY]');
      expect(savedEntry?.rawTranscript).toContain('[REDACTED_GITHUB_TOKEN]');

      // Verbatim file must also be redacted
      const rawFile = path.join(testStorageDir, 'raw', `${data.entryId}.txt`);
      const rawContent = fs.readFileSync(rawFile, 'utf-8');
      expect(rawContent).not.toContain('sk-proj-');
      expect(rawContent).not.toContain('ghp_SECRETGITHUBTOKEN');
      expect(rawContent).toContain('[REDACTED_API_KEY]');
      expect(rawContent).toContain('[REDACTED_GITHUB_TOKEN]');
    });

    it('sanitizes custom entry id against directory traversal or invalid characters', async () => {
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: 'Fixed security bug.',
          id: '../../etc/passwd',
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.entryId).toMatch(/^shiplog-\d+$/);
      expect(data.entryId).not.toContain('..');
    });

    it('preserves valid custom id and date when provided', async () => {
      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: 'Fixed styling bug.',
          id: 'custom-entry-001',
          date: '2026-10-25',
          isMockSample: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.entryId).toBe('custom-entry-001');

      const storage = new StorageEngine(testStorageDir);
      const entry = storage.getEntry('custom-entry-001');
      expect(entry).not.toBeNull();
      expect(entry?.date).toBe('2026-10-25');
    });
  });

  describe('GitHub Service Integration & Fault Tolerance', () => {
    it('gracefully handles GitHub service errors by recording warning in reasoningTrace without breaking the request', async () => {
      // Mock GitHubService to simulate API failure
      vi.spyOn(GitHubService.prototype, 'fetchRecentCommits').mockRejectedValueOnce(
        new Error('GitHub API rate limit exceeded')
      );

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-type': 'ollama',
        },
        body: JSON.stringify({
          voiceTranscript: 'Refactored database pooling logic.',
          repo: 'owner/nonexistent-repo',
          isMockSample: false,
        }),
      });

      // Mock executeAgentLoop to avoid calling real ollama
      vi.spyOn(orchestrator, 'executeAgentLoop').mockResolvedValueOnce({
        artifacts: {
          portfolio: { title: 'DB Pooling', techStack: ['PostgreSQL'], impact: 'Faster queries' },
          standup: { yesterday: 'Pooling', today: 'Deploy', blockers: 'None.' },
          decisionLog: [],
        },
        reasoningTrace: ['Step 1: Plan', 'Step 2: Execute'],
        verification: {
          verifiedTech: ['PostgreSQL'],
          hallucinatedTech: [],
          commitCoverage: { covered: [], unmentioned: [] },
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.entryId).toBeDefined();

      // Reasoning trace should record the GitHub warning
      const hasGitHubWarning = data.reasoningTrace.some((step: string) =>
        step.toLowerCase().includes('github') && step.toLowerCase().includes('rate limit exceeded')
      );
      expect(hasGitHubWarning).toBe(true);
    });

    it('fetches commits and diffs when repo is specified and !isMockSample', async () => {
      const mockCommits = [
        {
          sha: 'sha-abc-123',
          message: 'feat: add redis cache layer',
          author: 'Alice',
          date: '2026-10-28T12:00:00Z',
          url: 'https://github.com/alice/repo/commit/sha-abc-123',
        },
      ];

      const mockDiffs = [
        {
          filename: 'lib/cache.ts',
          status: 'added',
          additions: 50,
          deletions: 0,
        },
      ];

      vi.spyOn(GitHubService.prototype, 'fetchRecentCommits').mockResolvedValueOnce(mockCommits);
      vi.spyOn(GitHubService.prototype, 'fetchCommitDiff').mockResolvedValueOnce(mockDiffs);
      const orchestratorSpy = vi.spyOn(orchestrator, 'executeAgentLoop').mockResolvedValueOnce({
        artifacts: {
          portfolio: { title: 'Redis Cache', techStack: ['Redis'], impact: 'Caching' },
          standup: { yesterday: 'Cache', today: 'Docs', blockers: 'None.' },
          decisionLog: [],
        },
        reasoningTrace: ['Step 1', 'Step 2'],
        verification: {
          verifiedTech: ['Redis'],
          hallucinatedTech: [],
          commitCoverage: { covered: ['feat: add redis cache layer'], unmentioned: [] },
        },
      });

      const req = new Request('http://localhost:3000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-type': 'ollama',
          'x-github-token': 'test-gh-token',
        },
        body: JSON.stringify({
          voiceTranscript: 'Implemented redis cache layer',
          repo: 'alice/repo',
          isMockSample: false,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(orchestratorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          repo: 'alice/repo',
          commits: mockCommits,
          diffs: mockDiffs,
          githubToken: 'test-gh-token',
        })
      );
    });
  });
});
