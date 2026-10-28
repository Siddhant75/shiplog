# ShipLog Core Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build ShipLog — an agentic voice-driven developer companion that autonomously ingests 60-second voice daily recaps, cross-references scrubbed git activity, plans tool usage, synthesizes portfolio cards, standup updates, and grounded decision logs, verifies outputs for hallucinations, and supports both BYOK cloud LLMs and air-gapped local Ollama.

**Architecture:** Next.js 14 App Router full-stack architecture using a stateless, zero-persistence serverless proxy for credentials. An autonomous 5-step agent loop (Plan → Execute → Synthesize → Verify → Deliver) leverages open-source memory patterns (verbatim raw logs, living index, deterministic linting) and enforces a 5-pillar security architecture (secret scrubbing, ephemeral headers, read-only PATs, air-gapped Ollama option, and DOMPurify sanitization).

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, OpenAI SDK (universal adapter for Gemini, OpenAI, Anthropic, and Ollama), DOMPurify, Vitest (for TDD test suite).

---

### Task 1: Scaffolding, Tooling & Test Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Test: `tests/sanity.test.ts`

**Step 1: Write the failing test**
Create `tests/sanity.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
  it('environment runs vitest tests cleanly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/sanity.test.ts`
Expected: FAIL (packages not yet installed or config missing).

**Step 3: Write minimal implementation**
1. Create `package.json` with scripts: `dev`, `build`, `start`, `test: vitest run`.
2. Install dependencies: `next`, `react`, `react-dom`, `lucide-react`, `openai`, `dompurify`, `isomorphic-dompurify`.
3. Install devDependencies: `typescript`, `@types/react`, `@types/node`, `@types/dompurify`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`.
4. Create `tsconfig.json`, `vitest.config.ts`, `tailwind.config.js`, `postcss.config.js`, and `app/layout.tsx`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/sanity.test.ts`
Expected: PASS.

**Step 5: Commit**
Follow conventional commit per `commit` skill:
```bash
git add .
git commit -m "chore(setup): Initialize Next.js 14 project with Vitest and Tailwind"
```

---

### Task 2: Secret Scrubbing Utility (Pillar 3 Security)

**Files:**
- Create: `lib/security/scrubber.ts`
- Test: `tests/security/scrubber.test.ts`

**Step 1: Write the failing test**
Create `tests/security/scrubber.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/security/scrubber.test.ts`
Expected: FAIL (module `@/lib/security/scrubber` not found).

**Step 3: Write minimal implementation**
Create `lib/security/scrubber.ts`:
```typescript
const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^credentials\.json$/i,
  /^id_rsa(\.pub)?$/i,
  /\.pem$/i,
  /secrets\.ya?ml$/i,
];

const SECRET_REGEXES = [
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { pattern: /sk-(?:ant-|proj-)?[a-zA-Z0-9_-]{32,}/g, replacement: '[REDACTED_API_KEY]' },
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
  { pattern: /AIza[0-9A-Za-z-_]{35}/g, replacement: '[REDACTED_GOOGLE_KEY]' },
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
  const base = filename.split('/').pop() || filename;
  return SENSITIVE_FILE_PATTERNS.some((p) => p.test(base));
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/security/scrubber.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add lib/security/scrubber.ts tests/security/scrubber.test.ts
git commit -m "feat(security): Implement pre-flight secret scrubber and sensitive file filter"
```

---

### Task 3: Provider-Agnostic LLM Client Factory (BYOK + Ollama)

**Files:**
- Create: `lib/llm/client.ts`
- Test: `tests/llm/client.test.ts`

