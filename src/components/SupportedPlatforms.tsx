import { KNOWN_PLATFORMS } from "@/lib/platforms";
import { platformStatus } from "@/services/extract";

export default function SupportedPlatforms() {
  const providers = platformStatus();
  return (
    <section className="mx-auto mt-10 max-w-2xl px-5 text-center" aria-label="Supported platforms">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-60">Platforms on this server</p>
      <div className="flex flex-wrap justify-center gap-2">
        {KNOWN_PLATFORMS.map((p) => {
          const ok = providers.some((x) => x.available && x.platforms.includes(p.id));
          return (
            <span key={p.id} title={ok ? "Available" : "Needs a provider (see docs)"}
              className={`glass rounded-full px-3 py-1 text-xs font-medium ${ok ? "" : "opacity-45"}`}>
              {ok ? "● " : "○ "}{p.name}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs opacity-55">Plus direct .mp4 / .mp3 file links. Only public content the platform allows you to save.</p>
    </section>
  );
}
