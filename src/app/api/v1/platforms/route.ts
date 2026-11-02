import { json, preflight } from "@/lib/api";
import { KNOWN_PLATFORMS } from "@/lib/platforms";
import { platformStatus } from "@/services/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

export async function GET() {
  const providers = platformStatus();
  const platforms = KNOWN_PLATFORMS.map((p) => {
    const via = providers.filter((x) => x.available && x.platforms.includes(p.id)).map((x) => x.id);
    return { id: p.id, name: p.name, supported: via.length > 0, providers: via };
  });
  platforms.push({ id: "direct", name: "Direct media files (.mp4, .mp3, ...)", supported: true, providers: ["direct"] });
  return json({ success: true, platforms });
}
