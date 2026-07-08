import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; let Next transpile them.
  transpilePackages: ["@mellow/shared", "@mellow/ui"],
  // The @mellow/shared and @mellow/ui barrels re-export relative modules with
  // explicit `.js` extensions — required so the NodeNext API typechecks the
  // same source. Turbopack does not substitute `.js` → `.ts` inside these
  // symlinked workspace packages, so we build with Webpack (see package.json)
  // and use extensionAlias to map `./user.js` → `user.ts` during resolution.
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    },
  },
};

export default nextConfig;
