import Downloader from "@/components/Downloader";
import SupportedPlatforms from "@/components/SupportedPlatforms";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-2xl px-5 pb-8 pt-10 text-center sm:pt-16">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Download <span className="grad-text">Anything.</span><br />Anywhere.
        </h1>
        <p className="mt-4 text-base opacity-75 sm:text-lg">Your all-in-one media downloader.</p>
      </section>
      <Downloader />
      <SupportedPlatforms />
    </main>
  );
}
