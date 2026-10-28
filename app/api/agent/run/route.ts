import { NextRequest, NextResponse } from 'next/server';
import { executeAgentLoop } from '@/lib/agent/orchestrator';
import { LLMProviderConfig } from '@/lib/llm/client';
import { GitHubService, GitCommitItem, GitDiffItem } from '@/lib/github/service';
import { StorageEngine, ShipLogEntry } from '@/lib/storage/engine';
import { scrubSecrets } from '@/lib/security/scrubber';

function extractString(val: unknown): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export async function POST(req: Request | NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object' },
        { status: 400 }
      );
    }

    const voiceTranscript = extractString(body.voiceTranscript);
    if (!voiceTranscript) {
      return NextResponse.json(
        { error: 'voiceTranscript is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Zero-persistence security pillar: read provider type & keys strictly from headers with body fallback
    const providerTypeHeader = req.headers.get('x-provider-type');
    const providerKeyHeader = req.headers.get('x-provider-key');
    const providerUrlHeader = req.headers.get('x-provider-url');
    const providerModelHeader = req.headers.get('x-provider-model');
    const githubTokenHeader = req.headers.get('x-github-token');

    const providerType = (
      extractString(providerTypeHeader) ||
      extractString(body.providerConfig?.provider) ||
      extractString(body.provider) ||
      'ollama'
    ).toLowerCase();

    const apiKey =
      extractString(providerKeyHeader) ||
      extractString(body.providerConfig?.apiKey) ||
      extractString(body.apiKey) ||
      '';

    const baseUrl =
      extractString(providerUrlHeader) ||
      extractString(body.providerConfig?.baseUrl) ||
      extractString(body.baseUrl);

    const model =
      extractString(providerModelHeader) ||
      extractString(body.providerConfig?.model) ||
      extractString(body.model);

    const githubToken =
      extractString(githubTokenHeader) ||
      extractString(body.githubToken);

    let providerConfig: LLMProviderConfig;

    if (providerType === 'ollama') {
      providerConfig = {
        provider: 'ollama',
        baseUrl: baseUrl || undefined,
        model: model || undefined,
      };
    } else if (providerType === 'gemini') {
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key is required for provider: gemini' },
          { status: 400 }
        );
      }
      providerConfig = { provider: 'gemini', apiKey };
    } else if (providerType === 'openai') {
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key is required for provider: openai' },
          { status: 400 }
        );
      }
      providerConfig = { provider: 'openai', apiKey };
    } else if (providerType === 'anthropic') {
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key is required for provider: anthropic' },
          { status: 400 }
        );
      }
      providerConfig = { provider: 'anthropic', apiKey };
    } else {
      return NextResponse.json(
        { error: `Unsupported or invalid provider type: ${providerType}` },
        { status: 400 }
      );
    }

    const isMockSample = Boolean(body.isMockSample);
    const repo = extractString(body.repo);
    let commits: GitCommitItem[] | undefined = Array.isArray(body.commits) ? body.commits : undefined;
    let diffs: GitDiffItem[] | undefined = Array.isArray(body.diffs) ? body.diffs : undefined;
    const warnings: string[] = [];

    // Optional GitHub commit/diff fetching if repo is provided and not a mock sample
    if (repo && !isMockSample && (!commits || !diffs)) {
      try {
        const gh = new GitHubService({ token: githubToken });
        if (!commits) {
          commits = await gh.fetchRecentCommits(repo);
        }
        if (!diffs && commits && commits.length > 0) {
          diffs = await gh.fetchCommitDiff(repo, commits[0].sha);
        }
      } catch (err: any) {
        const rawWarning = err?.message || 'Failed to fetch GitHub commits/diffs';
        warnings.push(`GitHub integration warning: ${scrubSecrets(rawWarning)}`);
      }
    }

    // Execute agent loop
    const result = await executeAgentLoop({
      voiceTranscript,
      repo,
      commits,
      diffs,
      providerConfig,
      githubToken,
      isMockSample,
    });

    if (warnings.length > 0) {
      result.reasoningTrace.push(...warnings);
    }

    // Persist to StorageEngine with clean generated ID (path-traversal safe)
    const rawId = extractString(body.id);
    const entryId = rawId && /^[a-zA-Z0-9_-]+$/.test(rawId)
      ? rawId
      : `shiplog-${Date.now()}`;

    const date = extractString(body.date) || new Date().toISOString().split('T')[0];

    const storage = new StorageEngine(process.env.STORAGE_DIR);
    const sanitizedTranscript = scrubSecrets(voiceTranscript);

    const entryToSave: ShipLogEntry = {
      id: entryId,
      date,
      rawTranscript: sanitizedTranscript,
      repoContext: repo,
      artifacts: result.artifacts,
      reasoningTrace: result.reasoningTrace,
    };

    storage.saveEntry(entryToSave);

    return NextResponse.json({
      success: true,
      entryId,
      artifacts: result.artifacts,
      reasoningTrace: result.reasoningTrace,
      verification: result.verification,
    });
  } catch (err: any) {
    const rawError = err?.message || 'Internal server error';
    return NextResponse.json(
      { error: scrubSecrets(rawError) },
      { status: 500 }
    );
  }
}
