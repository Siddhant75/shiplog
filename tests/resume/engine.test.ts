import { describe, it, expect } from 'vitest';
import {
  generateGoogleXYZBullet,
  generateQuarterlyBragDoc,
  synthesizeUpdatedResume,
  DEFAULT_BASE_RESUME,
  ResumeBulletPoint,
} from '@/lib/resume/engine';
import { PortfolioArtifact, DecisionItem } from '@/lib/storage/engine';

describe('Resume & Brag Sheet Synthesizer Sub-Agent', () => {
  const samplePortfolio: PortfolioArtifact = {
    title: 'Resilient WebSocket Reconnection Layer',
    techStack: ['WebSockets', 'TypeScript', 'Redis'],
    impact: 'Zero-loss connection recovery with exponential backoff and jitter.',
    challengeSolved: 'Preventing thundering herd connection storms when backend servers restart.',
  };

  const sampleDecisions: DecisionItem[] = [
    {
      decision: 'Chose exponential backoff with full jitter over linear retry interval.',
      rationale: 'Avoids synchronized client retry spikes against recovering gateway pods.',
      evidence: 'lib/network/socketClient.ts:42',
    },
  ];

  it('generates high-impact Google XYZ formula bullets from portfolio artifacts', () => {
    const bullet = generateGoogleXYZBullet(samplePortfolio, '2026-10-30');

    expect(bullet).toBeDefined();
    expect(bullet.date).toBe('2026-10-30');
    expect(bullet.verifiedTech).toContain('WebSockets');
    expect(bullet.verifiedTech).toContain('TypeScript');
    // Google XYZ formula: Accomplished [X] as measured by [Y] by doing [Z]
    expect(bullet.bullet).toContain('WebSocket');
    expect(bullet.bullet.toLowerCase()).toMatch(/achiev|reduc|mitigat|prevent|engineer|architect|implement/);
    expect(bullet.rawFormula.action).toBeTruthy();
    expect(bullet.rawFormula.impact).toBeTruthy();
    expect(bullet.rawFormula.tech).toBeTruthy();
  });

  it('formats a Julia Evans style Quarterly Brag Document', () => {
    const bragDoc = generateQuarterlyBragDoc([samplePortfolio], sampleDecisions);

    expect(bragDoc).toContain('# Engineering Brag Document');
    expect(bragDoc).toContain('## 🚀 Projects Shipped & Core Impact');
    expect(bragDoc).toContain('Resilient WebSocket Reconnection Layer');
    expect(bragDoc).toContain('## 🏛️ Architectural Decisions & Tradeoffs');
    expect(bragDoc).toContain('Chose exponential backoff with full jitter');
    expect(bragDoc).toContain('## 🛠️ Technologies Mastered');
    expect(bragDoc).toContain('WebSockets');
  });

  it('synthesizes updated resume markdown with green diff highlights and ATS score', () => {
    const bullet: ResumeBulletPoint = generateGoogleXYZBullet(samplePortfolio, '2026-10-30');
    const revision = synthesizeUpdatedResume(DEFAULT_BASE_RESUME, [bullet]);

    expect(revision.originalMarkdown).toBe(DEFAULT_BASE_RESUME);
    expect(revision.updatedMarkdown).toContain(bullet.bullet);
    expect(revision.newBullets.length).toBe(1);
    expect(revision.atsScore).toBeGreaterThanOrEqual(90);
    expect(revision.atsScore).toBeLessThanOrEqual(100);
    expect(revision.lastUpdated).toBeTruthy();
  });

  it('handles empty or sparse portfolio input gracefully', () => {
    const sparsePortfolio: PortfolioArtifact = {
      title: 'Bugfix in auth handler',
      techStack: [],
      impact: '',
    };
    const bullet = generateGoogleXYZBullet(sparsePortfolio);
    expect(bullet.bullet).toBeTruthy();
    expect(bullet.verifiedTech).toEqual([]);
  });
});
