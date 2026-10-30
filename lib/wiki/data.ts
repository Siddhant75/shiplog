import { DecisionItem } from '../storage/engine';

export interface WikiTopicHub {
  id: string;
  slug: string;
  name: string;
  summary: string;
  relatedTech: string[];
  adrs: DecisionItem[];
  verbatimVault: Array<{
    date: string;
    title: string;
    transcript: string;
  }>;
}

export const WIKI_TOPIC_HUBS: WikiTopicHub[] = [
  {
    id: 'hub-networking',
    slug: 'networking-realtime',
    name: '[[Networking & Real-Time]]',
    summary: 'Architectural designs and recovery primitives for high-concurrency WebSocket channels, reconnection backoff, and event streaming.',
    relatedTech: ['WebSockets', 'TypeScript', 'Redis'],
    adrs: [
      {
        decision: 'Chose exponential backoff with full jitter over linear retry interval.',
        rationale: 'Avoids synchronized client retry spikes against recovering gateway pods during deployments.',
        evidence: 'lib/network/socketClient.ts:42',
      },
      {
        decision: 'Enforced Redis Pub/Sub for cross-pod broadcast synchronization.',
        rationale: 'Decouples client socket handlers from server topology, enabling horizontal autoscaling.',
        evidence: 'lib/network/pubsub.ts:18',
      },
    ],
    verbatimVault: [
      {
        date: '2026-10-30',
        title: 'Voice Recap: WebSocket Reconnect',
        transcript: 'Today I shipped the resilient WebSocket reconnection mechanism using exponential backoff with full jitter in TypeScript. This prevents server reconnect storms on restart, improving client recovery during deployments.',
      },
    ],
  },
  {
    id: 'hub-security',
    slug: 'security-privacy',
    name: '[[Security & Zero-Persistence]]',
    summary: '5-Pillar security architecture: ephemeral in-memory credential storage, pre-flight diff regex redactor, and DOMPurify rendering.',
    relatedTech: ['Security', 'DOMPurify', 'TypeScript'],
    adrs: [
      {
        decision: 'Enforced zero-persistence ephemeral headers for all BYOK provider credentials.',
        rationale: 'Prevents XSS extraction from localStorage and guarantees no database caches user API keys.',
        evidence: 'app/api/agent/run/route.ts:50',
      },
      {
        decision: 'Pre-flight regex scrubber filters out private keys and .env files before LLM payload creation.',
        rationale: 'Eliminates proprietary leakage risks before network transmission.',
        evidence: 'lib/security/scrubber.ts:35',
      },
    ],
    verbatimVault: [
      {
        date: '2026-10-22',
        title: 'Voice Recap: Secret Scrubber',
        transcript: 'Built the pre-flight secret redactor to scrub JWTs, AWS credentials, and PAT tokens before git diffs hit any AI provider. Works 100% offline.',
      },
    ],
  },
  {
    id: 'hub-database',
    slug: 'database-storage',
    name: '[[Database & Infrastructure]]',
    summary: 'Zero-downtime schema migrations, concurrent indexing, connection pooling with PgBouncer, and local-first memory palaces.',
    relatedTech: ['PostgreSQL', 'Docker', 'Redis'],
    adrs: [
      {
        decision: 'Applied CONCURRENTLY to all PostgreSQL index creations.',
        rationale: 'Prevents exclusive SHARE table locks on transaction tables handling active checkouts.',
        evidence: 'db/migrations/20261028_add_idempotency_key.sql:12',
      },
    ],
    verbatimVault: [
      {
        date: '2026-10-28',
        title: 'Voice Recap: Postgres Migration',
        transcript: 'Executed the zero-downtime PostgreSQL schema migration with PgBouncer today. Added the idempotency column across 18 million rows without any table locks.',
      },
    ],
  },
];
