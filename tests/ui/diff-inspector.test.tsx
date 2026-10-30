import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { DiffInspectorModal } from '@/components/DiffInspectorModal';

describe('DiffInspectorModal Component', () => {
  it('does not render HTML output when isOpen is false', () => {
    const html = renderToString(
      <DiffInspectorModal
        isOpen={false}
        onClose={vi.fn()}
        techName="WebSockets"
        isVerified={true}
        evidence="lib/network/socketClient.ts:42"
        rawDiffSnippet="+ class ResilientWebSocket"
      />
    );
    expect(html).toBe('');
  });

  it('renders verified diff evidence with colored syntax lines', () => {
    const html = renderToString(
      <DiffInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        techName="WebSockets"
        isVerified={true}
        evidence="lib/network/socketClient.ts:42"
        rawDiffSnippet="--- a/socket.ts\n+++ b/socket.ts\n+ class ResilientWebSocket"
      />
    );

    expect(html).toContain('Git Diff Verification Proof');
    expect(html).toContain('WebSockets');
    expect(html).toContain('socketClient.ts');
    expect(html).toContain('ResilientWebSocket');
    expect(html).toContain('VERIFIED IN GIT DIFF');
  });

  it('renders anti-hallucination warning banner when unverified', () => {
    const html = renderToString(
      <DiffInspectorModal
        isOpen={true}
        onClose={vi.fn()}
        techName="Kubernetes"
        isVerified={false}
        evidence=""
        rawDiffSnippet=""
        unverifiedReason="0 matching files found in git commit tree"
      />
    );

    expect(html).toContain('FLAGGED: UNVERIFIED CLAIM');
    expect(html).toContain('0 matching files found in git commit tree');
  });
});
