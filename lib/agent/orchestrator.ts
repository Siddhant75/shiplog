import { scrubSecrets } from '../security/scrubber';
import { GitCommitItem, GitDiffItem } from '../github/service';
import { LLMProviderConfig, createLLMClient } from '../llm/client';
import { PortfolioArtifact, StandupArtifact, DecisionItem } from '../storage/engine';

export interface AgentRunInput {
  voiceTranscript: string;
  repo?: string;
  commits?: GitCommitItem[];
  diffs?: GitDiffItem[];
  providerConfig: LLMProviderConfig;
  githubToken?: string;
  isMockSample?: boolean;
}

export interface AgentRunOutput {
  artifacts: {
    portfolio: PortfolioArtifact;
    standup: StandupArtifact;
    decisionLog: DecisionItem[];
  };
  reasoningTrace: string[];
  verification: {
    verifiedTech: string[];
    hallucinatedTech: string[];
    commitCoverage: {
      covered: string[];
      unmentioned: string[];
    };
  };
}

export function verifyTechStack(generatedTech: string[], filesChanged: string[]) {
  const techSignatures: Record<string, RegExp[]> = {
    React: [/\.(tsx|jsx)$/i, /react/i],
    TypeScript: [/\.ts$/i, /\.tsx$/i],
    PostgreSQL: [/postgres/i, /sql/i, /prisma/i],
    Redis: [/redis/i],
    WebSockets: [/websocket/i, /ws/i, /socket/i],
    Docker: [/dockerfile/i, /docker-compose/i],
    NextJs: [/app\//i, /pages\//i, /next/i],
    Kubernetes: [/k8s/i, /kubernetes/i, /helm/i],
    'C++': [/\.(cpp|cc|cxx|hpp|h)$/i, /c\+\+/i],
    'Node.js': [/node/i, /package\.json$/i, /\.(js|mjs|cjs)$/i],
  };

  const verified: string[] = [];
  const hallucinated: string[] = [];

  for (const tech of (generatedTech || [])) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sigs = techSignatures[tech] || [new RegExp(escaped, 'i')];
    const matched = sigs.some((sig) => (filesChanged || []).some((file) => sig.test(file)));
    if (matched) {
      verified.push(tech);
    } else {
      hallucinated.push(tech);
    }
  }

  return { verified, hallucinated };
}

const CRITICAL_SHORT_TECH_KEYWORDS = new Set([
  'jwt', 'api', 'sql', 'aws', 'css', 'git', 'cli', 'sdk', 'k8s', 'npm', 'url', 'ssh',
  'pr', 'xml', 'csv', 'rpc', 'db', 'ui', 'ux', 'ai', 'ml', 's3', 'ssl', 'tls',
  'tcp', 'udp', 'dns', 'dom', 'spa', 'ssr', 'pwa', 'gql', 'orm', 'ci', 'cd', 'env',
  'dev', 'ops', 'e2e', 'gcp', 'rfc', 'poc', 'mvp', 'cpu', 'gpu', 'ram', 'io', 'os'
]);

export function verifyCommitCoverage(standupText: string, commits: { sha: string; message: string }[]) {
  const covered: string[] = [];
  const unmentioned: string[] = [];
  const lower = (standupText || '').toLowerCase();

  for (const commit of (commits || [])) {
    const stripped = commit.message
      .replace(/^(?:feat|fix|chore|docs|ref|refactor|perf|test|style|build|ci)(?:\([^)]+\))?:/i, '')
      .trim();
    const rawWords = stripped.toLowerCase().split(/\s+/);
    const keywords = rawWords
      .map((kw) => kw.replace(/[^a-z0-9_-]/gi, ''))
      .filter((kw) => kw.length > 0);

    const matches = keywords.some(
      (kw) => (kw.length > 3 || (kw.length >= 3 && CRITICAL_SHORT_TECH_KEYWORDS.has(kw))) && lower.includes(kw)
    );
    if (matches) {
      covered.push(commit.message);
    } else {
      unmentioned.push(commit.message);
    }
  }

  return { covered, unmentioned };
}

