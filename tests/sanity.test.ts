import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
  it('environment runs vitest tests cleanly with path alias', () => {
    expect(1 + 1).toBe(2);
  });
});