**Step 1: Write the failing test**
Create `tests/llm/client.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createLLMClient, LLMProviderConfig } from '@/lib/llm/client';

describe('Universal LLM Client Factory', () => {
  it('configures Ollama with default localhost baseURL', () => {
    const config: LLMProviderConfig = { provider: 'ollama' };
    const { client, model } = createLLMClient(config);
    expect(client.baseURL).toContain('11434');
    expect(model).toBe('llama3.2');
  });

  it('configures Gemini with Google OpenAI-compatible endpoint', () => {
    const config: LLMProviderConfig = { provider: 'gemini', apiKey: 'fake-gemini-key' };
    const { client, model } = createLLMClient(config);
    expect(client.baseURL).toContain('generativelanguage.googleapis.com');
    expect(client.apiKey).toBe('fake-gemini-key');
    expect(model).toBe('gemini-1.5-flash');
  });

  it('configures OpenAI and Anthropic properly', () => {
    const openaiConfig: LLMProviderConfig = { provider: 'openai', apiKey: 'fake-openai-key' };
    const { client: oClient, model: oModel } = createLLMClient(openaiConfig);
    expect(oClient.apiKey).toBe('fake-openai-key');
    expect(oModel).toBe('gpt-4o-mini');

    const anthropicConfig: LLMProviderConfig = { provider: 'anthropic', apiKey: 'fake-anthropic-key' };
    const { client: aClient } = createLLMClient(anthropicConfig);
    expect(aClient.baseURL).toContain('anthropic.com');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/llm/client.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
Create `lib/llm/client.ts`:
```typescript
import OpenAI from 'openai';

export type LLMProviderConfig =
  | { provider: 'gemini'; apiKey: string }
  | { provider: 'openai'; apiKey: string }
  | { provider: 'anthropic'; apiKey: string }
  | { provider: 'ollama'; baseUrl?: string; model?: string };

