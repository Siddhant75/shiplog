import { describe, it, expect } from 'vitest';
import DOMPurify from 'isomorphic-dompurify';
import { DEFAULT_SETTINGS, isCloudProvider, SettingsState, PROVIDER_OPTIONS } from '@/components/SettingsModal';
import { SAMPLE_VOICE_TRANSCRIPT } from '@/components/SampleDataButton';
import { ArtifactsResult } from '@/components/ArtifactsView';
import { scrubSecrets } from '@/lib/security/scrubber';

describe('UI Sanitization (DOMPurify)', () => {
  it('strips malicious <script> tags from rendered content', () => {
    const dirty = 'Safe text <script>alert("hack")</script> more safe';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean).toBe('Safe text  more safe');
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert("hack")');
  });

  it('strips dangerous event handlers like onerror from <img> tags', () => {
    const dirty = '<img src="x" onerror="alert(1)">';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('alert(1)');
    expect(clean).toContain('<img src="x">');
  });

  it('strips iframe and javascript: pseudo-protocol vectors', () => {
    const dirty = '<iframe src="javascript:alert(1)"></iframe><a href="javascript:alert(2)">Click</a>';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean).not.toContain('iframe');
    expect(clean).not.toContain('javascript:alert');
  });

  it('sanitizes reasoning trace steps containing XSS payloads while preserving safe formatting', () => {
    const maliciousTraceStep = 'Step 4: Executed query <script>document.cookie</script> <b>safely</b>';
    const clean = DOMPurify.sanitize(maliciousTraceStep);
    expect(clean).toBe('Step 4: Executed query  <b>safely</b>');
    expect(clean).not.toContain('<script>');
  });
});

describe('Artifact Data Contracts and Sanitization', () => {
  const sampleResult: ArtifactsResult = {
    entryId: 'shiplog-1730138400',
    date: '2026-10-28',
    success: true,
    artifacts: {
      portfolio: {
        title: 'Resilient WebSocket Reconnection Layer',
        techStack: ['WebSockets', 'TypeScript', 'Redis', 'Docker'],
        impact: 'Zero-drop live connection recovery with exponential backoff and jitter.',
        challengeSolved: 'Preventing thundering herd connection storms when backend servers restart.',
      },
      standup: {
        yesterday: 'Implemented WebSocket reconnection backoff with jitter.',
        today: 'Add integration tests for reconnect logic.',
        blockers: 'None.',
      },
      decisionLog: [
        {
          decision: 'Chose exponential backoff with full jitter over linear retry interval.',
          rationale: 'Avoids synchronized client retry spikes against recovering gateway pods.',
          evidence: 'lib/network/socketClient.ts:42',
        },
      ],
    },
    reasoningTrace: [
      'Step 1 (Plan): Parsed voice transcript and identified technical intent.',
      'Step 2 (Execute): Ingested 3 changed files and scrubbed secrets.',
      'Step 3 (Synthesize): Generated Portfolio Card, Standup, and Decision Log.',
      'Step 4 (Verify): Checked tech stack signatures against diffs.',
      'Step 5 (Format): Verified schema contracts and rendered artifacts.',
    ],
    verification: {
      verifiedTech: ['WebSockets', 'TypeScript'],
      hallucinatedTech: ['Docker'],
      commitCoverage: {
        covered: ['feat: add websocket backoff'],
        unmentioned: [],
      },
    },
  };

  it('validates portfolio tab contract structure', () => {
    const { portfolio } = sampleResult.artifacts;
    expect(typeof portfolio.title).toBe('string');
    expect(portfolio.title.length).toBeGreaterThan(0);
    expect(Array.isArray(portfolio.techStack)).toBe(true);
    expect(portfolio.techStack).toContain('TypeScript');
    expect(typeof portfolio.impact).toBe('string');
    expect(typeof portfolio.challengeSolved).toBe('string');
  });

  it('validates standup tab contract structure', () => {
    const { standup } = sampleResult.artifacts;
    expect(typeof standup.yesterday).toBe('string');
    expect(typeof standup.today).toBe('string');
    expect(typeof standup.blockers).toBe('string');
  });

  it('validates decision log tab contract structure', () => {
    const { decisionLog } = sampleResult.artifacts;
    expect(Array.isArray(decisionLog)).toBe(true);
    expect(decisionLog.length).toBeGreaterThan(0);
    const firstDecision = decisionLog[0];
    expect(firstDecision).toHaveProperty('decision');
    expect(firstDecision).toHaveProperty('rationale');
    expect(firstDecision).toHaveProperty('evidence');
  });

  it('validates verification metadata contract', () => {
    const { verification } = sampleResult;
    expect(verification).toBeDefined();
    expect(Array.isArray(verification?.verifiedTech)).toBe(true);
    expect(Array.isArray(verification?.hallucinatedTech)).toBe(true);
    expect(verification?.verifiedTech).toContain('TypeScript');
    expect(verification?.hallucinatedTech).toContain('Docker');
    expect(verification?.commitCoverage?.covered.length).toBeGreaterThan(0);
  });

  it('sanitizes artifact fields containing injected HTML or script payload', () => {
    const maliciousTitle = 'Feature <img src=x onerror=alert("pwned")> Title';
    const sanitizedTitle = DOMPurify.sanitize(maliciousTitle);
    expect(sanitizedTitle).not.toContain('onerror');
    expect(sanitizedTitle).not.toContain('alert');
  });
});

describe('Settings State Defaults and Model Selection Logic', () => {
  it('provides safe default settings without requiring cloud keys', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      provider: 'ollama',
      key: '',
      baseUrl: '',
      model: '',
      githubToken: '',
    });
  });

  it('identifies cloud providers versus air-gapped local providers', () => {
    expect(isCloudProvider('ollama')).toBe(false);
    expect(isCloudProvider('gemini')).toBe(true);
    expect(isCloudProvider('openai')).toBe(true);
    expect(isCloudProvider('anthropic')).toBe(true);
    expect(isCloudProvider('unknown')).toBe(true);
  });

  it('contains all required provider options with clear descriptions', () => {
    const providerIds = PROVIDER_OPTIONS.map((p) => p.id);
    expect(providerIds).toContain('ollama');
    expect(providerIds).toContain('gemini');
    expect(providerIds).toContain('openai');
    expect(providerIds).toContain('anthropic');

    const ollamaOption = PROVIDER_OPTIONS.find((p) => p.id === 'ollama');
    expect(ollamaOption?.label).toContain('Air-Gapped');
    expect(ollamaOption?.requiresKey).toBe(false);

    const geminiOption = PROVIDER_OPTIONS.find((p) => p.id === 'gemini');
    expect(geminiOption?.requiresKey).toBe(true);
  });

  it('scrubs leaked credentials before UI error rendering', () => {
    const rawErrorMessage = 'Failed to connect to API with token ghp_123456789012345678901234567890123456 and key sk-ant-12345678901234567890123456789012';
    const scrubbed = scrubSecrets(rawErrorMessage);
    expect(scrubbed).not.toContain('ghp_123456789012345678901234567890123456');
    expect(scrubbed).not.toContain('sk-ant-12345678901234567890123456789012');
    expect(scrubbed).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(scrubbed).toContain('[REDACTED_API_KEY]');
  });

  it('provides a valid non-empty sample voice transcript for 1-click demo', () => {
    expect(typeof SAMPLE_VOICE_TRANSCRIPT).toBe('string');
    expect(SAMPLE_VOICE_TRANSCRIPT.length).toBeGreaterThan(20);
    expect(SAMPLE_VOICE_TRANSCRIPT).toContain('WebSocket');
  });
});
