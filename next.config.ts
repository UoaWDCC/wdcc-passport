import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-0b110f6b1f0b4c0baa8f61bdb498f606.r2.dev",
        pathname: "/badge/**",
      },
    ],
  },
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
};

export default nextConfig;
