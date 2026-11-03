import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const from = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * @/lib/prisma always resolves to the in-memory database, so no test can reach
 * a real one, whatever DATABASE_URL happens to be set to.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: "@/lib/prisma", replacement: from("./test/support/fake-prisma.ts") },
      { find: "next/headers", replacement: from("./test/support/fake-headers.ts") },
      { find: "next/server", replacement: "next/server.js" },
      { find: /^@\//, replacement: from("./src/") },
    ],
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/support/setup.ts"],
    unstubEnvs: true,
    env: {
      JWT_SECRET: "test-only-secret",
      DATABASE_URL: "postgresql://nobody:nobody@127.0.0.1:1/never",
      PAYMENTS_ENFORCED: "false",
    },
  },
});
