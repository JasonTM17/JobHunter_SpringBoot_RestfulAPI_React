function originFrom(value) {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const apiOrigins = unique([
  originFrom(process.env.NEXT_PUBLIC_API_BASE_URL),
  originFrom(process.env.NEXT_PUBLIC_STORAGE_BASE_URL),
  "http://localhost:8080",
  "http://127.0.0.1:8080"
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "object-src 'none'",
          `img-src 'self' data: blob: ${apiOrigins.join(" ")}`,
          "font-src 'self' data:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          `connect-src 'self' ${apiOrigins.join(" ")} ws://localhost:* ws://127.0.0.1:*`,
          "worker-src 'self' blob:"
        ].join("; ")
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
