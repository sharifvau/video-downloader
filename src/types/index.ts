export type MediaType = "video" | "audio";

/** Format as returned by a provider (before the service signs/proxies it). */
export interface RawFormat {
  quality: string;
  type: MediaType;
  mimeType: string;
  url: string;
  size?: number | null;
  hasAudio?: boolean;
  /** true when the URL only works from the server's IP (e.g. yt-dlp URLs) */
  requiresProxy?: boolean;
}

export interface ProviderResult {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  author?: string | null;
  formats: RawFormat[];
}

export interface MediaFormat {
  quality: string;
  type: MediaType;
  mimeType: string;
  downloadUrl: string;
  /** Signed same-site link that forces a browser download (Content-Disposition: attachment). */
  proxyUrl: string;
  filename: string;
  size: number | null;
  hasAudio?: boolean;
}

export interface MediaInfo {
  success: true;
  platform: string;
  provider: string;
  sourceUrl: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  author: string | null;
  formats: MediaFormat[];
}

export interface Provider {
  id: string;
  name: string;
  /** platform ids this provider can handle */
  platforms: string[];
  /** lower runs first */
  priority: number;
  isAvailable(): boolean;
  canHandle(url: URL, platform: string): boolean;
  extract(url: URL): Promise<ProviderResult>;
}
