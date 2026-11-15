import type { NextConfig } from "next";

// Cache Components is off on purpose: this is a private, single-user dashboard
// where every page reads live data from Postgres, so every page renders per request.
const nextConfig: NextConfig = {
  poweredByHeader: false,
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
