import { NextRequest, NextResponse } from "next/server";

/**
 * Fixed-window counters for the sign-in, sign-up and password-reset routes,
 * so a bot cannot guess passwords or flood the forms. Limits are in
 * src/config/security.json.
 *
 * Held in this server's memory: the App Service runs one instance, so one
 * store sees every request. A restart clears it, which only ever loosens the
 * limits for a moment. If the plan is scaled out, each instance counts on its
 * own - move this to the database or a cache then.
 */

type Bucket = { count: number; resetAt: number };

// On globalThis so every route shares one store, even where the dev server
// loads this module more than once.
const store: Map<string, Bucket> = ((
  globalThis as unknown as { __rateLimit?: Map<string, Bucket> }
).__rateLimit ??= new Map());

/** Drops expired buckets once the map grows, so it cannot grow without end. */
function prune(now: number) {
  if (store.size < 10_000) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

function current(key: string, now: number): Bucket | null {
  const bucket = store.get(key);
  return bucket && bucket.resetAt > now ? bucket : null;
}

/** Seconds until `key` is allowed again, or 0 if it is under `limit`. */
export function blockedFor(key: string, limit: number): number {
  const now = Date.now();
  const bucket = current(key, now);
  return bucket && bucket.count >= limit
    ? Math.ceil((bucket.resetAt - now) / 1000)
    : 0;
}

/** Counts one event against `key` in a window of `windowMinutes`. */
export function record(key: string, windowMinutes: number): void {
  const now = Date.now();
  prune(now);
  const bucket = current(key, now);
  if (bucket) {
    bucket.count += 1;
  } else {
    store.set(key, { count: 1, resetAt: now + windowMinutes * 60_000 });
  }
}

/** Forgets `key` - a successful sign-in clears that account's failures. */
export function clear(key: string): void {
  store.delete(key);
}

/**
 * Counts one request and says whether it is over the limit, in one step:
 * for routes where every request counts the same (sign-up, reset).
 */
export function hit(key: string, limit: number, windowMinutes: number): number {
  const wait = blockedFor(key, limit);
  if (wait > 0) return wait;
  record(key, windowMinutes);
  return 0;
}

/**
 * The caller's network address. Azure's front end adds the real client
 * address as the LAST X-Forwarded-For entry (anything before it can be sent
 * by the client), sometimes with a port. Locally there is no proxy.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const last = forwarded?.split(",").pop()?.trim();
  const raw = last || request.headers.get("x-client-ip") || "local";
  // "1.2.3.4:5678" -> "1.2.3.4"; IPv6 in brackets keeps its colons.
  return raw.replace(/^\[(.*)\](:\d+)?$/, "$1").replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1");
}

/** The 429 every limited route answers with. */
export function tooManyRequests(waitSeconds: number, message?: string) {
  const minutes = Math.max(1, Math.ceil(waitSeconds / 60));
  return NextResponse.json(
    {
      error:
        message ??
        `Too many attempts. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
    },
    { status: 429, headers: { "Retry-After": String(waitSeconds) } }
  );
}
