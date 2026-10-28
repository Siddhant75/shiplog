const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^credentials\.json$/i,
  /^id_rsa(\.pub)?$/i,
  /\.pem$/i,
  /secrets\.ya?ml$/i,
];

const SECRET_REGEXES = [
  { pattern: /ghp_[a-zA-Z0-9]{30,}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { pattern: /sk-(?:ant-|proj-)?[a-zA-Z0-9_-]{32,}/g, replacement: '[REDACTED_API_KEY]' },
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
  { pattern: /AIza[0-9A-Za-z-_]{25,}/g, replacement: '[REDACTED_GOOGLE_KEY]' },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[^-]+-----END [A-Z ]*PRIVATE KEY-----/g, replacement: '[REDACTED_PRIVATE_KEY]' },
];

export function scrubSecrets(input: string): string {
  let sanitized = input;
  for (const { pattern, replacement } of SECRET_REGEXES) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

export function isSensitiveFile(filename: string): boolean {
  const base = filename.split(/[/\\]/).pop() || filename;
  return SENSITIVE_FILE_PATTERNS.some((p) => p.test(base));
}
