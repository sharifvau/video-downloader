import { AppError } from "@/lib/errors";
import { config } from "@/lib/config";
import { corsHeaders, fail, guard, preflight } from "@/lib/api";
import { safeFetch } from "@/lib/security";
import { verifyProxy } from "@/lib/sign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const OPTIONS = preflight;

const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

async function proxy(req: Request, head: boolean) {
  try {
    const sp = new URL(req.url).searchParams;
    const url = sp.get("url") || "";
    const filename = sp.get("filename") || "download";
    if (!url || !verifyProxy(url, filename, Number(sp.get("exp")), sp.get("sig") || "")) {
      throw new AppError(403, "INVALID_SIGNATURE", "This download link is invalid or has expired. Fetch the media again.");
    }
    guard(req, { requireKey: false, max: config.rateMax() * 4, scope: "proxy" });

    const headers: Record<string, string> = { "User-Agent": UA };
    const range = req.headers.get("range");
    if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;

    const up = await safeFetch(url, { headers });
    if (!up.ok && up.status !== 206) {
      up.body?.cancel().catch(() => {});
      throw new AppError(502, "UPSTREAM_ERROR", `The source refused the download (HTTP ${up.status}).`);
    }
    const type = (up.headers.get("content-type") || "application/octet-stream").split(";")[0].trim().toLowerCase();
    if (!/^(video|audio)\//.test(type) && type !== "application/octet-stream" && type !== "binary/octet-stream") {
      up.body?.cancel().catch(() => {});
      throw new AppError(415, "NOT_MEDIA", "The source did not return audio/video content.");
    }
    const len = Number(up.headers.get("content-length"));
    const max = config.maxDownloadBytes();
    if (len > max) {
      up.body?.cancel().catch(() => {});
      throw new AppError(413, "FILE_TOO_LARGE", `File exceeds the server limit of ${Math.round(max / 1048576)} MB.`);
    }

    const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    const out = new Headers({
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": up.headers.get("accept-ranges") || "bytes",
      ...corsHeaders(),
    });
    for (const h of ["content-length", "content-range"]) {
      const v = up.headers.get(h);
      if (v) out.set(h, v);
    }
    if (head) {
      up.body?.cancel().catch(() => {});
      return new Response(null, { status: 200, headers: out });
    }
    if (!up.body) throw new AppError(502, "UPSTREAM_ERROR", "The source returned an empty response.");

    let sent = 0;
    const limiter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        sent += chunk.byteLength;
        if (sent > max) ctrl.error(new Error("size limit exceeded"));
        else ctrl.enqueue(chunk);
      },
    });
    return new Response(up.body.pipeThrough(limiter), { status: up.status, headers: out });
  } catch (e) {
    return fail(e);
  }
}

export const GET = (req: Request) => proxy(req, false);
export const HEAD = (req: Request) => proxy(req, true);
