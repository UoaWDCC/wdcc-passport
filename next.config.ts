import type { NextConfig } from "next";

const badgeImageBaseUrl = new URL(
  process.env.BADGE_IMAGE_BASE_URL ?? "https://pub-0b110f6b1f0b4c0baa8f61bdb498f606.r2.dev"
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: badgeImageBaseUrl.protocol.replace(":", "") as "https" | "http",
        hostname: badgeImageBaseUrl.hostname,
        pathname: "/badge/**",
      },
    ],
  },
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
};

export default nextConfig;
