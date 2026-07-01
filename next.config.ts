import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, private",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  turbopack: {
    root: path.resolve(__dirname),
  },

  async headers() {
    return [
      {
        // todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // admin: que no se cachee en ningún proxy/CDN
        source: "/admin",
        headers: noStoreHeaders,
      },
      {
        // misma regla para tu API de login admin
        source: "/api/admin/:path*",
        headers: noStoreHeaders,
      },
    ];
  },
};

export default nextConfig;