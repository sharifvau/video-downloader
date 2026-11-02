import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { AppError } from "./errors";
import { config } from "./config";
import { rateLimit } from "./ratelimit";

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": config.corsOrigin(),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After",
    "Access-Control-Max-Age": "86400",
  };
}
export const preflight = () => new NextResponse(null, { status: 204, headers: corsHeaders() });

export function json(body: unknown, status = 200, extra: Record<string, string> = {}, cors = true) {
  return NextResponse.json(body, {
    status,
    headers: { ...(cors ? corsHeaders() : {}), "Cache-Control": "no-store", ...extra },
  });
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

function safeEq(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export function getApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-api-key");
}

/** Optional API-key auth + rate limiting. Returns headers to attach to the response. */
export function guard(req: Request, opts: { requireKey: boolean; max?: number; scope?: string }): Record<string, string> {
  let id = clientIp(req);
  const keys = config.apiKeys();
  if (opts.requireKey && keys.length) {
    const k = getApiKey(req);
    if (!k || !keys.some((x) => safeEq(x, k))) {
      throw new AppError(401, "UNAUTHORIZED", "Missing or invalid API key. Send it as X-API-Key or Authorization: Bearer <key>.");
    }
    id = "key:" + k;
  }
  const max = opts.max ?? config.rateMax();
  const r = rateLimit(`${opts.scope ?? (opts.requireKey ? "api" : "web")}:${id}`, max, config.rateWindowMs());
  const headers = {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.reset / 1000)),
  };
  if (!r.ok) {
    throw new AppError(429, "RATE_LIMITED", "Too many requests. Please retry later.", {
      ...headers,
      "Retry-After": String(Math.max(1, Math.ceil((r.reset - Date.now()) / 1000))),
    });
  }
  return headers;
}

export function fail(e: unknown, extra: Record<string, string> = {}, cors = true) {
  if (e instanceof AppError) {
    return json({ success: false, error: { code: e.code, message: e.message } }, e.status, { ...extra, ...e.headers }, cors);
  }
  console.error("[api]", e);
  return json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } }, 500, extra, cors);
}
