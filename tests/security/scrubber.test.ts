import { describe, it, expect } from 'vitest';
import { scrubSecrets, isSensitiveFile } from '@/lib/security/scrubber';

describe('Secret Scrubber (Security Pillar 3)', () => {
  it('masks GitHub Personal Access Tokens and Fine-Grained PATs', () => {
    const rawClassic = 'const token = "ghp_1234567890abcdefghijklmnopqrstuv";';
    expect(scrubSecrets(rawClassic)).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(scrubSecrets(rawClassic)).not.toContain('ghp_');

    const rawFineGrained = 'token: github_pat_11ANX1234567890abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    expect(scrubSecrets(rawFineGrained)).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(scrubSecrets(rawFineGrained)).not.toContain('github_pat_');
  });

  it('masks PEM private keys even when split across git diff minus lines', () => {
    const diffPem = `
@@ -10,6 +10,6 @@
- -----BEGIN RSA PRIVATE KEY-----
- MIIEowIBAAKCAQEA0Y12345...
- -----END RSA PRIVATE KEY-----
+ // Removed private key
`;
    const clean = scrubSecrets(diffPem);
    expect(clean).toContain('[REDACTED_PRIVATE_KEY]');
    expect(clean).not.toContain('MIIEowIBAAKCAQEA0Y12345');
  });

  it('handles null, undefined, or empty inputs gracefully without throwing', () => {
    expect(scrubSecrets(null as any)).toBe('');
    expect(scrubSecrets(undefined as any)).toBe('');
    expect(scrubSecrets('')).toBe('');
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
    expect(isSensitiveFile('id_ed25519')).toBe(true);
    expect(isSensitiveFile('id_ed25519.pub')).toBe(true);
    expect(isSensitiveFile('src/auth/service.ts')).toBe(false);
  });
});
