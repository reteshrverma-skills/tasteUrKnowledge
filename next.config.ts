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

  // Don't advertise the framework to scanners.
  poweredByHeader: false,

  // Security headers on every response.
  //
  // The Content-Security-Policy only lets the page load scripts, styles,
  // images and fonts from this site, and talk only to this site. Inline
  // scripts are allowed because Next.js uses them to start each page; a
  // nonce-based policy would make every page render per request and lose the
  // caching. 'unsafe-eval' is added in development only, where Next needs it.
  // form-action names Stripe because the Subscribe and Manage billing forms
  // post here and are redirected on to Stripe.
  headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Browsers must use HTTPS for a year, including subdomains.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // No framing of these pages by other sites (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
