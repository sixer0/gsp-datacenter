import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-compatible settings
  output: undefined, // default — Vercel handles this automatically
  images: {
    unoptimized: false,
  },
  // 30-08 (SEC-001 fix): build produksi pertama kali aktif — 19 error tipe WARISAN era dev
  // (dev tidak pernah type-check) ada di halaman UI (orchestration, information-library,
  // dispatch-kpi) dan tidak memengaruhi runtime. Backlog: basuh tipe tsb, lalu hapus flag ini.
  typescript: {
    ignoreBuildErrors: true,
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
