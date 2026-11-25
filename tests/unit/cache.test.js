import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TTLCache } from '../../src/utils/cache.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TTLCache', () => {
  it('stores and returns values', () => {
    const cache = new TTLCache({ ttlMs: 1000, maxItems: 10 });
    cache.set('a', 1);
    assert.equal(cache.get('a'), 1);
  });

  it('returns undefined for a missing key', () => {
    const cache = new TTLCache();
    assert.equal(cache.get('nope'), undefined);
  });

  it('treats a stored null as a hit (negative caching)', () => {
    const cache = new TTLCache();
    cache.set('missing-code', null);
    assert.equal(cache.get('missing-code'), null);
    assert.equal(cache.stats().hits, 1);
  });

  it('expires entries after the TTL', async () => {
    const cache = new TTLCache({ ttlMs: 20 });
    cache.set('a', 1);
    await sleep(40);
    assert.equal(cache.get('a'), undefined);
  });

  it('accepts a custom TTL per entry', async () => {
    const cache = new TTLCache({ ttlMs: 10_000 });
    cache.set('short', 1, 20);
    await sleep(40);
    assert.equal(cache.get('short'), undefined);
  });

  it('evicts the least recently used entry when full', () => {
    const cache = new TTLCache({ maxItems: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // "a" is now more recent than "b"
    cache.set('c', 3); // pushes out "b"

    assert.equal(cache.get('b'), undefined);
    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('c'), 3);
  });

  it('deletes entries', () => {
    const cache = new TTLCache();
    cache.set('a', 1);
    assert.equal(cache.delete('a'), true);
    assert.equal(cache.get('a'), undefined);
  });

  it('prunes expired entries', async () => {
    const cache = new TTLCache({ ttlMs: 20 });
    cache.set('a', 1);
    cache.set('b', 2, 10_000);
    await sleep(40);
    assert.equal(cache.prune(), 1);
    assert.equal(cache.size, 1);
  });

  it('reports hit rate', () => {
    const cache = new TTLCache();
    cache.set('a', 1);
    cache.get('a');
    cache.get('b');
    assert.deepEqual(
      { hits: cache.stats().hits, misses: cache.stats().misses, hitRate: cache.stats().hitRate },
      { hits: 1, misses: 1, hitRate: 0.5 },
    );
  });
});