export function createLLMClient(config: LLMProviderConfig): { client: OpenAI; model: string } {
  switch (config.provider) {
    case 'ollama':
      return {
        client: new OpenAI({
          baseURL: (config.baseUrl || 'http://localhost:11434') + '/v1',
          apiKey: 'ollama',
        }),
        model: config.model || 'llama3.2',
      };
    case 'gemini':
      return {
        client: new OpenAI({
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: config.apiKey,
        }),
        model: 'gemini-1.5-flash',
      };
    case 'openai':
      return {
        client: new OpenAI({ apiKey: config.apiKey }),
        model: 'gpt-4o-mini',
      };
    case 'anthropic':
      return {
        client: new OpenAI({
          baseURL: 'https://api.anthropic.com/v1/',
          apiKey: config.apiKey,
        }),
        model: 'claude-3-5-haiku-latest',
      };
  }
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/llm/client.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add lib/llm/client.ts tests/llm/client.test.ts
git commit -m "feat(llm): Implement provider-agnostic client factory for BYOK and Ollama"
```

---

### Task 4: GitHub API Read-Only Service

**Files:**
- Create: `lib/github/service.ts`
- Test: `tests/github/service.test.ts`

**Step 1: Write the failing test**
Create `tests/github/service.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { GitHubService } from '@/lib/github/service';

describe('GitHub Read-Only Service', () => {
  it('parses repository owner and name correctly', () => {
    const service = new GitHubService({ token: 'ghp_test' });
    const { owner, repo } = service.parseRepo('vercel/next.js');
    expect(owner).toBe('vercel');
    expect(repo).toBe('next.js');
  });

  it('throws helpful error for invalid repo format', () => {
    const service = new GitHubService();
    expect(() => service.parseRepo('invalid-repo')).toThrow('Expected format: owner/repo');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/github/service.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
Create `lib/github/service.ts`:
```typescript
export interface GitCommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitDiffItem {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export class GitHubService {
  private token?: string;

  constructor(options?: { token?: string }) {
    this.token = options?.token;
  }

  parseRepo(repoString: string): { owner: string; repo: string } {
    const parts = repoString.trim().split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid repository identifier. Expected format: owner/repo');
    }
    return { owner: parts[0], repo: parts[1] };
  }

  async fetchRecentCommits(repoString: string, sinceDate?: string): Promise<GitCommitItem[]> {
    const { owner, repo } = this.parseRepo(repoString);
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
    if (sinceDate) {
      url.searchParams.set('since', sinceDate);
    }
    url.searchParams.set('per_page', '10');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ShipLog-Agent',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((item: any) => ({
      sha: item.sha,
      message: item.commit.message,
      author: item.commit.author.name,
      date: item.commit.author.date,
      url: item.html_url,
    }));
  }
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/github/service.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add lib/github/service.ts tests/github/service.test.ts
git commit -m "feat(github): Implement read-only GitHub API service with token auth"
```

---

### Task 5: Local Verbatim Storage & Index Engine (LLM Wiki & MemPalace Pattern)

**Files:**
- Create: `lib/storage/engine.ts`
- Test: `tests/storage/engine.test.ts`

**Step 1: Write the failing test**
Create `tests/storage/engine.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
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

  it('stores raw transcript and verified artifacts with living index updates', () => {
    const storage = new StorageEngine(testDir);
    const entry: ShipLogEntry = {
      id: 'entry-2026-10-28',
      date: '2026-10-28',
      rawTranscript: 'Today I built the notification system and fixed auth tokens.',
      artifacts: {
        portfolio: { title: 'WebSocket Notifications', techStack: ['Redis', 'WebSockets'], impact: 'Realtime updates' },
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
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/storage/engine.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
Create `lib/storage/engine.ts`:
```typescript
import fs from 'fs';
import path from 'path';

export interface PortfolioArtifact {
  title: string;
  techStack: string[];
  impact: string;
  challengeSolved?: string;
}

export interface StandupArtifact {
  yesterday: string;
  today: string;
  blockers: string;
}

export interface DecisionItem {
  decision: string;
  rationale: string;
  evidence: string;
}

export interface ShipLogEntry {
  id: string;
  date: string;
  rawTranscript: string;
  repoContext?: string;
  artifacts: {
    portfolio: PortfolioArtifact;
    standup: StandupArtifact;
    decisionLog: DecisionItem[];
  };
  reasoningTrace: string[];
}

export interface IndexItem {
  id: string;
  date: string;
  title: string;
  techStack: string[];
}

export class StorageEngine {
  private baseDir: string;

  constructor(baseDir: string = path.join(process.cwd(), 'data')) {
    this.baseDir = baseDir;
    this.ensureDirs();
  }

  private ensureDirs() {
    fs.mkdirSync(path.join(this.baseDir, 'raw'), { recursive: true });
    fs.mkdirSync(path.join(this.baseDir, 'entries'), { recursive: true });
  }

  saveEntry(entry: ShipLogEntry): void {
    this.ensureDirs();
    // 1. Verbatim raw storage
    fs.writeFileSync(path.join(this.baseDir, 'raw', `${entry.id}.txt`), entry.rawTranscript, 'utf-8');

    // 2. Verified structured entry
    fs.writeFileSync(path.join(this.baseDir, 'entries', `${entry.id}.json`), JSON.stringify(entry, null, 2), 'utf-8');

    // 3. Update living index
    const index = this.getIndex().filter((item) => item.id !== entry.id);
    index.unshift({
      id: entry.id,
      date: entry.date,
      title: entry.artifacts.portfolio.title,
      techStack: entry.artifacts.portfolio.techStack,
    });
    fs.writeFileSync(path.join(this.baseDir, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
  }

  getIndex(): IndexItem[] {
    const indexPath = path.join(this.baseDir, 'index.json');
    if (!fs.existsSync(indexPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  getEntry(id: string): ShipLogEntry | null {
    const entryPath = path.join(this.baseDir, 'entries', `${id}.json`);
    if (!fs.existsSync(entryPath)) return null;
    return JSON.parse(fs.readFileSync(entryPath, 'utf-8'));
  }
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/storage/engine.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add lib/storage/engine.ts tests/storage/engine.test.ts
git commit -m "feat(storage): Implement verbatim storage and index engine"
```

---

### Task 6: Autonomous Agent Loop & Verification Engine

**Files:**
- Create: `lib/agent/orchestrator.ts`
- Test: `tests/agent/orchestrator.test.ts`

**Step 1: Write the failing test**
Create `tests/agent/orchestrator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { verifyTechStack, verifyCommitCoverage } from '@/lib/agent/orchestrator';

describe('Agent Verification Engine', () => {
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
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/agent/orchestrator.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
Create `lib/agent/orchestrator.ts`:
```typescript
import { scrubSecrets } from '../security/scrubber';
import { GitCommitItem } from '../github/service';

export interface VerificationResult {
  verified: string[];
  hallucinated: string[];
}

export function verifyTechStack(generatedTech: string[], filesChanged: string[]): VerificationResult {
  const fileExtsAndPaths = filesChanged.join(' ').toLowerCase();
  const techSignatures: Record<string, RegExp[]> = {
    React: [/\.(tsx|jsx)$/i, /react/i],
    TypeScript: [/\.ts$/i, /\.tsx$/i],
    PostgreSQL: [/postgres/i, /sql/i, /prisma/i],
    Redis: [/redis/i],
    WebSockets: [/websocket/i, /ws/i, /socket/i],
    Docker: [/dockerfile/i, /docker-compose/i],
  };

  const verified: string[] = [];
  const hallucinated: string[] = [];

  for (const tech of generatedTech) {
    const sigs = techSignatures[tech];
    if (!sigs) {
      verified.push(tech); // Trust if unknown signature
      continue;
    }
    const matched = sigs.some((sig) => sig.test(fileExtsAndPaths));
    if (matched) {
      verified.push(tech);
    } else {
      hallucinated.push(tech);
    }
  }

  return { verified, hallucinated };
}

export function verifyCommitCoverage(standupText: string, commits: { sha: string; message: string }[]) {
  const covered: string[] = [];
  const unmentioned: string[] = [];
  const lower = standupText.toLowerCase();

  for (const commit of commits) {
    const keywords = commit.message.toLowerCase().replace(/^(feat|fix|chore|docs|ref):/, '').trim().split(/\s+/);
    const matches = keywords.some((kw) => kw.length > 3 && lower.includes(kw));
    if (matches) {
      covered.push(commit.message);
    } else {
      unmentioned.push(commit.message);
    }
  }

  return { covered, unmentioned };
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/agent/orchestrator.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add lib/agent/orchestrator.ts tests/agent/orchestrator.test.ts
git commit -m "feat(agent): Implement verification engine for tech stack and commit coverage"
```

---

### Task 7: Stateless Serverless API Endpoint (`/api/agent/run`)

**Files:**
- Create: `app/api/agent/run/route.ts`
- Test: `tests/api/agent-run.test.ts`

**Step 1: Write the failing test**
Create `tests/api/agent-run.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/agent/run/route';

describe('Stateless Serverless Agent Endpoint', () => {
  it('returns 400 when voiceTranscript is missing', async () => {
    const req = new Request('http://localhost:3000/api/agent/run', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('voiceTranscript is required');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/api/agent-run.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
Create `app/api/agent/run/route.ts` parsing input, receiving credentials strictly via headers (`x-provider-key`, `x-github-token`), performing secret scrubbing on inputs, executing the synthesis step, running verification, and returning verified artifacts alongside the full reasoning trace.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/api/agent-run.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add app/api/agent/run/route.ts tests/api/agent-run.test.ts
git commit -m "feat(api): Implement stateless zero-persistence agent execution endpoint"
```

---

### Task 8: Interactive UI Dashboard with 1-Click Demo & DOMPurify

**Files:**
- Create: `components/SettingsModal.tsx`
- Create: `components/VoiceInputArea.tsx`
- Create: `components/ArtifactsView.tsx`
- Create: `components/SampleDataButton.tsx`
- Create: `app/page.tsx`
- Test: `tests/ui/render.test.ts`

**Step 1: Write the failing test**
Create `tests/ui/render.test.ts` verifying sample data loads correctly and sanitization works.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/ui/render.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
Implement the components:
- `SettingsModal`: Session-only BYOK storage + Ollama configuration.
- `VoiceInputArea`: Dictation target area compatible with Wispr Flow global hotkeys.
- `SampleDataButton`: 1-click test button pre-populating a real-world developer voice journal entry and git commits.
- `ArtifactsView`: Tabbed layout for Portfolio Card, Standup Update, Decision Log, and Live Reasoning Trace with DOMPurify sanitization.
- `app/page.tsx`: Main page assembling the entire experience with dark/light developer aesthetic.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/ui/render.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add components/ app/page.tsx tests/ui/
git commit -m "feat(ui): Build responsive developer dashboard with 1-click sample demo"
```

---

### Task 9: Inverted README & Hackathon Video Demo Prep

**Files:**
- Create: `README.md`
- Create: `docs/DEMO_SCRIPT.md`

**Step 1: Write inverted README and video walkthrough script**
Invert README per `hackathon-product-strategy` standard:
1. Live Demo link + 2-minute video link
2. The Painful Problem
3. How Wispr Flow Powers the "No Hands" Build
4. The 5-Pillar Security Model & Open-Source Architecture (LLM Wiki & MemPalace)
5. 30-Second Quickstart

**Step 2: Verify all tests in test suite pass**
Run: `npm run test`
Expected: 100% test pass rate.

**Step 3: Commit**
```bash
git add README.md docs/DEMO_SCRIPT.md
git commit -m "docs: Add Inverted README and hackathon demo script"
```
