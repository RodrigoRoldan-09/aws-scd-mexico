type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export function getIp(request: Request): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

/* ── Failure-specific rate limiter (for PIN brute-force protection) ── */
type FailEntry = { failures: number; resetAt: number };
const failStore = new Map<string, FailEntry>();

/** Call only on a failed attempt. Returns whether the key is now blocked. */
export function recordFail(key: string, limit: number, windowMs: number): { blocked: boolean; retryAfterMs: number } {
  const now = Date.now();
  let entry = failStore.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { failures: 0, resetAt: now + windowMs };
    failStore.set(key, entry);
  }
  entry.failures += 1;
  const blocked = entry.failures >= limit;
  return { blocked, retryAfterMs: blocked ? entry.resetAt - now : 0 };
}

/** Check if a key is currently blocked (without incrementing). */
export function isBlocked(key: string, limit: number): { blocked: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = failStore.get(key);
  if (!entry || now >= entry.resetAt) return { blocked: false, retryAfterMs: 0 };
  const blocked = entry.failures >= limit;
  return { blocked, retryAfterMs: blocked ? entry.resetAt - now : 0 };
}

/** Clear failure record on success. */
export function clearFails(key: string): void {
  failStore.delete(key);
}
