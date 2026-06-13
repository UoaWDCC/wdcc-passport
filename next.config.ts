import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.R2_PUBLIC_BASE_URL!.replace(/https?:\/\//, ""),
        pathname: "/badge/**",
      },
    ],
  },
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
};

export default nextConfig;
