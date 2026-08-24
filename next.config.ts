import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-compatible settings
  output: undefined, // default — Vercel handles this automatically
  images: {
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/memory-wiki",
        destination: "/information-library",
        permanent: true,
      },
      {
        source: "/memory-wiki/:path*",
        destination: "/information-library/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
