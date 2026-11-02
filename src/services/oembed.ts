// Best-effort metadata enrichment via public oEmbed endpoints. Never produces download links.
const ENDPOINTS: Record<string, (u: string) => string> = {
  youtube: (u) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`,
  tiktok: (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`,
  vimeo: (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`,
  soundcloud: (u) => `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(u)}`,
  dailymotion: (u) => `https://www.dailymotion.com/services/oembed?format=json&url=${encodeURIComponent(u)}`,
};

export async function oembed(platform: string, url: string) {
  const build = ENDPOINTS[platform];
  if (!build) return null;
  try {
    const res = await fetch(build(url), { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const d = (await res.json()) as { title?: string; thumbnail_url?: string; author_name?: string; duration?: number };
    return { title: d.title, thumbnail: d.thumbnail_url, author: d.author_name, duration: d.duration };
  } catch {
    return null;
  }
}
