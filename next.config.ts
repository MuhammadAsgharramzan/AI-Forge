import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google Auth
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub Auth
      },
    ],
  },
};

export default nextConfig;
