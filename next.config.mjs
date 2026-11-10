const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy: solo permite recursos propios y los dominios de Firebase Auth.
// 'unsafe-inline' en script/style es necesario por el script de tema y los scripts de Next.js.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com https://accounts.google.com${isDev ? " ws: wss:" : ""}`,
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://content.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // El micrófono debe seguir permitido para el dictado en vivo
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
  { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type, X-User-Name" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  serverExternalPackages: ["firebase-admin"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
