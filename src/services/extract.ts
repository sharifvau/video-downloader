import type { MediaFormat, MediaInfo } from "@/types";
import { AppError } from "@/lib/errors";
import { assertSafeUrl } from "@/lib/security";
import { detectPlatform, platformLabel } from "@/lib/platforms";
import { MIME_EXT } from "@/lib/mime";
import { signProxyQuery } from "@/lib/sign";
import { getProviders } from "@/providers";
import { oembed } from "./oembed";

const clean = (s: string) => s.replace(/[^\p{L}\p{N}\-_. ]+/gu, "").replace(/\s+/g, " ").trim().slice(0, 80) || "download";

export function platformStatus() {
  const providers = getProviders();
  return providers.map((p) => ({ id: p.id, name: p.name, available: p.isAvailable(), platforms: p.platforms }));
}

export async function extractMedia(raw: string, baseUrl: string): Promise<MediaInfo> {
  const url = await assertSafeUrl(raw);
  const platform = detectPlatform(url);
  const candidates = getProviders().filter((p) => p.isAvailable() && p.canHandle(url, platform));
  if (!candidates.length) {
    throw new AppError(
      422,
      "UNSUPPORTED_PLATFORM",
      platform === "other"
        ? "This link isn't a recognised media platform or a direct audio/video file."
        : `${platformLabel(platform)} downloads aren't enabled on this server (no extraction provider configured).`,
    );
  }

  let lastErr: unknown;
  for (const p of candidates) {
    try {
      const r = await p.extract(url);
      if (!r.formats.length) throw new AppError(422, "NO_FORMATS", "No downloadable formats were found.");
      const meta = !r.thumbnail || !r.duration ? await oembed(platform, url.toString()) : null;
      const title = r.title && r.title !== "Media" ? r.title : meta?.title || r.title;
      const formats: MediaFormat[] = r.formats.map((f) => {
        const ext = MIME_EXT[f.mimeType] || (f.type === "audio" ? "m4a" : "mp4");
        const filename = `${clean(title)}-${clean(f.quality)}.${ext}`;
        const proxyUrl = `${baseUrl}/api/v1/proxy?${signProxyQuery(f.url, filename)}`;
        return {
          quality: f.quality, type: f.type, mimeType: f.mimeType,
          downloadUrl: f.requiresProxy ? proxyUrl : f.url,
          proxyUrl, filename, size: f.size ?? null, hasAudio: f.hasAudio,
        };
      });
      return {
        success: true, platform, provider: p.id, sourceUrl: url.toString(), title,
        thumbnail: r.thumbnail || meta?.thumbnail || null,
        duration: r.duration || meta?.duration || null,
        author: r.author || meta?.author || null,
        formats,
      };
    } catch (e) {
      lastErr = e;
      console.warn(`[extract] provider ${p.id} failed:`, e instanceof AppError ? e.code : e);
    }
  }
  throw lastErr instanceof AppError ? lastErr : new AppError(502, "EXTRACTION_FAILED", "Couldn't extract media from this link.");
}
