import crypto from "node:crypto";

/**
 * In-memory sliding-window rate limiter.
 * In a serverless/multi-instance deployment, replace with Redis/Upstash.
 */
type RateLimitRecord = {
  timestamps: number[];
  lockedUntil?: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
    if (record.timestamps.length === 0 && (!record.lockedUntil || record.lockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref?.();

/**
 * Checks and updates rate limiting for a given identifier (e.g. IP + route or email).
 * Defaults to 5 requests per 15 minutes. Lockout occurs for 15 minutes after threshold.
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  lockoutMs = 15 * 60 * 1000,
): { success: boolean; locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Check if currently locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { success: false, locked: true, retryAfterSeconds };
  }

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    record.lockedUntil = now + lockoutMs;
    const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
    return { success: false, locked: true, retryAfterSeconds };
  }

  record.timestamps.push(now);
  return { success: true, locked: false, retryAfterSeconds: 0 };
}

/**
 * Utility to equalize execution timing across auth success/failure branches
 * to eliminate timing side-channel attacks for email existence.
 */
export async function equalizeTiming(startTimeMs: number, minimumTargetMs = 400): Promise<void> {
  const elapsed = Date.now() - startTimeMs;
  const remaining = minimumTargetMs - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

/**
 * Cryptographically random token generator (256-bit entropy).
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a plain text token using SHA-256 for secure storage.
 * Ensures stored tokens cannot be reversed even if the database is exposed.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Constant-time comparison between two string hashes to mitigate timing leaks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    // Perform dummy timing safe comparison to keep execution constant
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
