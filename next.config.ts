import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/admin',
        destination: '/',
      },
      {
        source: '/admin/:path*',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
