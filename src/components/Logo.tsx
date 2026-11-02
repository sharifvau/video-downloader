import Link from "next/link";

export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="EMon Downloader home">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" /><stop offset=".5" stopColor="#38bdf8" /><stop offset="1" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#lg)" />
        <path d="M32 14v24m0 0-10-10m10 10 10-10M18 46h28" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg font-bold tracking-tight">EMon <span className="grad-text">Downloader</span></span>
    </Link>
  );
}
