const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Docker builds set BUILD_STANDALONE=true; Vercel builds leave it unset.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];
    return [
      { source: "/api/:path*", headers: common },
      {
        source: "/((?!api).*)",
        headers: [...common, { key: "X-Frame-Options", value: "DENY" }, { key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};
export default nextConfig;
