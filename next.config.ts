import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: process.env.R2_PUBLIC_BASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname,
            pathname: "/badge/**",
          },
        ]
      : [],
  },
  // GLSL shader sources (src/cards/shaders) are imported as strings.
  turbopack: {
    rules: {
      "*.frag": { loaders: ["raw-loader"], as: "*.js" },
      "*.vert": { loaders: ["raw-loader"], as: "*.js" },
      "*.glsl": { loaders: ["raw-loader"], as: "*.js" },
    },
  },
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
  experimental: {
    // Keep above MAX_BADGE_IMAGE_BYTES so the service's size error surfaces
    // instead of Next rejecting the multipart body first.
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
