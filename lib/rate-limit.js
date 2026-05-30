const globalRateLimitStore =
  globalThis.__virtusRateLimitStore ||
  new Map();

globalThis.__virtusRateLimitStore = globalRateLimitStore;

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  return (
    forwardedFor?.split(",")?.[0]?.trim() ||
    realIp ||
    "unknown-ip"
  );
}

export function getRateLimitIdentity(req, userId = "") {
  return userId || getClientIp(req);
}

export function checkRateLimit({
  key,
  limit = 20,
  windowMs = 60_000,
}) {
  const now = Date.now();
  const safeKey = String(key || "anonymous");
  const current = globalRateLimitStore.get(safeKey);

  if (!current || current.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + windowMs,
    };

    globalRateLimitStore.set(safeKey, next);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: next.resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  globalRateLimitStore.set(safeKey, current);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(result) {
  return Response.json(
    {
      error: "Too many requests. Please wait a moment and try again.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds || 60),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
