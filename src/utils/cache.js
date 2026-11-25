/**
 * A small in-memory cache with per-entry expiry and a size limit.
 *
 * - Entries expire after a time to live (TTL).
 * - When the cache is full, the least recently used entry is removed.
 *   A JavaScript Map remembers insertion order, so the first key is always the oldest.
 * - It lives inside one Node.js process. If you run several instances of the API,
 *   each instance has its own copy. Use Redis when you need to share a cache.
 *
 * `get` returns undefined on a miss. A stored value of null is a valid hit, which lets
 * callers remember "this does not exist" (negative caching).
 */
export class TTLCache {
  #store = new Map();
  #ttlMs;
  #maxItems;
  #hits = 0;
  #misses = 0;

  constructor({ ttlMs = 60_000, maxItems = 1000 } = {}) {
    this.#ttlMs = ttlMs;
    this.#maxItems = maxItems;
  }

  get(key) {
    const entry = this.#store.get(key);

    if (!entry) {
      this.#misses += 1;
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.#store.delete(key);
      this.#misses += 1;
      return undefined;
    }

    // Move the key to the end so it counts as recently used.
    this.#store.delete(key);
    this.#store.set(key, entry);
    this.#hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs = this.#ttlMs) {
    this.#store.delete(key);
    this.#store.set(key, { value, expiresAt: Date.now() + ttlMs });

    while (this.#store.size > this.#maxItems) {
      const oldestKey = this.#store.keys().next().value;
      this.#store.delete(oldestKey);
    }
  }

  delete(key) {
    return this.#store.delete(key);
  }

  clear() {
    this.#store.clear();
  }

  /** Removes every expired entry. Returns how many were removed. */
  prune() {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.#store) {
      if (entry.expiresAt <= now) {
        this.#store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  get size() {
    return this.#store.size;
  }

  stats() {
    const total = this.#hits + this.#misses;
    return {
      size: this.#store.size,
      maxItems: this.#maxItems,
      hits: this.#hits,
      misses: this.#misses,
      hitRate: total === 0 ? 0 : Number((this.#hits / total).toFixed(3)),
    };
  }
}
