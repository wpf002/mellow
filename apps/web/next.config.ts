import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; let Next transpile them.
  transpilePackages: ["@mellow/shared", "@mellow/ui"],
};

export default nextConfig;
