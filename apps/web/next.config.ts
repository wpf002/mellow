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
  // Same-origin proxy to the API service so the browser only ever talks to this
  // origin and the auth cookie is first-party (fixes the cross-site cookie
  // problem across split web/API domains). Better Auth lives at /api/auth on the
  // API (keep the prefix); every other API route is served at the API root
  // (strip the /api prefix). The auth rule must come first.
  async rewrites() {
    const api =
      process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    return {
      beforeFiles: [
        { source: "/api/auth/:path*", destination: `${api}/api/auth/:path*` },
        { source: "/api/:path*", destination: `${api}/:path*` },
      ],
    };
  },
};

export default nextConfig;
