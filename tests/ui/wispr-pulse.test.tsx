import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { WisprPulse } from '@/components/WisprPulse';

describe('WisprPulse Audio Visualizer Component', () => {
  it('renders idle status when not actively dictating', () => {
    const html = renderToString(<WisprPulse isListening={false} />);
    expect(html).toContain('Wispr Flow');
    expect(html).toContain('Hold Hotkey to Speak');
  });

  it('renders listening active state with pulsing wave bars', () => {
    const html = renderToString(<WisprPulse isListening={true} />);
    expect(html).toContain('Wispr Flow Dictating Active');
    expect(html).toContain('data-active="true"');
  });
});
