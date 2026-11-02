import Link from "next/link";

const contact = process.env.NEXT_PUBLIC_CONTACT_URL || "https://github.com/sharifvau";

export default function Footer() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-3xl px-5 pb-10 text-center text-sm">
      <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 opacity-80">
        <Link href="/info/about" className="hover:underline">About</Link>
        <Link href="/docs" className="hover:underline">API Documentation</Link>
        <Link href="/info/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/info/terms" className="hover:underline">Terms of Service</Link>
        <a href={contact} target="_blank" rel="noopener noreferrer" className="hover:underline">Contact</a>
      </nav>
      <p className="opacity-70">Made with ❤️ by Emon Hawladar</p>
      <p className="mt-1 text-xs opacity-50">EMon Downloader · One Link. Multiple Possibilities.</p>
    </footer>
  );
}
