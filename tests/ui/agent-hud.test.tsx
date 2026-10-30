import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AgentExecutionHUD } from '@/components/AgentExecutionHUD';

describe('AgentExecutionHUD Component', () => {
  it('does not render HTML output when isRunning is false', () => {
    const html = renderToString(<AgentExecutionHUD isRunning={false} currentStep={0} />);
    expect(html).toBe('');
  });

  it('renders all 5 execution pipeline milestones when isRunning is true', () => {
    const html = renderToString(<AgentExecutionHUD isRunning={true} currentStep={3} />);

    expect(html).toContain('Autonomous Agent Execution Pipeline');
    expect(html).toContain('Pre-flight secret scrubber running');
    expect(html).toContain('Ingesting repository diff context');
    expect(html).toContain('Multi-format synthesis');
    expect(html).toContain('Cross-referencing tech tags');
    expect(html).toContain('Updating Living Portfolio');
    expect(html).toContain('data-step="3"');
  });
});
