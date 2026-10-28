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
    if (!repoString || typeof repoString !== 'string') {
      throw new Error('Invalid repository identifier. Expected format: owner/repo');
    }
    const clean = repoString
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/+$/, '')
      .replace(/\.git$/i, '');
    const parts = clean.split('/');
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
      message: item.commit?.message || '',
      author: item.commit?.author?.name || item.commit?.committer?.name || item.author?.login || 'Unknown',
      date: item.commit?.author?.date || item.commit?.committer?.date || '',
      url: item.html_url || '',
    }));
  }

  async fetchCommitDiff(repoString: string, sha: string): Promise<GitDiffItem[]> {
    const { owner, repo } = this.parseRepo(repoString);
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ShipLog-Agent',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return (data.files || []).map((file: any) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    }));
  }
}
