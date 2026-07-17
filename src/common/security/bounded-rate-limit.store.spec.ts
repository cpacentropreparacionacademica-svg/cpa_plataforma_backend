import { BoundedRateLimitStore } from './bounded-rate-limit.store';

describe('BoundedRateLimitStore', () => {
  it('increments a live bucket without extending its window', () => {
    const store = new BoundedRateLimitStore();
    const first = store.increment('client-a', 1000, 10, 100);
    const second = store.increment('client-a', 1000, 10, 200);

    expect(first.resetAt).toBe(1100);
    expect(second).toEqual({ count: 2, resetAt: 1100 });
    expect(store.size).toBe(1);
  });

  it('evicts an old bucket when the hard capacity is reached', () => {
    const store = new BoundedRateLimitStore();
    store.increment('oldest', 100, 2, 0);
    store.increment('newer', 200, 2, 0);
    store.increment('replacement', 300, 2, 1);

    expect(store.size).toBe(2);
    expect(store.increment('replacement', 300, 2, 2).count).toBe(2);
  });

  it('replaces an expired bucket with a new window', () => {
    const store = new BoundedRateLimitStore();
    store.increment('client-a', 10, 5, 0);
    const renewed = store.increment('client-a', 10, 5, 11);

    expect(renewed).toEqual({ count: 1, resetAt: 21 });
  });
});
