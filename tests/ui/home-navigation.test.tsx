import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import HomePage from '@/app/page';

describe('HomePage Navigation & Branding Integration', () => {
  it('renders top navigation bar with 4 core views', () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain('Daily Ship Station');
    expect(html).toContain('Living Portfolio');
    expect(html).toContain('Wiki Vault');
    expect(html).toContain('Resume Sync');
  });

  it('renders updated brand tagline for Autonomous Dev Memory & Career Engine', () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain('ShipLog');
    expect(html).toContain('Speak for 60 seconds');
    expect(html).toContain('living portfolio');
    expect(html).toContain('updated resume');
  });

  it('renders Wispr Flow dictation pulse status', () => {
    const html = renderToString(<HomePage />);

    expect(html).toContain('Wispr Flow');
    expect(html).toContain('Hold Hotkey to Speak');
  });
});
