import type { NextConfig } from "next";

/**
 * When the API is served from its own address (NEXT_API_URL) the browser calls it from the
 * website's address (NEXT_APP_URL), which needs CORS with credentials (the login cookie).
 * With a single deployment there is nothing to add.
 */
const appUrl = (process.env.NEXT_APP_URL ?? "").trim().replace(/\/+$/, "");
const apiUrl = (process.env.NEXT_API_URL ?? "").trim().replace(/\/+$/, "");
const corsHeaders =
  appUrl && apiUrl && appUrl !== apiUrl
    ? [
        {
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Origin", value: appUrl },
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
            { key: "Access-Control-Allow-Headers", value: "Content-Type, Accept" },
            { key: "Vary", value: "Origin" },
          ],
        },
      ]
    : [];

const nextConfig: NextConfig = {
  async headers() {
    return corsHeaders;
  },
  // Lets a verification build use its own folder so it never disturbs a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
