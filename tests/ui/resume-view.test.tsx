import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ResumeSyncView } from '@/components/ResumeSyncView';
import { generateGoogleXYZBullet } from '@/lib/resume/engine';

describe('ResumeSyncView Component', () => {
  const sampleBullet = generateGoogleXYZBullet({
    title: 'Resilient WebSocket Reconnection Layer',
    techStack: ['WebSockets', 'TypeScript'],
    impact: 'Zero-loss connection recovery.',
    challengeSolved: 'Preventing thundering herd storms.',
  });

  it('renders ATS impact score and Google XYZ formula bullets', () => {
    const html = renderToString(<ResumeSyncView bullets={[sampleBullet]} />);

    expect(html).toContain('Resume Sync Sub-Agent');
    expect(html).toContain('ATS Impact Score');
    expect(html).toContain('Google XYZ-Formula Bullets');
    expect(html).toContain('WebSocket');
  });

  it('provides dual tabs for ATS Resume Revision and Quarterly Brag Document', () => {
    const html = renderToString(<ResumeSyncView bullets={[sampleBullet]} />);

    expect(html).toContain('ATS Resume Revision');
    expect(html).toContain('Quarterly Brag Document');
    expect(html).toContain('Copy Bullets');
  });
});
