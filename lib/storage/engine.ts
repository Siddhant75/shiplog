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

function sanitizeId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid entry ID: ID must be a non-empty string');
  }
  const trimmed = id.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error(`Invalid entry ID "${id}": only alphanumeric, hyphen, and underscore characters are allowed`);
  }
  return trimmed;
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
    const cleanId = sanitizeId(entry.id);
    this.ensureDirs();
    // 1. Verbatim raw storage (Raw Voice Vault)
    fs.writeFileSync(path.join(this.baseDir, 'raw', `${cleanId}.txt`), entry.rawTranscript, 'utf-8');

    // 2. Verified structured entry (Structured Knowledge Layer)
    fs.writeFileSync(path.join(this.baseDir, 'entries', `${cleanId}.json`), JSON.stringify(entry, null, 2), 'utf-8');

    // 3. Update living index
    const index = this.getIndex().filter((item) => item.id !== cleanId);
    index.unshift({
      id: cleanId,
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
      const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getEntry(id: string): ShipLogEntry | null {
    try {
      const cleanId = sanitizeId(id);
      const entryPath = path.join(this.baseDir, 'entries', `${cleanId}.json`);
      if (!fs.existsSync(entryPath)) return null;
      return JSON.parse(fs.readFileSync(entryPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  searchEntries(query: string): IndexItem[] {
    const q = (query || '').toLowerCase().trim();
    const index = this.getIndex();
    if (!q) return index;
    return index.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const techMatch = Array.isArray(item.techStack) && item.techStack.some((tech) => (tech || '').toLowerCase().includes(q));
      return titleMatch || techMatch;
    });
  }
}
