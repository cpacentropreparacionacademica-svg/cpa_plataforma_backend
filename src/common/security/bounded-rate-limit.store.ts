export interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * Process-local rate-limit fallback with lazy expiry and a strict memory bound.
 * Redis remains the distributed source of truth; this store prevents an outage
 * from becoming an unbounded heap-growth path.
 */
export class BoundedRateLimitStore {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private operationsSinceCleanup = 0;

  increment(key: string, windowMs: number, maximumBuckets: number, now = Date.now()): RateLimitBucket {
    this.operationsSinceCleanup += 1;
    if (this.operationsSinceCleanup >= 100) {
      this.removeExpired(now);
      this.operationsSinceCleanup = 0;
    }

    const current = this.buckets.get(key);
    if (current && current.resetAt > now) {
      current.count += 1;
      return current;
    }

    if (this.buckets.size >= maximumBuckets) {
      this.removeExpired(now);
      if (this.buckets.size >= maximumBuckets) this.evictOldest();
    }

    const bucket = { count: 1, resetAt: now + windowMs };
    this.buckets.set(key, bucket);
    return bucket;
  }

  get size(): number {
    return this.buckets.size;
  }

  private removeExpired(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestResetAt = Number.POSITIVE_INFINITY;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt < oldestResetAt) {
        oldestKey = key;
        oldestResetAt = bucket.resetAt;
      }
    }
    if (oldestKey) this.buckets.delete(oldestKey);
  }
}
