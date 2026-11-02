import type { Provider, RawFormat } from "@/types";
import { AppError } from "@/lib/errors";
import { safeFetch } from "@/lib/security";

interface VimeoConfig {
  video?: { title?: string; duration?: number; owner?: { name?: string }; thumbs?: Record<string, string> };
  request?: { files?: { progressive?: { quality?: string; url: string; mime?: string; height?: number }[] } };
}

export const vimeoProvider: Provider = {
  id: "vimeo",
  name: "Vimeo (public player config)",
  platforms: ["vimeo"],
  priority: 10,
  isAvailable: () => true,
  canHandle: (_u, p) => p === "vimeo",
  async extract(url) {
    const m = url.pathname.match(/\/(?:video\/)?(\d{5,})(?:\/([0-9a-f]{8,}))?/);
    if (!m) throw new AppError(422, "UNSUPPORTED_URL", "Couldn't find a Vimeo video ID in this link.");
    const hash = m[2] || url.searchParams.get("h");
    const api = `https://player.vimeo.com/video/${m[1]}/config${hash ? `?h=${hash}` : ""}`;
    const res = await safeFetch(api, { headers: { "User-Agent": "Mozilla/5.0 (compatible; EMonDownloader/1.0)" } });
    if (res.status === 403 || res.status === 401) throw new AppError(403, "RESTRICTED", "This Vimeo video is private or doesn't allow downloads.");
    if (!res.ok) throw new AppError(404, "NOT_FOUND", "Vimeo video not found.");
    const cfg = (await res.json().catch(() => null)) as VimeoConfig | null;
    const files = cfg?.request?.files?.progressive ?? [];
    if (!files.length) throw new AppError(422, "NO_FORMATS", "This Vimeo video has no direct (progressive) downloads available.");
    const formats: RawFormat[] = files
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
      .map((f) => ({ quality: f.quality || (f.height ? `${f.height}p` : "video"), type: "video" as const, mimeType: f.mime || "video/mp4", url: f.url, hasAudio: true }));
    const thumbs = cfg?.video?.thumbs ?? {};
    const thumb = thumbs["1280"] || thumbs["960"] || thumbs["640"] || thumbs.base || null;
    return { title: cfg?.video?.title || "Vimeo video", thumbnail: thumb, duration: cfg?.video?.duration ?? null, author: cfg?.video?.owner?.name ?? null, formats };
  },
};
