import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.yttimg.com" },
    ],
  },
};

export default nextConfig;
