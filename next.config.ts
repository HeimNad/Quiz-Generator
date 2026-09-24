import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  // package.json is the single source of the version; release-please bumps it
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()),
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.js",
    },
  },
};

export default nextConfig;
