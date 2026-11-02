import type { Provider } from "@/types";
import { AppError } from "@/lib/errors";
import { resolveRedirects, safeFetch } from "@/lib/security";

const UA = "Mozilla/5.0 (compatible; EMonDownloader/1.0)";

interface RedditVideo { fallback_url?: string; height?: number; duration?: number; is_gif?: boolean }
interface RedditPost {
  title?: string; author?: string; thumbnail?: string;
  secure_media?: { reddit_video?: RedditVideo } | null;
  media?: { reddit_video?: RedditVideo } | null;
  preview?: { images?: { source?: { url?: string } }[]; reddit_video_preview?: RedditVideo };
  crosspost_parent_list?: RedditPost[];
}

export const redditProvider: Provider = {
  id: "reddit",
  name: "Reddit (public JSON)",
  platforms: ["reddit"],
  priority: 10,
  isAvailable: () => true,
  canHandle: (_u, p) => p === "reddit",
  async extract(url) {
    let target = url.toString();
    if (/redd\.it$/i.test(url.hostname) || /\/s\//.test(url.pathname)) target = await resolveRedirects(target);
    const t = new URL(target);
    const jsonUrl = `https://www.reddit.com${t.pathname.replace(/\/$/, "")}.json?raw_json=1`;
    const res = await safeFetch(jsonUrl, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 403 || res.status === 429) {
      throw new AppError(502, "PROVIDER_BLOCKED", "Reddit blocked the request. Try again later or configure another provider.");
    }
    if (!res.ok) throw new AppError(404, "NOT_FOUND", "Reddit post not found or not public.");
    const data = (await res.json().catch(() => null)) as { data?: { children?: { data?: RedditPost }[] } }[] | null;
    let post = data?.[0]?.data?.children?.[0]?.data;
    if (!post) throw new AppError(404, "NOT_FOUND", "Reddit post not found.");
    if (post.crosspost_parent_list?.[0]) post = post.crosspost_parent_list[0];
    const v = post.secure_media?.reddit_video || post.media?.reddit_video || post.preview?.reddit_video_preview;
    if (!v?.fallback_url) throw new AppError(422, "NO_VIDEO", "This Reddit post doesn't contain a downloadable video.");
    const videoUrl = v.fallback_url.split("?")[0];
    const formats: import("@/types").RawFormat[] = [
      { quality: v.height ? `${v.height}p` : "video", type: "video", mimeType: "video/mp4", url: videoUrl, hasAudio: false },
    ];
    // Reddit serves audio as a separate stream; include it only if it really exists.
    const audioUrl = videoUrl.replace(/DASH_\d+\.mp4$/, "DASH_AUDIO_128.mp4");
    if (audioUrl !== videoUrl) {
      const a = await safeFetch(audioUrl, { method: "HEAD", headers: { "User-Agent": UA } }).catch(() => null);
      if (a?.ok) formats.push({ quality: "audio", type: "audio", mimeType: "audio/mp4", url: audioUrl });
    }
    const thumb = post.preview?.images?.[0]?.source?.url || (post.thumbnail?.startsWith("http") ? post.thumbnail : null);
    return { title: post.title || "Reddit video", thumbnail: thumb ?? null, duration: v.duration ?? null, author: post.author ?? null, formats };
  },
};
