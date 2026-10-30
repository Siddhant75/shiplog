import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { WikiVaultView } from '@/components/WikiVaultView';
import { WIKI_TOPIC_HUBS } from '@/lib/wiki/data';

describe('WikiVaultView Component', () => {
  it('renders wiki header and topic hubs', () => {
    const html = renderToString(<WikiVaultView topicHubs={WIKI_TOPIC_HUBS} />);

    expect(html).toContain('Engineering Wiki Vault');
    expect(html).toContain('LLM Wiki');
    expect(html).toContain('[[Networking &amp; Real-Time]]');
    expect(html).toContain('[[Security &amp; Zero-Persistence]]');
  });

  it('renders architectural decisions and verbatim voice transcripts', () => {
    const html = renderToString(<WikiVaultView topicHubs={WIKI_TOPIC_HUBS} />);

    expect(html).toContain('Architectural Decision Records');
    expect(html).toContain('exponential backoff with full jitter');
    expect(html).toContain('Immutable Verbatim Voice Vault');
    expect(html).toContain('Today I shipped the resilient WebSocket reconnection mechanism');
  });
});
