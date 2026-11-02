import { json, preflight } from "@/lib/api";
import { config } from "@/lib/config";
import { platformStatus } from "@/services/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET() {
  return json({
    success: true,
    name: "EMon Downloader API",
    version: "v1",
    status: "ok",
    time: new Date().toISOString(),
    auth: { required: config.apiKeys().length > 0 },
    rateLimit: { max: config.rateMax(), windowSeconds: config.rateWindowMs() / 1000 },
    providers: platformStatus().map(({ id, name, available }) => ({ id, name, available })),
  });
}
