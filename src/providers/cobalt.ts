import type { Provider, RawFormat } from "@/types";
import { AppError } from "@/lib/errors";
import { EXT_MIME, extOf } from "@/lib/mime";

interface CobaltRes {
  status: "tunnel" | "redirect" | "picker" | "error" | "local-processing";
  url?: string;
  filename?: string;
  picker?: { type: string; url: string; thumb?: string }[];
  error?: { code?: string };
}

const base = () => (process.env.COBALT_API_URL || "").replace(/\/$/, "");

async function call(url: string, mode: "auto" | "audio", quality: string): Promise<CobaltRes> {
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;
  const res = await fetch(base() + "/", {
    method: "POST",
    headers,
    body: JSON.stringify({ url, downloadMode: mode, videoQuality: quality, filenameStyle: "basic" }),
    signal: AbortSignal.timeout(25_000),
  }).catch(() => {
    throw new AppError(502, "PROVIDER_UNREACHABLE", "The extraction provider could not be reached.");
  });
  const data = (await res.json().catch(() => null)) as CobaltRes | null;
  if (!data) throw new AppError(502, "PROVIDER_ERROR", "The extraction provider returned an invalid response.");
  return data;
}

const mapError = (code?: string) => {
  if (code?.includes("login") || code?.includes("private")) return new AppError(403, "RESTRICTED", "This content is private or requires login.");
  if (code?.includes("not_found") || code?.includes("unavailable")) return new AppError(404, "NOT_FOUND", "Content not found or unavailable.");
  if (code?.includes("unsupported")) return new AppError(422, "UNSUPPORTED_URL", "The provider doesn't support this link.");
  return new AppError(502, "PROVIDER_ERROR", "The extraction provider couldn't process this link.");
};

export const cobaltProvider: Provider = {
  id: "cobalt",
  name: "Cobalt-compatible API",
  platforms: ["youtube", "facebook", "instagram", "tiktok", "twitter", "pinterest", "reddit", "vimeo", "dailymotion", "soundcloud", "twitch"],
  priority: 30,
  isAvailable: () => Boolean(base()),
  canHandle: (_u, p) => cobaltProvider.platforms.includes(p),
  async extract(url) {
    const qualities = (process.env.COBALT_QUALITIES || "1080,720,480").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
    const src = url.toString();
    const [audio, ...videos] = await Promise.all([call(src, "audio", "720"), ...qualities.map((q) => call(src, "auto", q))]);
    const formats: RawFormat[] = [];
    let title = "";
    const seen = new Set<string>();
    videos.forEach((r, i) => {
      if (r.status === "error") return;
      if (r.status === "picker") {
        r.picker?.filter((p) => p.type === "video" && !seen.has(p.url)).forEach((p, n) => {
          seen.add(p.url);
          formats.push({ quality: `clip ${n + 1}`, type: "video", mimeType: "video/mp4", url: p.url });
        });
        return;
      }
      if (!r.url || seen.has(r.url)) return;
      seen.add(r.url);
      const ext = extOf(r.filename || "mp4");
      title ||= (r.filename || "").replace(/\.[a-z0-9]+$/i, "");
      formats.push({ quality: `${qualities[i]}p`, type: "video", mimeType: EXT_MIME[ext] || "video/mp4", url: r.url, hasAudio: true });
    });
    if (audio.status !== "error" && audio.url) {
      const ext = extOf(audio.filename || "mp3");
      title ||= (audio.filename || "").replace(/\.[a-z0-9]+$/i, "");
      formats.push({ quality: "audio", type: "audio", mimeType: EXT_MIME[ext] || "audio/mpeg", url: audio.url });
    }
    if (!formats.length) {
      const err = [audio, ...videos].find((r) => r.status === "error");
      throw mapError(err?.error?.code);
    }
    return { title: title || "Media", thumbnail: null, duration: null, formats };
  },
};
