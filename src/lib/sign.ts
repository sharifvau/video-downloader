import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

let warned = false;
const fallback = randomBytes(32).toString("hex");
function secret() {
  if (process.env.PROXY_SECRET) return process.env.PROXY_SECRET;
  if (!warned) {
    warned = true;
    console.warn("[emon] PROXY_SECRET is not set; using a per-process secret. Set it on serverless platforms.");
  }
  return fallback;
}
const mac = (url: string, filename: string, exp: number) =>
  createHmac("sha256", secret()).update(`${url}|${filename}|${exp}`).digest("hex");

export function signProxyQuery(url: string, filename: string, ttlSec = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  return new URLSearchParams({ url, filename, exp: String(exp), sig: mac(url, filename, exp) }).toString();
}

export function verifyProxy(url: string, filename: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const a = Buffer.from(mac(url, filename, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
