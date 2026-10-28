import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubService } from '@/lib/github/service';

describe('GitHub Read-Only Service (Pillar 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses repository owner and name correctly from various input formats', () => {
    const service = new GitHubService({ token: 'ghp_test' });
    expect(service.parseRepo('vercel/next.js')).toEqual({ owner: 'vercel', repo: 'next.js' });
    expect(service.parseRepo('https://github.com/facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
    expect(service.parseRepo('https://github.com/owner/repo.git')).toEqual({ owner: 'owner', repo: 'repo' });
    expect(service.parseRepo('owner/repo/')).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('handles null author in commits gracefully', async () => {
    const mockCommits = [
      {
        sha: 'xyz987',
        commit: {
          message: 'chore: automated release',
          author: null,
          committer: { name: 'Bot', date: '2026-10-28T12:00:00Z' },
        },
        html_url: 'https://github.com/user/repo/commit/xyz987',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCommits,
    } as any);

    const service = new GitHubService();
    const commits = await service.fetchRecentCommits('user/repo');
    expect(commits.length).toBe(1);
    expect(commits[0].author).toBe('Bot');
  });

  it('throws helpful error for invalid repo format', () => {
    const service = new GitHubService();
    expect(() => service.parseRepo('invalid-repo')).toThrow('Invalid repository identifier. Expected format: owner/repo');
  });

  it('fetches recent commits with proper headers and mapping', async () => {
    const mockCommits = [
      {
        sha: 'abc1234',
        commit: {
          message: 'feat: add websocket reconnect',
          author: { name: 'Dev', date: '2026-10-28T12:00:00Z' },
        },
        html_url: 'https://github.com/user/repo/commit/abc1234',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCommits,
    } as any);

    const service = new GitHubService({ token: 'ghp_mock' });
    const commits = await service.fetchRecentCommits('user/repo');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/repos/user/repo/commits'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token ghp_mock',
          'User-Agent': 'ShipLog-Agent',
        }),
      })
    );
    expect(commits.length).toBe(1);
    expect(commits[0].sha).toBe('abc1234');
    expect(commits[0].message).toBe('feat: add websocket reconnect');
  });

  it('fetches commit diff files correctly', async () => {
    const mockCommitDetails = {
      files: [
        {
          filename: 'lib/socket.ts',
          status: 'modified',
          additions: 45,
          deletions: 5,
          patch: '@@ -1,5 +1,45 @@\n+export function reconnect()',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCommitDetails,
    } as any);

    const service = new GitHubService();
    const diffs = await service.fetchCommitDiff('user/repo', 'abc1234');

    expect(diffs.length).toBe(1);
    expect(diffs[0].filename).toBe('lib/socket.ts');
    expect(diffs[0].additions).toBe(45);
  });
});