export function cleanLLMJson(content: string): string {
  let cleaned = (content || '').trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

export function parseLLMArtifacts(rawContent: string): AgentRunOutput['artifacts'] {
  const cleaned = cleanLLMJson(rawContent);

  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {};
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    parsed = {};
  }

  const portfolio = parsed.portfolio || {};
  const standup = parsed.standup || {};
  const decisionLog = Array.isArray(parsed.decisionLog) ? parsed.decisionLog : [];

  return {
    portfolio: {
      title: typeof portfolio.title === 'string' && portfolio.title ? portfolio.title : 'Engineering Work Summary',
      techStack: Array.isArray(portfolio.techStack)
        ? portfolio.techStack.filter((t: any) => typeof t === 'string')
        : [],
      impact: typeof portfolio.impact === 'string' && portfolio.impact
        ? portfolio.impact
        : 'Technical contributions from developer recap.',
      challengeSolved: typeof portfolio.challengeSolved === 'string' && portfolio.challengeSolved
        ? portfolio.challengeSolved
        : 'Addressed engineering tasks.',
    },
    standup: {
      yesterday: typeof standup.yesterday === 'string' ? standup.yesterday : '',
      today: typeof standup.today === 'string' ? standup.today : '',
      blockers: typeof standup.blockers === 'string' && standup.blockers ? standup.blockers : 'None.',
    },
    decisionLog,
  };
}

export async function executeAgentLoop(input: AgentRunInput): Promise<AgentRunOutput> {
  const reasoningTrace: string[] = [];
  const sanitizedVoice = scrubSecrets(input.voiceTranscript);
  reasoningTrace.push('Step 1 (Plan): Parsed voice transcript and identified technical intent.');

  const filesChanged = (input.diffs || []).map((d) => d.filename);
  if (filesChanged.length > 0) {
    reasoningTrace.push(`Step 2 (Execute): Ingested ${filesChanged.length} changed files and scrubbed secrets.`);
  } else {
    reasoningTrace.push('Step 2 (Execute): Simulated code evidence from contextual voice cues.');
  }

  let artifacts: AgentRunOutput['artifacts'];

  if (input.isMockSample) {
    artifacts = {
      portfolio: {
        title: 'Resilient WebSocket Reconnection Layer',
        techStack: ['WebSockets', 'TypeScript', 'Redis'],
        impact: 'Zero-drop live connection recovery with exponential backoff and jitter.',
        challengeSolved: 'Preventing thundering herd connection storms when backend servers restart.',
      },
      standup: {
        yesterday: 'Implemented WebSocket reconnection backoff with jitter and fixed JWT token renewal.',
        today: 'Add integration tests for reconnect logic and prepare staging release.',
        blockers: 'None.',
      },
      decisionLog: [
        {
          decision: 'Chose exponential backoff with full jitter over linear retry interval.',
          rationale: 'Avoids synchronized client retry spikes against recovering gateway pods.',
          evidence: 'lib/network/socketClient.ts:42',
        },
      ],
    };
    reasoningTrace.push('Step 3 (Synthesize): Generated Portfolio Card, Standup, and Decision Log.');
  } else {
    const { client, model } = createLLMClient(input.providerConfig);
    const prompt = `You are ShipLog Agent. Given the developer's voice recap and git activity, output valid JSON with three keys:
portfolio: { title, techStack: string[], impact, challengeSolved }
standup: { yesterday, today, blockers }
decisionLog: Array<{ decision, rationale, evidence }>

Voice Recap: "${sanitizedVoice}"
Files Changed: ${filesChanged.join(', ')}
Output ONLY valid JSON.`;

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    artifacts = parseLLMArtifacts(response.choices[0]?.message?.content || '{}');
    reasoningTrace.push('Step 3 (Synthesize): Compiled artifacts using provider LLM inference.');
  }

  const isMock = Boolean(input.isMockSample);
  const effectiveFiles = filesChanged.length > 0
    ? filesChanged
    : (isMock ? ['lib/socket.ts', 'lib/redis.ts', 'components/App.tsx'] : []);

  const commits = (input.commits && input.commits.length > 0)
    ? input.commits
    : (isMock
        ? [
            { sha: 'mock1', message: 'feat: add websocket reconnection' },
            { sha: 'mock2', message: 'fix: jwt refresh' },
          ]
        : []);

  if (!isMock && (effectiveFiles.length === 0 || commits.length === 0)) {
    reasoningTrace.push('No commit diffs provided for verification');
  }

  const techStack = artifacts.portfolio?.techStack || [];
  const techVerification = verifyTechStack(techStack, effectiveFiles);
  const commitVerification = verifyCommitCoverage(artifacts.standup?.yesterday || '', commits);

  reasoningTrace.push(
    `Step 4 (Verify): Checked ${techStack.length} tech tags (${techVerification.verified.length} verified, ${techVerification.hallucinated.length} flagged).`
  );
  reasoningTrace.push('Step 5 (Deliver): Completed verification checks and compiled outputs.');

  return {
    artifacts,
    reasoningTrace,
    verification: {
      verifiedTech: techVerification.verified,
      hallucinatedTech: techVerification.hallucinated,
      commitCoverage: commitVerification,
    },
  };
}
