import { beforeEach } from "vitest";
import { jar } from "./fake-headers";
import { buildWorld, forgetCachedSessions } from "./world";

beforeEach(() => {
  buildWorld();
  jar.clear();
  forgetCachedSessions();
  (globalThis as unknown as { __rateLimit?: Map<string, unknown> }).__rateLimit?.clear();
});
