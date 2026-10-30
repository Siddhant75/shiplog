import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { PortfolioView } from '@/components/PortfolioView';
import { HISTORICAL_SHIPS } from '@/lib/portfolio/data';

describe('PortfolioView Component', () => {
  it('renders developer profile header and metrics banner', () => {
    const html = renderToString(<PortfolioView ships={HISTORICAL_SHIPS} />);

    expect(html).toContain('Living Developer Portfolio');
    expect(html).toContain('Verified Ships');
    expect(html).toContain('Code Grounded');
    expect(html).toContain('Share Portfolio');
  });

  it('renders tech filter chips and search bar', () => {
    const html = renderToString(<PortfolioView ships={HISTORICAL_SHIPS} />);

    expect(html).toContain('Filter by Technology');
    expect(html).toContain('WebSockets');
    expect(html).toContain('TypeScript');
    expect(html).toContain('Redis');
  });

  it('renders historical ships with verified tags and evidence anchors', () => {
    const html = renderToString(<PortfolioView ships={HISTORICAL_SHIPS} />);

    expect(html).toContain('Resilient WebSocket Reconnection Layer');
    expect(html).toContain('Zero-Downtime PostgreSQL Schema Migration');
    expect(html).toContain('socketClient.ts:42');
    expect(html).toContain('Kubernetes');
  });
});
