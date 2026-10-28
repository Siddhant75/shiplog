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
    // 1. Verbatim raw storage (MemPalace pattern)
    fs.writeFileSync(path.join(this.baseDir, 'raw', `${entry.id}.txt`), entry.rawTranscript, 'utf-8');

    // 2. Verified structured entry (LLM Wiki derived knowledge layer)
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
    try {
      return JSON.parse(fs.readFileSync(entryPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  searchEntries(query: string): IndexItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getIndex();
    return this.getIndex().filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.techStack.some((tech) => tech.toLowerCase().includes(q))
    );
  }
}
