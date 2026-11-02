import type { Metadata } from "next";
import { headers } from "next/headers";
import CodeBlock from "@/components/CodeBlock";
import { config } from "@/lib/config";
import * as ex from "@/lib/docs-examples";

export const metadata: Metadata = { title: "API Documentation — EMon Downloader" };
export const dynamic = "force-dynamic";

const ENDPOINTS = [
  ["GET", "/api/v1/alldown?url=VIDEO_URL", "Extract metadata and formats."],
  ["POST", "/api/v1/alldown", "Same, with JSON body {\"url\": \"...\"}."],
  ["GET", "/api/v1/status", "Health, providers, rate limits."],
  ["GET", "/api/v1/platforms", "Platforms this server can serve right now."],
  ["GET", "/api/v1/docs", "Machine-readable endpoint list."],
];
const ERRORS = [
  ["400", "MISSING_URL / INVALID_URL / BLOCKED_URL / INVALID_JSON", "Bad input, or a blocked (private/local) destination."],
  ["401", "UNAUTHORIZED", "API key required or invalid."],
  ["403", "RESTRICTED", "Private, login-only or protected content."],
  ["404", "NOT_FOUND", "Content missing or unavailable."],
  ["422", "UNSUPPORTED_PLATFORM / NO_FORMATS", "No provider for this platform, or nothing downloadable."],
  ["429", "RATE_LIMITED", "Too many requests; see Retry-After."],
  ["502/504", "EXTRACTION_FAILED / PROVIDER_ERROR / UPSTREAM_TIMEOUT", "Provider or source failed."],
];

export default function Docs() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") || `${proto}://${host}`;
  const sub = (s: string) => s.replaceAll("__BASE__", base);
  const keyRequired = config.apiKeys().length > 0;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-5 pt-8">
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight"><span className="grad-text">Developer API</span></h1>
        <p className="mt-3 opacity-80">Build bots and apps on top of EMon Downloader. JSON in, JSON out. Only public content that platforms allow you to save.</p>
        <div className="glass mt-4 rounded-2xl p-4 text-sm">
          <p><b>Base URL</b> <code className="ml-2 break-all font-mono">{base}/api/v1</code></p>
          <p className="mt-2"><b>Auth</b> <span className="ml-2">{keyRequired ? "API key required on this server." : "No key required on this server (operators may enable API_KEYS)."}</span></p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Endpoints</h2>
        <div className="glass divide-y divide-black/5 overflow-hidden rounded-2xl dark:divide-white/10">
          {ENDPOINTS.map(([m, p, d]) => (
            <div key={p} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:gap-3">
              <span className="w-14 shrink-0 font-mono text-xs font-bold text-violet-600 dark:text-violet-300">{m}</span>
              <code className="break-all font-mono text-[13px]">{p}</code>
              <span className="opacity-65 sm:ml-auto">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Authentication</h2>
        <p className="text-sm opacity-80">If the server sets <code className="font-mono">API_KEYS</code>, send a key as <code className="font-mono">X-API-Key: KEY</code> or <code className="font-mono">Authorization: Bearer KEY</code>. Never put keys in front-end code. Rate limit headers: <code className="font-mono">X-RateLimit-Limit / -Remaining / -Reset</code>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Parameters</h2>
        <p className="text-sm opacity-80"><code className="font-mono">url</code> (required): a public http(s) link. Private, local and non-standard-port destinations are rejected.</p>
        <h3 className="font-semibold">Success response</h3>
        <CodeBlock code={sub(ex.successResponse)} label="200 application/json" />
        <p className="text-sm opacity-80"><code className="font-mono">downloadUrl</code> is either the source file or, when the source only works from the server, a signed proxy link. <code className="font-mono">proxyUrl</code> is always a signed link (valid 1 hour) that forces an attachment download. <code className="font-mono">size</code>, <code className="font-mono">duration</code> and <code className="font-mono">thumbnail</code> are null when unknown.</p>
        <h3 className="font-semibold">Error response</h3>
        <CodeBlock code={ex.errorResponse} label="4xx / 5xx application/json" />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Error codes</h2>
        <div className="glass divide-y divide-black/5 overflow-hidden rounded-2xl dark:divide-white/10">
          {ERRORS.map(([s, c, d]) => (
            <div key={c} className="p-3 text-sm"><span className="font-mono font-bold">{s}</span> <code className="break-words font-mono text-[12px]">{c}</code><p className="mt-1 opacity-65">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Examples</h2>
        <CodeBlock code={sub(ex.curl)} label="cURL" />
        <CodeBlock code={sub(ex.jsFetch)} label="JavaScript (browser / Node)" />
        <CodeBlock code={sub(ex.nodePost)} label="Node.js · POST" />
        <h3 className="pt-2 font-semibold">WhatsApp bot (Baileys)</h3>
        <CodeBlock code={sub(ex.baileys)} label="Baileys · .dl <link>" />
      </section>
    </main>
  );
}
