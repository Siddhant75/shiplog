import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { CaseStudyModal } from '@/components/CaseStudyModal';
import { HISTORICAL_SHIPS } from '@/lib/portfolio/data';

describe('CaseStudyModal Component', () => {
  it('does not render when isOpen is false or ship is null', () => {
    const html = renderToString(
      <CaseStudyModal isOpen={false} ship={null} onClose={vi.fn()} />
    );
    expect(html).toBe('');
  });

  it('renders complete architectural case study when ship is provided', () => {
    const ship = HISTORICAL_SHIPS[0];
    const html = renderToString(
      <CaseStudyModal isOpen={true} ship={ship} onClose={vi.fn()} />
    );

    expect(html).toContain('Project Case Study');
    expect(html).toContain('Resilient WebSocket Reconnection Layer');
    expect(html).toContain('Business Impact');
    expect(html).toContain('Engineering Challenge Solved');
    expect(html).toContain('Grounded Code Diff Proof');
    expect(html).toContain('socketClient.ts:42');
  });
});
