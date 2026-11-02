const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export const config = {
  apiKeys: () => (process.env.API_KEYS || "").split(",").map((s) => s.trim()).filter(Boolean),
  rateMax: () => num(process.env.RATE_LIMIT_MAX, 30),
  rateWindowMs: () => num(process.env.RATE_LIMIT_WINDOW_SEC, 60) * 1000,
  webRateMax: () => num(process.env.WEB_RATE_LIMIT_MAX, 20),
  maxDownloadBytes: () => num(process.env.MAX_DOWNLOAD_MB, 2048) * 1024 * 1024,
  fetchTimeoutMs: () => num(process.env.FETCH_TIMEOUT_MS, 10000),
  corsOrigin: () => process.env.CORS_ORIGIN || "*",
  baseUrl(req: Request): string {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
    const h = req.headers;
    const host = h.get("x-forwarded-host") || h.get("host");
    if (!host) return new URL(req.url).origin;
    const proto = h.get("x-forwarded-proto") || (/^(localhost|127\.|\[::1\])/.test(host) ? "http" : "https");
    return `${proto}://${host}`;
  },
};
