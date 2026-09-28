import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + data files that must be loaded from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  // YouTube-style channel URLs: /@handle → /channel/handle
  async rewrites() {
    return [
      { source: "/@:handle", destination: "/channel/:handle" },
      { source: "/@:handle/:tab", destination: "/channel/:handle?tab=:tab" },
    ];
  },
};

export default nextConfig;
