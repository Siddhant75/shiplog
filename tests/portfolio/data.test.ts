import { describe, it, expect } from 'vitest';
import {
  HISTORICAL_SHIPS,
  filterPortfolioByTech,
  searchPortfolio,
  PortfolioShipItem,
} from '@/lib/portfolio/data';
import { WIKI_TOPIC_HUBS, WikiTopicHub } from '@/lib/wiki/data';

describe('Living Portfolio & Wiki Vault Data Models', () => {
  it('provides curated historical ships with realistic git diff snippets and anti-hallucination metadata', () => {
    expect(HISTORICAL_SHIPS.length).toBeGreaterThanOrEqual(4);

    const webSocketShip = HISTORICAL_SHIPS.find((s) => s.techStack.includes('WebSockets'));
    expect(webSocketShip).toBeDefined();
    expect(webSocketShip?.title).toContain('WebSocket');
    expect(webSocketShip?.rawDiffSnippet).toContain('class ResilientWebSocket');
    expect(webSocketShip?.rawDiffSnippet).toContain('+');
    expect(webSocketShip?.evidence).toContain('lib/network/socketClient.ts');
    expect(webSocketShip?.unverifiedTech).toContain('Kubernetes');
  });

  it('filters portfolio ships by tech stack accurately', () => {
    const redisShips = filterPortfolioByTech(HISTORICAL_SHIPS, 'Redis');
    expect(redisShips.length).toBeGreaterThan(0);
    redisShips.forEach((ship) => {
      expect(ship.techStack).toContain('Redis');
    });

    const allShips = filterPortfolioByTech(HISTORICAL_SHIPS, 'All');
    expect(allShips.length).toBe(HISTORICAL_SHIPS.length);
  });

  it('searches portfolio ships by keyword across title, impact, and tech', () => {
    const rateLimitShips = searchPortfolio(HISTORICAL_SHIPS, 'rate limiter');
    expect(rateLimitShips.length).toBeGreaterThan(0);
    expect(rateLimitShips[0].title.toLowerCase()).toContain('rate limiter');

    const emptySearch = searchPortfolio(HISTORICAL_SHIPS, '');
    expect(emptySearch.length).toBe(HISTORICAL_SHIPS.length);
  });

  it('provides structured Wiki topic hubs with ADRs and verbatim transcript vaults', () => {
    expect(WIKI_TOPIC_HUBS.length).toBeGreaterThanOrEqual(3);

    const networkingHub = WIKI_TOPIC_HUBS.find((h) => h.slug === 'networking-realtime');
    expect(networkingHub).toBeDefined();
    expect(networkingHub?.name).toBe('[[Networking & Real-Time]]');
    expect(networkingHub?.adrs.length).toBeGreaterThan(0);
    expect(networkingHub?.verbatimVault.length).toBeGreaterThan(0);
    expect(networkingHub?.verbatimVault[0].transcript).toBeTruthy();
  });
});
