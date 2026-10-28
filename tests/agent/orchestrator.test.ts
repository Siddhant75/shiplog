import { describe, it, expect, vi } from 'vitest';
import {
  verifyTechStack,
  verifyCommitCoverage,
  executeAgentLoop,
  parseLLMArtifacts,
} from '@/lib/agent/orchestrator';
import * as llmClientModule from '@/lib/llm/client';

describe('Agent Verification Engine & Orchestrator (Task 6)', () => {
  it('detects hallucinated tech not present in files changed', () => {
    const generatedTech = ['React', 'PostgreSQL', 'Kubernetes'];
    const filesChanged = ['components/Button.tsx', 'lib/db/postgres.ts'];
    const result = verifyTechStack(generatedTech, filesChanged);

    expect(result.verified).toContain('React');
    expect(result.verified).toContain('PostgreSQL');
    expect(result.hallucinated).toContain('Kubernetes');
  });

  it('checks commit coverage against standup output', () => {
    const commits = [
      { sha: '1', message: 'fix: auth token rotation' },
      { sha: '2', message: 'feat: add stripe checkout' },
    ];
    const standupText = 'Yesterday I fixed auth token rotation and configured the database.';
    const result = verifyCommitCoverage(standupText, commits);

    expect(result.covered).toContain('fix: auth token rotation');
    expect(result.unmentioned).toContain('feat: add stripe checkout');
  });

  it('executes the full 5-step agent loop in mock/sample mode', async () => {
    const res = await executeAgentLoop({
      voiceTranscript: 'Today I implemented the WebSocket reconnection logic with exponential backoff and jitter.',
      isMockSample: true,
      providerConfig: { provider: 'ollama' },
    });

    expect(res.artifacts.portfolio.title).toBeTruthy();
    expect(res.artifacts.standup.yesterday).toBeTruthy();
    expect(res.artifacts.decisionLog.length).toBeGreaterThan(0);
    expect(res.reasoningTrace.length).toBeGreaterThanOrEqual(4);
    expect(res.verification.verifiedTech.length).toBeGreaterThan(0);
  });

  it('verifies that C++, ASP.NET, and Node.js with special characters do not throw regex errors', () => {
    const specialTech = ['C++', 'ASP.NET', 'Node.js', 'C#', '.NET Core', 'Vue.js'];
    const filesChanged = ['src/native/driver.cpp', 'package.json', 'Web/Controllers/Index.asp.net'];

    let result!: ReturnType<typeof verifyTechStack>;
    expect(() => {
      result = verifyTechStack(specialTech, filesChanged);
    }).not.toThrow();

    expect(result.verified).toContain('C++');
    expect(result.verified).toContain('Node.js');
    expect(result.verified).toContain('ASP.NET');
    expect(result.hallucinated).toContain('.NET Core');
  });

  it('verifies scoped commits like feat(auth): add jwt token validation match jwt', () => {
    const commits = [
      { sha: '1', message: 'feat(auth): add jwt token validation' },
      { sha: '2', message: 'fix(api): handle timeout in sql query' },
      { sha: '3', message: 'chore(ci): setup github actions' },
    ];
    const standupText = 'Yesterday I implemented jwt token validation and configured the sql database.';
    const result = verifyCommitCoverage(standupText, commits);

    expect(result.covered).toContain('feat(auth): add jwt token validation');
    expect(result.covered).toContain('fix(api): handle timeout in sql query');
    expect(result.unmentioned).toContain('chore(ci): setup github actions');
  });

  it('defensively parses LLM responses wrapped in markdown code fences', () => {
    const fencedJson = `\`\`\`json
{
  "portfolio": {
    "title": "Secure Auth Gateway",
    "techStack": ["TypeScript", "Redis"],
    "impact": "Hardened authentication flow.",
    "challengeSolved": "Mitigated brute force attacks."
  },
  "standup": {
    "yesterday": "Added rate limiting and jwt rotation.",
    "today": "Write e2e tests.",
    "blockers": "None."
  },
  "decisionLog": [
    {
      "decision": "Use sliding window rate limiter.",
      "rationale": "More accurate than fixed window.",
      "evidence": "lib/limiter.ts:15"
    }
  ]
}
\`\`\``;

    const artifacts = parseLLMArtifacts(fencedJson);
    expect(artifacts.portfolio.title).toBe('Secure Auth Gateway');
    expect(artifacts.portfolio.techStack).toEqual(['TypeScript', 'Redis']);
    expect(artifacts.standup.yesterday).toContain('jwt rotation');
    expect(artifacts.decisionLog.length).toBe(1);
    expect(artifacts.decisionLog[0].decision).toBe('Use sliding window rate limiter.');
  });

  it('defensively provides safe schema defaults when LLM returns malformed JSON or missing fields', () => {
    const malformed = 'Error: upstream provider timeout {"not": valid';
    const artifacts = parseLLMArtifacts(malformed);

    expect(artifacts.portfolio).toBeDefined();
    expect(artifacts.portfolio.title).toBe('Engineering Work Summary');
    expect(artifacts.portfolio.techStack).toEqual([]);
    expect(artifacts.portfolio.impact).toBeTruthy();
    expect(artifacts.portfolio.challengeSolved).toBeTruthy();
    expect(artifacts.standup).toBeDefined();
    expect(artifacts.standup.yesterday).toBe('');
    expect(artifacts.standup.today).toBe('');
    expect(artifacts.standup.blockers).toBe('None.');
    expect(artifacts.decisionLog).toEqual([]);

    // Partial JSON with missing nested fields
    const partial = parseLLMArtifacts(JSON.stringify({ portfolio: { title: 'Custom Title' } }));
    expect(partial.portfolio.title).toBe('Custom Title');
    expect(partial.portfolio.techStack).toEqual([]);
    expect(partial.standup.yesterday).toBe('');
    expect(partial.decisionLog).toEqual([]);
  });

  it('prevents mock fallback leakage in live runs when no diffs or commits are provided', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              portfolio: {
                title: 'Live Service Deployment',
                techStack: ['WebSockets', 'PostgreSQL'],
                impact: 'Deployed live service.',
                challengeSolved: 'Scale issues.',
              },
              standup: {
                yesterday: 'Wrote service layer.',
                today: 'Deploy to production.',
                blockers: 'None.',
              },
              decisionLog: [],
            }),
          },
        },
      ],
    });

    vi.spyOn(llmClientModule, 'createLLMClient').mockReturnValue({
      client: {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any,
      model: 'gpt-4o-mini',
    });

    const res = await executeAgentLoop({
      voiceTranscript: 'Live voice update without git context.',
      providerConfig: { provider: 'openai', apiKey: 'fake-key' },
      isMockSample: false,
    });

    expect(res.reasoningTrace).toContain('No commit diffs provided for verification');
    // In live mode with no diffs, effectiveFiles is empty, so all tech tags are flagged as hallucinated
    expect(res.verification.verifiedTech).toEqual([]);
    expect(res.verification.hallucinatedTech).toContain('WebSockets');
    expect(res.verification.hallucinatedTech).toContain('PostgreSQL');
    // In live mode with no commits, commits is empty, so coverage has no covered or unmentioned mock items
    expect(res.verification.commitCoverage.covered).toEqual([]);
    expect(res.verification.commitCoverage.unmentioned).toEqual([]);
  });
});
