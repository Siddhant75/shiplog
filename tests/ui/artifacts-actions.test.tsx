import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { Toast } from '@/components/Toast';
import {
  formatSlackStandup,
  formatADRMarkdown,
  ArtifactsView,
} from '@/components/ArtifactsView';

describe('Developer Export Actions & Toast System', () => {
  it('formats Slack standup update with formatted emojis and bullet sections', () => {
    const slackText = formatSlackStandup({
      yesterday: 'Built WebSocket layer.',
      today: 'Write integration tests.',
      blockers: 'None.',
    });

    expect(slackText).toContain(':white_check_mark: *Yesterday:*');
    expect(slackText).toContain('Built WebSocket layer.');
    expect(slackText).toContain(':dart: *Today:*');
    expect(slackText).toContain(':construction: *Blockers:*');
  });

  it('formats markdown ADR deliverable with evidence anchors', () => {
    const adrMd = formatADRMarkdown({
      decision: 'Chose exponential backoff with full jitter.',
      rationale: 'Avoids reconnect storms.',
      evidence: 'lib/network/socketClient.ts:42',
    });

    expect(adrMd).toContain('# Architectural Decision Record (ADR)');
    expect(adrMd).toContain('Chose exponential backoff with full jitter.');
    expect(adrMd).toContain('lib/network/socketClient.ts:42');
  });

  it('renders Toast notification when message is provided', () => {
    const html = renderToString(<Toast message="Copied Slack Standup to clipboard!" />);
    expect(html).toContain('Copied Slack Standup to clipboard!');
  });

  it('renders View Diff Proof badges and anti-hallucination tag on portfolio tab', () => {
    const html = renderToString(
      <ArtifactsView
        defaultTab="portfolio"
        result={{
          success: true,
          entryId: 'ship-123',
          date: '2026-10-30',
          artifacts: {
            portfolio: {
              title: 'Resilient WebSocket Layer',
              techStack: ['WebSockets', 'TypeScript'],
              impact: 'Zero-loss connection recovery.',
              challengeSolved: 'Preventing thundering herd storms.',
            },
            standup: {
              yesterday: 'Built WebSockets.',
              today: 'Testing.',
              blockers: 'None.',
            },
            decisionLog: [
              {
                decision: 'Chose exponential backoff.',
                rationale: 'Mitigate storms.',
                evidence: 'lib/network/socketClient.ts:42',
              },
            ],
          },
          reasoningTrace: ['Step 1: Done.'],
          verification: {
            verifiedTech: ['WebSockets', 'TypeScript'],
            hallucinatedTech: ['Kubernetes'],
          },
        }}
      />
    );

    expect(html).toContain('WebSockets');
    expect(html).toContain('verified');
    expect(html).toContain('Kubernetes');
    expect(html).toContain('unverified');
  });

  it('renders Copy for Slack button on standup tab', () => {
    const html = renderToString(
      <ArtifactsView
        defaultTab="standup"
        result={{
          success: true,
          entryId: 'ship-123',
          date: '2026-10-30',
          artifacts: {
            portfolio: {
              title: 'Resilient WebSocket Layer',
              techStack: ['WebSockets'],
              impact: 'Zero-loss recovery.',
            },
            standup: {
              yesterday: 'Built WebSockets.',
              today: 'Testing.',
              blockers: 'None.',
            },
            decisionLog: [],
          },
          reasoningTrace: [],
        }}
      />
    );

    expect(html).toContain('Copy for Slack');
    expect(html).toContain('Built WebSockets.');
  });
});
