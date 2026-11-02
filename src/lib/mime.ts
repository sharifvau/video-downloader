export const EXT_MIME: Record<string, string> = {
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/x-m4v", mkv: "video/x-matroska",
  mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", opus: "audio/ogg", wav: "audio/wav", flac: "audio/flac", aac: "audio/aac",
};
export const MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/x-m4v": "m4v", "video/x-matroska": "mkv",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/wav": "wav", "audio/flac": "flac",
  "audio/aac": "aac", "audio/webm": "webm",
};
export const extOf = (name: string) => (name.split("?")[0].split(".").pop() || "").toLowerCase();
