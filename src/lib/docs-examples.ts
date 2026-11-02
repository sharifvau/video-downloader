// "__BASE__" is replaced with the live site URL at render time.
export const curl = String.raw`curl "__BASE__/api/v1/alldown?url=https%3A%2F%2Fvimeo.com%2F76979871" \
  -H "X-API-Key: YOUR_API_KEY"`;

export const jsFetch = String.raw`const BASE = "__BASE__";

async function getMedia(videoUrl) {
  const res = await fetch(BASE + "/api/v1/alldown?url=" + encodeURIComponent(videoUrl), {
    headers: { "X-API-Key": "YOUR_API_KEY" }, // omit if the server has no API_KEYS
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error.code + ": " + data.error.message);
  return data;
}

getMedia("https://vimeo.com/76979871").then((d) => console.log(d.title, d.formats));`;

export const nodePost = String.raw`// Node.js 18+ (ESM)
const res = await fetch("__BASE__/api/v1/alldown", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key": process.env.EMON_API_KEY ?? "" },
  body: JSON.stringify({ url: "https://vimeo.com/76979871" }),
});
const data = await res.json();
if (!res.ok) {
  console.error(res.status, data.error);
  process.exit(1);
}
const best = data.formats.find((f) => f.type === "video");
console.log(data.title, "->", best.downloadUrl);`;

export const baileys = String.raw`// npm i @whiskeysockets/baileys   (Node.js 18+, ESM)
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";

const API = "__BASE__/api/v1/alldown";
const { state, saveCreds } = await useMultiFileAuthState("auth");
const sock = makeWASocket({ auth: state, printQRInTerminal: true });
sock.ev.on("creds.update", saveCreds);

sock.ev.on("messages.upsert", async ({ messages }) => {
  const m = messages[0];
  if (!m?.message || m.key.fromMe) return;
  const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
  const match = text.match(/^\.dl\s+(https?:\/\/\S+)/i);
  if (!match) return;
  const jid = m.key.remoteJid;

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": process.env.EMON_API_KEY ?? "" },
      body: JSON.stringify({ url: match[1] }),
    });
    const data = await r.json();
    if (!data.success) {
      return sock.sendMessage(jid, { text: "Failed: " + data.error.message }, { quoted: m });
    }
    const video = data.formats.find((f) => f.type === "video");
    if (video) {
      await sock.sendMessage(jid, { video: { url: video.downloadUrl }, mimetype: video.mimeType, caption: data.title }, { quoted: m });
    } else {
      const audio = data.formats.find((f) => f.type === "audio");
      await sock.sendMessage(jid, { audio: { url: audio.downloadUrl }, mimetype: audio.mimeType }, { quoted: m });
    }
  } catch (e) {
    await sock.sendMessage(jid, { text: "Something went wrong, try again later." }, { quoted: m });
  }
});`;

export const successResponse = String.raw`{
  "success": true,
  "platform": "vimeo",
  "provider": "vimeo",
  "sourceUrl": "https://vimeo.com/76979871",
  "title": "Video title",
  "thumbnail": "https://i.vimeocdn.com/...",
  "duration": 30,
  "author": "Uploader",
  "formats": [
    {
      "quality": "720p",
      "type": "video",
      "mimeType": "video/mp4",
      "downloadUrl": "https://...",
      "proxyUrl": "__BASE__/api/v1/proxy?url=...&sig=...",
      "filename": "Video title-720p.mp4",
      "size": null,
      "hasAudio": true
    }
  ]
}`;

export const errorResponse = String.raw`{
  "success": false,
  "error": { "code": "UNSUPPORTED_PLATFORM", "message": "YouTube downloads aren't enabled on this server (no extraction provider configured)." }
}`;
