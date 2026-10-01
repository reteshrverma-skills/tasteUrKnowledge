import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The production build runs on the Azure App Service (Kudu/Oryx), which has
  // the plan's RAM - ~1.75 GB on B1. `next build` compiles fine within that,
  // but the type-check and lint phases that run afterwards load the whole type
  // graph and get OOM-killed ("Running TypeScript ... Killed"), which fails the
  // deploy. Both are already run locally (`tsc --noEmit`, `eslint`) and should
  // be run in CI, so skipping them here trades nothing for a build that fits.
  //
  // If the build ever moves into GitHub Actions (7 GB runners) or the plan is
  // scaled up, these can come back out.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
