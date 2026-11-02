// Fixed-window in-memory limiter. Per-instance: on serverless, swap for Redis/Upstash for global limits.
const store = new Map<string, { count: number; reset: number }>();
let lastSweep = 0;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, v] of store) if (v.reset <= now) store.delete(k);
  }
  let e = store.get(key);
  if (!e || e.reset <= now) {
    e = { count: 0, reset: now + windowMs };
    store.set(key, e);
  }
  e.count++;
  return { ok: e.count <= limit, remaining: Math.max(0, limit - e.count), reset: e.reset };
}
