import type { Metadata, Viewport } from "next";
import "./globals.css";
import Background from "@/components/Background";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EMon Downloader — One Link. Multiple Possibilities.",
  description: "Your all-in-one media downloader. Paste a link, pick a format, download. Includes a public developer API.",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f0ff" }, { media: "(prefers-color-scheme: dark)", color: "#0b0720" }],
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="font-sans antialiased">
        <Background />
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 pb-2 pt-5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/docs" className="glass rounded-full px-4 py-2 text-sm font-medium transition active:scale-95">API</Link>
            <ThemeToggle />
          </div>
        </header>
        {children}
        <Footer />
      </body>
    </html>
  );
}
