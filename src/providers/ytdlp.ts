import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Provider, RawFormat } from "@/types";
import { AppError } from "@/lib/errors";

const run = promisify(execFile);

interface YtFormat {
  url?: string; ext?: string; vcodec?: string; acodec?: string; height?: number;
  protocol?: string; filesize?: number; filesize_approx?: number; abr?: number;
}
interface YtInfo { title?: string; thumbnail?: string; duration?: number; uploader?: string; formats?: YtFormat[] }

const usable = (f: YtFormat) => Boolean(f.url) && /^https?$/.test(f.protocol || "");
const size = (f: YtFormat) => f.filesize ?? f.filesize_approx ?? null;

export const ytdlpProvider: Provider = {
  id: "ytdlp",
  name: "yt-dlp",
  platforms: ["youtube", "facebook", "instagram", "tiktok", "twitter", "pinterest", "reddit", "vimeo", "dailymotion", "soundcloud", "twitch"],
  priority: 20,
  isAvailable: () => process.env.YTDLP_ENABLED === "true",
  // Only known platforms: never hand arbitrary hosts to yt-dlp's generic extractor.
  canHandle: (_u, p) => ytdlpProvider.platforms.includes(p),
  async extract(url) {
    let stdout: string;
    try {
      ({ stdout } = await run(
        process.env.YTDLP_PATH || "yt-dlp",
        ["-J", "--no-playlist", "--no-warnings", "--no-cache-dir", "--socket-timeout", "15", "--", url.toString()],
        { timeout: 45_000, maxBuffer: 32 * 1024 * 1024 },
      ));
    } catch (e) {
      const msg = String((e as { stderr?: string }).stderr || (e as Error).message || "");
      if (/ENOENT/.test(msg)) throw new AppError(503, "PROVIDER_MISSING", "yt-dlp is not installed on this server.");
      if (/private|sign in|login|members|age/i.test(msg)) throw new AppError(403, "RESTRICTED", "This content is private, age-restricted or requires login.");
      if (/unsupported url/i.test(msg)) throw new AppError(422, "UNSUPPORTED_URL", "This link isn't supported.");
      if (/not available|removed|unavailable|404/i.test(msg)) throw new AppError(404, "NOT_FOUND", "This content is unavailable.");
      console.error("[ytdlp]", msg.slice(0, 500));
      throw new AppError(502, "EXTRACTION_FAILED", "Couldn't extract this link.");
    }
    const info = JSON.parse(stdout) as YtInfo;
    const all = (info.formats ?? []).filter(usable);

    const best = new Map<number, YtFormat>();
    for (const f of all.filter((f) => f.vcodec !== "none" && f.acodec !== "none" && f.height)) {
      const cur = best.get(f.height!);
      if (!cur || (f.ext === "mp4" && cur.ext !== "mp4")) best.set(f.height!, f);
    }
    const formats: RawFormat[] = [...best.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([h, f]) => ({
        quality: `${h}p`, type: "video", mimeType: f.ext === "webm" ? "video/webm" : "video/mp4",
        url: f.url!, size: size(f), hasAudio: true, requiresProxy: true,
      }));

    const audio = all.filter((f) => f.vcodec === "none" && f.acodec !== "none").sort((a, b) => (b.abr ?? 0) - (a.abr ?? 0))[0];
    if (audio) {
      formats.push({
        quality: "audio", type: "audio", mimeType: audio.ext === "webm" ? "audio/webm" : "audio/mp4",
        url: audio.url!, size: size(audio), requiresProxy: true,
      });
    }
    if (!formats.length) {
      throw new AppError(422, "NO_FORMATS", "No directly downloadable (non-segmented) formats exist for this link.");
    }
    return { title: info.title || "Media", thumbnail: info.thumbnail ?? null, duration: info.duration ?? null, author: info.uploader ?? null, formats };
  },
};
