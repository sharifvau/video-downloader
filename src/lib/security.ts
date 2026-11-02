import dns from "node:dns/promises";
import net from "node:net";
import { AppError } from "./errors";
import { config } from "./config";

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::") return true;
    if (l.startsWith("::ffff:")) return isPrivateIp(l.slice(7));
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(l);
  }
  return true;
}

/** Validates scheme, port, credentials and that every resolved IP is public. */
export async function assertSafeUrl(raw: string): Promise<URL> {
  if (typeof raw !== "string" || raw.length > 2048) throw new AppError(400, "INVALID_URL", "URL is missing or too long.");
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new AppError(400, "INVALID_URL", "That doesn't look like a valid URL.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new AppError(400, "INVALID_URL", "Only http(s) URLs are allowed.");
  if (u.username || u.password) throw new AppError(400, "INVALID_URL", "URLs with credentials are not allowed.");
  if (u.port && u.port !== "80" && u.port !== "443") throw new AppError(400, "INVALID_URL", "Non-standard ports are not allowed.");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(localhost|local|internal|lan|home|corp)$/.test(host)) {
    throw new AppError(400, "BLOCKED_URL", "This destination is not allowed.");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new AppError(400, "BLOCKED_URL", "This destination is not allowed.");
  } else {
    let addrs: { address: string }[];
    try {
      addrs = await dns.lookup(host, { all: true });
    } catch {
      throw new AppError(400, "UNRESOLVABLE_HOST", "Couldn't resolve that host.");
    }
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
      throw new AppError(400, "BLOCKED_URL", "This destination is not allowed.");
    }
  }
  return u;
}

/** fetch() that validates every redirect hop and times out while waiting for headers (not for the body). */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; maxRedirects?: number } = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? config.fetchTimeoutMs();
  let current = url;
  for (let i = 0; i <= (opts.maxRedirects ?? 4); i++) {
    const u = await assertSafeUrl(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(u, { ...init, redirect: "manual", signal: ctrl.signal });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        res.body?.cancel().catch(() => {});
        current = new URL(loc, u).toString();
        continue;
      }
      return res;
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(504, "UPSTREAM_TIMEOUT", "The source took too long to respond or could not be reached.");
    } finally {
      clearTimeout(timer);
    }
  }
  throw new AppError(502, "TOO_MANY_REDIRECTS", "The source redirected too many times.");
}

/** Follows redirects (each hop validated) and returns the final URL. */
export async function resolveRedirects(url: string): Promise<string> {
  let current = url;
  for (let i = 0; i < 5; i++) {
    const u = await assertSafeUrl(current);
    const res = await safeFetch(u.toString(), { method: "HEAD" }, { maxRedirects: 0 }).catch(() => null);
    const loc = res?.headers.get("location");
    if (!res || res.status < 300 || res.status >= 400 || !loc) return current;
    current = new URL(loc, u).toString();
  }
  return current;
}
