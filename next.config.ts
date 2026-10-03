import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The production build runs on the Azure App Service (Kudu/Oryx), which has
  // the plan's RAM - ~1.75 GB on B1. `next build` compiles fine within that,
  // but the type-check phase that runs afterwards loads the whole type graph
  // and gets OOM-killed ("Running TypeScript ... Killed"), which fails the
  // deploy. Types are already checked locally (`tsc --noEmit`) and should be in
  // CI, so skipping the in-build check trades nothing for a build that fits.
  //
  // This Next version does not run ESLint during `next build`, so there is
  // nothing to disable there. If the build moves to a GitHub Actions runner
  // (7 GB) or the plan is scaled up, this can come back out.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
