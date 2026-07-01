// src/lib/utils/rate-limit.ts
// IMPORTANT: This is an in-memory rate limiter. It works correctly on a
// single long-lived Node process (e.g. `next start` on a VM/container) but
// does NOT share state across Vercel's serverless function instances —
// each cold start gets its own empty counter, so it's a soft speed bump,
// not a hard guarantee, on Vercel's default deployment model.
//
// For a real production guarantee on serverless, replace this with
// Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`), which is the
// standard pairing for Vercel deployments — a few lines to swap in once
// you provision a free Upstash instance. This in-memory version still
// meaningfully blocks naive abuse/scripted spam in the meantime and costs
// nothing to ship at launch.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Lazy cleanup instead of setInterval: a background timer is dead weight on
// serverless (each cold start re-runs this module and the interval handle
// is discarded when the instance freezes/recycles, achieving nothing) and
// only matters at all on a long-running Node process. Sweeping expired
// entries opportunistically on every call keeps the Map bounded in both
// deployment models without relying on a timer surviving anywhere.
function sweepExpired() {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key - typically an IP address or session id
 * @param limit - max requests allowed per window
 * @param windowMs - window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  // Cheap probabilistic sweep — avoids paying the full Map scan on every
  // single call while still bounding memory growth over time.
  if (Math.random() < 0.02) sweepExpired()

  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/** Extracts a best-effort client identifier from a Next.js Request for rate-limit keying */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
