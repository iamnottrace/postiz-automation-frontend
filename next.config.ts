import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["studio"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  turbopack: {
    resolveAlias: {
      "design-agent": "./packages/studio/src/stubs/design-agent.js",
      "workflow-builder": "./packages/studio/src/stubs/workflow-builder.js",
    },
  },
};

export default nextConfig;
