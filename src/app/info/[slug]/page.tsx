import { notFound } from "next/navigation";
import type { Metadata } from "next";

const PAGES: Record<string, { title: string; body: string[] }> = {
  about: {
    title: "About",
    body: [
      "EMon Downloader is a mobile-first media downloader and developer API created by Emon Hawladar. Tagline: One Link. Multiple Possibilities.",
      "It saves publicly accessible audio and video where the source platform and the content owner allow it. It does not bypass private accounts, logins, paywalls or DRM, and it does not claim to support every website.",
      "Which platforms work depends on the extraction providers configured on the server. The home page and /api/v1/platforms show what is actually available right now.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "No account is required. The links you submit are sent to this server only to look up media information and to start the download you request.",
      "Your download history is stored in your own browser (localStorage) and never uploaded. You can clear it from the History panel.",
      "Servers and hosting providers may keep standard technical logs (IP address, time, requested path, errors) for security and abuse prevention. Downloads are streamed through the server and are not stored.",
      "This site does not include advertising or third-party trackers. If you operate your own copy, you are responsible for your own logging and retention practices.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "Use this service only for content you own, content in the public domain, or content you have permission to download. You are responsible for complying with copyright law and each platform's terms.",
      "Do not use it to circumvent access controls, DRM, paywalls, or to download private content. Abuse, scraping at excessive volume, or attempts to attack the service may be blocked.",
      "The service is provided as is, without warranties. Availability depends on third-party platforms and may change or fail at any time.",
      "The public API may require an API key and is subject to rate limits set by the operator.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return { title: PAGES[params.slug] ? `${PAGES[params.slug].title} — EMon Downloader` : "Not found" };
}

export default function Info({ params }: { params: { slug: string } }) {
  const p = PAGES[params.slug];
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-2xl px-5 pt-8">
      <article className="glass rounded-3xl p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight"><span className="grad-text">{p.title}</span></h1>
        {p.body.map((t, i) => <p key={i} className="mt-4 leading-relaxed opacity-85">{t}</p>)}
      </article>
    </main>
  );
}
