import { json, preflight } from "@/lib/api";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET(req: Request) {
  const base = config.baseUrl(req);
  return json({
    success: true,
    name: "EMon Downloader API",
    version: "v1",
    baseUrl: `${base}/api/v1`,
    documentation: `${base}/docs`,
    authentication: "Optional. When the server sets API_KEYS, send X-API-Key: <key> or Authorization: Bearer <key>.",
    endpoints: [
      { method: "GET", path: "/api/v1/alldown", query: { url: "string (required)" }, description: "Extract metadata and download formats for a media URL." },
      { method: "POST", path: "/api/v1/alldown", body: { url: "string (required)" }, description: "Same as GET, with a JSON body." },
      { method: "GET", path: "/api/v1/status", description: "Service health, provider availability and rate limits." },
      { method: "GET", path: "/api/v1/platforms", description: "Platforms and whether this server can currently serve them." },
      { method: "GET", path: "/api/v1/docs", description: "This document." },
    ],
    errorCodes: ["MISSING_URL", "INVALID_URL", "INVALID_JSON", "BLOCKED_URL", "UNAUTHORIZED", "RATE_LIMITED", "UNSUPPORTED_PLATFORM", "UNSUPPORTED_URL", "NOT_FOUND", "RESTRICTED", "NO_FORMATS", "EXTRACTION_FAILED", "PROVIDER_ERROR", "INTERNAL_ERROR"],
  });
}
