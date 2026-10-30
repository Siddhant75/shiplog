export interface PortfolioShipItem {
  id: string;
  date: string;
  title: string;
  techStack: string[];
  impact: string;
  challengeSolved: string;
  evidence: string;
  rawDiffSnippet: string;
  verified: boolean;
  unverifiedTech?: string[];
}

export const HISTORICAL_SHIPS: PortfolioShipItem[] = [
  {
    id: 'ship-1793383029',
    date: '2026-10-30',
    title: 'Resilient WebSocket Reconnection Layer',
    techStack: ['WebSockets', 'TypeScript', 'Redis'],
    impact: 'Zero-loss connection recovery with exponential backoff and full jitter during backend deployment restarts.',
    challengeSolved: 'Preventing thundering herd reconnection storms against recovering gateway pods.',
    evidence: 'lib/network/socketClient.ts:42',
    rawDiffSnippet: `--- a/lib/network/socketClient.ts
+++ b/lib/network/socketClient.ts
@@ -39,6 +42,24 @@ export class ResilientWebSocket {
+  private backoff = new ExponentialBackoff({
+    initialInterval: 500,
+    maxInterval: 10000,
+    jitter: 'full',
+  });
+
+  async handleDisconnect(event: CloseEvent): Promise<void> {
+    const delay = this.backoff.nextDelay();
+    logger.warn(\`Connection dropped. Reconnecting in \${delay}ms with full jitter...\`);
+    await sleep(delay);
+    return this.connect();
+  }`,
    verified: true,
    unverifiedTech: ['Kubernetes'],
  },
  {
    id: 'ship-1793375821',
    date: '2026-10-28',
    title: 'Zero-Downtime PostgreSQL Schema Migration with PgBouncer',
    techStack: ['PostgreSQL', 'Docker', 'Node.js'],
    impact: 'Seamless column addition across 18M transaction records with zero write locks or client disconnections.',
    challengeSolved: 'Eliminating exclusive table locks during active payment processing windows.',
    evidence: 'db/migrations/20261028_add_idempotency_key.sql:12',
    rawDiffSnippet: `--- a/db/migrations/20261028_add_idempotency_key.sql
+++ b/db/migrations/20261028_add_idempotency_key.sql
@@ -10,4 +12,8 @@
+ALTER TABLE payment_transactions
+  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
+CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tx_idempotency
+  ON payment_transactions(idempotency_key);`,
    verified: true,
  },
  {
    id: 'ship-1793368210',
    date: '2026-10-25',
    title: 'Distributed Token Bucket Rate Limiter with Sliding Window',
    techStack: ['Redis', 'TypeScript', 'NextJs'],
    impact: 'Sub-millisecond rate limit enforcement preventing API abuse across 12,000 req/sec tier.',
    challengeSolved: 'Distributed race conditions in multi-region API gateway clusters.',
    evidence: 'middleware/rateLimiter.ts:28',
    rawDiffSnippet: `--- a/middleware/rateLimiter.ts
+++ b/middleware/rateLimiter.ts
@@ -25,5 +28,15 @@ export async function checkRateLimit(ip: string): Promise<boolean> {
+  const key = \`ratelimit:\${ip}:\${Math.floor(Date.now() / 60000)}\`;
+  const current = await redis.incr(key);
+  if (current === 1) {
+    await redis.expire(key, 120);
+  }
+  return current <= MAX_REQUESTS_PER_MINUTE;`,
    verified: true,
  },
  {
    id: 'ship-1793359124',
    date: '2026-10-22',
    title: 'Pre-Flight Secret Redactor with Deterministic Regex Scanner',
    techStack: ['TypeScript', 'DOMPurify'],
    impact: '100% prevention of credential leaks (PAT, JWT, AWS keys) before payload ingestion.',
    challengeSolved: 'Developer accident leaking .env tokens and keys into AI prompts and public diffs.',
    evidence: 'lib/security/scrubber.ts:35',
    rawDiffSnippet: `--- a/lib/security/scrubber.ts
+++ b/lib/security/scrubber.ts
@@ -32,5 +35,18 @@ export function scrubSecrets(input: string): string {
+  let sanitized = input;
+  for (const rule of SECRET_PATTERNS) {
+    sanitized = sanitized.replace(rule.regex, '[REDACTED_SECRET]');
+  }
+  return sanitized;`,
    verified: true,
  },
];

export function filterPortfolioByTech(ships: PortfolioShipItem[], techFilter: string): PortfolioShipItem[] {
  if (!techFilter || techFilter === 'All') return ships;
  const target = techFilter.toLowerCase().trim();
  return (ships || []).filter((ship) =>
    (ship.techStack || []).some((t) => t.toLowerCase().includes(target))
  );
}

export function searchPortfolio(ships: PortfolioShipItem[], query: string): PortfolioShipItem[] {
  if (!query || !query.trim()) return ships;
  const q = query.toLowerCase().trim();
  return (ships || []).filter((ship) => {
    const titleMatch = (ship.title || '').toLowerCase().includes(q);
    const impactMatch = (ship.impact || '').toLowerCase().includes(q);
    const challengeMatch = (ship.challengeSolved || '').toLowerCase().includes(q);
    const techMatch = (ship.techStack || []).some((t) => t.toLowerCase().includes(q));
    return titleMatch || impactMatch || challengeMatch || techMatch;
  });
}
