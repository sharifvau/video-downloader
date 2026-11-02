// Client-safe: no Node imports here.
export const KNOWN_PLATFORMS: { id: string; name: string }[] = [
  { id: "youtube", name: "YouTube" },
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "twitter", name: "X / Twitter" },
  { id: "pinterest", name: "Pinterest" },
  { id: "reddit", name: "Reddit" },
  { id: "vimeo", name: "Vimeo" },
  { id: "dailymotion", name: "Dailymotion" },
  { id: "soundcloud", name: "SoundCloud" },
  { id: "twitch", name: "Twitch" },
];

const RULES: [string, RegExp][] = [
  ["youtube", /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/],
  ["facebook", /(^|\.)(facebook\.com|fb\.watch|fb\.com)$/],
  ["instagram", /(^|\.)instagram\.com$/],
  ["tiktok", /(^|\.)tiktok\.com$/],
  ["twitter", /(^|\.)(twitter\.com|x\.com|t\.co)$/],
  ["pinterest", /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/],
  ["reddit", /(^|\.)(reddit\.com|redd\.it)$/],
  ["vimeo", /(^|\.)vimeo\.com$/],
  ["dailymotion", /(^|\.)(dailymotion\.com|dai\.ly)$/],
  ["soundcloud", /(^|\.)soundcloud\.com$/],
  ["twitch", /(^|\.)(twitch\.tv)$/],
];
const MEDIA_EXT = /\.(mp4|webm|mov|m4v|mp3|m4a|ogg|opus|wav|flac|aac)$/i;

export function detectPlatform(u: URL): string {
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  for (const [id, re] of RULES) if (re.test(host)) return id;
  return MEDIA_EXT.test(u.pathname) ? "direct" : "other";
}

export function platformLabel(id: string): string {
  return KNOWN_PLATFORMS.find((p) => p.id === id)?.name ?? (id === "direct" ? "Direct file" : "Unknown");
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export function quickDetect(raw: string): string | null {
  if (!isValidHttpUrl(raw)) return null;
  return detectPlatform(new URL(raw.trim()));
}
