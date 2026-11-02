import type { Provider } from "@/types";
import { AppError } from "@/lib/errors";
import { safeFetch } from "@/lib/security";
import { EXT_MIME, extOf } from "@/lib/mime";

export const directProvider: Provider = {
  id: "direct",
  name: "Direct media file",
  platforms: ["direct", "other"],
  priority: 90,
  isAvailable: () => true,
  canHandle: (_u, p) => p === "direct" || p === "other",
  async extract(url) {
    let res = await safeFetch(url.toString(), { method: "HEAD" });
    if (!res.ok || !res.headers.get("content-type")) {
      res.body?.cancel().catch(() => {});
      res = await safeFetch(url.toString(), { headers: { Range: "bytes=0-0" } });
      res.body?.cancel().catch(() => {});
    }
    if (!res.ok && res.status !== 206) {
      throw new AppError(404, "NOT_ACCESSIBLE", "The file could not be accessed (it may be private or removed).");
    }
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const ext = extOf(url.pathname);
    const known = Object.prototype.hasOwnProperty.call(EXT_MIME, ext);
    const isMedia = type.startsWith("video/") || type.startsWith("audio/") || (type === "application/octet-stream" && known);
    if (!isMedia) {
      throw new AppError(422, "NOT_MEDIA", "This link isn't a supported media platform or a direct audio/video file.");
    }
    const range = res.headers.get("content-range")?.match(/\/(\d+)$/);
    const size = range ? Number(range[1]) : Number(res.headers.get("content-length")) || null;
    const name = decodeURIComponent(url.pathname.split("/").pop() || "media").replace(/\.[a-z0-9]+$/i, "");
    const mimeType = type.startsWith("video/") || type.startsWith("audio/") ? type : EXT_MIME[ext];
    return {
      title: name || "Media file",
      thumbnail: null,
      duration: null,
      formats: [{ quality: "original", type: mimeType.startsWith("audio/") ? "audio" : "video", mimeType, url: url.toString(), size }],
    };
  },
};
