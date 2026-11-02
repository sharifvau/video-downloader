# EMon Downloader — One Link. Multiple Possibilities.

Mobile-first media downloader + public developer API. Next.js 14 · TypeScript · Tailwind · Framer Motion.
Created by Emon Hawladar.

## How platform support really works
Support is **per provider**, and nothing is faked. `GET /api/v1/platforms` shows what is live on your server.

| Provider | Works on | Needs | Covers |
|---|---|---|---|
| `reddit` | Vercel + Docker | nothing | Reddit videos (public JSON) |
| `vimeo` | Vercel + Docker | nothing | Vimeo videos that expose progressive files |
| `direct` | Vercel + Docker | nothing | Direct `.mp4/.mp3/...` links |
| `cobalt` | Vercel + Docker | `COBALT_API_URL` (self-host [cobalt](https://github.com/imputnet/cobalt)) | YouTube, Facebook, Instagram, TikTok, X, Pinterest, SoundCloud, Dailymotion, Twitch, ... |
| `ytdlp` | Docker / VPS only | `YTDLP_ENABLED=true` (set in the image) | Same list, via yt-dlp |

Without `cobalt` or `ytdlp`, YouTube/TikTok/etc. return `UNSUPPORTED_PLATFORM` (honest error). Private, login-only, paywalled and DRM content is never bypassed. yt-dlp only returns *non-segmented* formats (YouTube is typically up to 360p/720p muxed + audio-only). Cobalt quality labels are the requested maximum.

## Run locally
```bash
cp .env.example .env.local   # set PROXY_SECRET at least
npm install
npm run dev                  # http://localhost:3000
npm run typecheck && npm run build
```

## Deploy on Vercel
1. Push to GitHub, import the repo in Vercel (framework: Next.js; `vercel.json` is included).
2. Add env vars: `PROXY_SECRET` (required), `PUBLIC_BASE_URL`, `API_KEYS` (optional), `COBALT_API_URL` (+ `COBALT_API_KEY`) to enable social platforms.
3. Deploy. Notes: rate limiting is in-memory per instance (use Upstash/Redis for global limits); function duration limits depend on your Vercel plan, so very large files may be cut off — use Docker for heavy use. yt-dlp cannot run on Vercel.

## Deploy with Docker / VPS
```bash
cp .env.example .env         # set PROXY_SECRET, PUBLIC_BASE_URL, API_KEYS ...
docker compose up -d --build
# or: docker build -t emon-downloader . && docker run -p 3000:3000 --env-file .env emon-downloader
```
The image bundles yt-dlp and runs as a non-root user with a read-only filesystem. Put it behind HTTPS (Caddy/Nginx). Update yt-dlp by rebuilding the image regularly.

## Add a provider
Create `src/providers/<name>.ts` exporting a `Provider` (see `src/types`), then add it to `src/providers/index.ts`.

## Security
SSRF guard (public IPs only, http/https, ports 80/443, per-hop redirect validation), signed + expiring proxy links, media-only proxy with size cap, request timeouts, rate limiting, optional API keys (constant-time compare), secure headers/CSP, no keys in the frontend. Known limit: DNS-rebinding between validation and fetch is not fully closed; for high-risk deployments run behind an egress firewall.

Use only for content you have the right to download.
