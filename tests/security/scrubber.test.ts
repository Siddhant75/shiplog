import { describe, it, expect } from 'vitest';
import { scrubSecrets, isSensitiveFile } from '@/lib/security/scrubber';

describe('Secret Scrubber (Security Pillar 3)', () => {
  it('masks GitHub Personal Access Tokens', () => {
    const raw = 'const token = "ghp_1234567890abcdefghijklmnopqrstuv";';
    const clean = scrubSecrets(raw);
    expect(clean).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(clean).not.toContain('ghp_');
  });

  it('masks OpenAI/Anthropic API keys', () => {
    const raw = 'const key = "sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz-1234";';
    const clean = scrubSecrets(raw);
    expect(clean).toContain('[REDACTED_API_KEY]');
    expect(clean).not.toContain('sk-ant');
  });

  it('masks AWS access keys and Google AIza keys', () => {
    const raw = 'AWS: AKIAIOSFODNN7EXAMPLE, Gemini: AIzaSyD-1234567890abcdefghijk_lmn';
    const clean = scrubSecrets(raw);
    expect(clean).toContain('[REDACTED_AWS_KEY]');
    expect(clean).toContain('[REDACTED_GOOGLE_KEY]');
  });

  it('identifies and blacklists sensitive credential files', () => {
    expect(isSensitiveFile('.env')).toBe(true);
    expect(isSensitiveFile('.env.production')).toBe(true);
    expect(isSensitiveFile('credentials.json')).toBe(true);
    expect(isSensitiveFile('id_rsa')).toBe(true);
    expect(isSensitiveFile('src/auth/service.ts')).toBe(false);
  });
});
