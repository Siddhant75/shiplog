import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageEngine, ShipLogEntry } from '@/lib/storage/engine';
import fs from 'fs';
import path from 'path';

describe('Storage Engine (MemPalace / LLM Wiki)', () => {
  const testDir = path.join(process.cwd(), 'tmp-test-storage');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('stores raw transcript and verified artifacts with living index updates', () => {
    const storage = new StorageEngine(testDir);
    const entry: ShipLogEntry = {
      id: 'entry-2026-10-28',
      date: '2026-10-28',
      rawTranscript: 'Today I built the notification system and fixed auth tokens.',
      artifacts: {
        portfolio: {
          title: 'WebSocket Notifications',
          techStack: ['Redis', 'WebSockets'],
          impact: 'Realtime updates',
          challengeSolved: 'Reconnection backoff',
        },
        standup: { yesterday: 'Built notifications', today: 'Staging deploy', blockers: 'None' },
        decisionLog: [{ decision: 'Use Redis Pub/Sub', rationale: 'Horizontal scalability', evidence: 'redis.ts' }],
      },
      reasoningTrace: ['Step 1: Plan', 'Step 2: Execute', 'Step 3: Verify'],
    };

    storage.saveEntry(entry);

    const index = storage.getIndex();
    expect(index.length).toBe(1);
    expect(index[0].title).toBe('WebSocket Notifications');
    expect(index[0].techStack).toContain('Redis');

    const retrieved = storage.getEntry('entry-2026-10-28');
    expect(retrieved?.rawTranscript).toContain('Today I built the notification system');
    expect(retrieved?.artifacts.portfolio.title).toBe('WebSocket Notifications');

    // Verify verbatim raw file exists
    const rawPath = path.join(testDir, 'raw', 'entry-2026-10-28.txt');
    expect(fs.existsSync(rawPath)).toBe(true);
    expect(fs.readFileSync(rawPath, 'utf-8')).toBe(entry.rawTranscript);
  });

  it('searches entries by keyword or tech tag', () => {
    const storage = new StorageEngine(testDir);
    storage.saveEntry({
      id: 'entry-1',
      date: '2026-10-27',
      rawTranscript: 'Postgres migration',
      artifacts: {
        portfolio: { title: 'Database Optimization', techStack: ['PostgreSQL', 'Prisma'], impact: 'Faster queries' },
        standup: { yesterday: 'Migrated DB', today: 'Tests', blockers: 'None' },
        decisionLog: [],
      },
      reasoningTrace: [],
    });

    const searchRes = storage.searchEntries('PostgreSQL');
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].title).toBe('Database Optimization');

    const emptyRes = storage.searchEntries('NonExistent');
    expect(emptyRes.length).toBe(0);
  });
});
