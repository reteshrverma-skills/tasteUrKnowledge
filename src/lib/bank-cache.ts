/**
 * Cache for the question-bank listings (which levels and topics exist) on the
 * Maths, Verbal and Non-Verbal pickers.
 *
 * Those lists only change when questions are loaded, which happens through SQL
 * scripts rather than the app, so every page view was recounting the same
 * numbers. Held in this server's memory and dropped:
 *   - every day at 03:00 UK time (BST in summer, GMT in winter),
 *   - at once by "Refresh now" on the admin home page, and
 *   - whenever the app restarts or is redeployed.
 *
 * In memory rather than Next's data cache, which persists across deployments
 * and kept serving a topic that had left the database. One App Service
 * instance means one cache; if the plan is ever scaled out to several, each
 * keeps its own and the button only clears the one that answered it.
 *
 * English is not cached - an admin approving a comprehension should see it go
 * live immediately.
 */

type Entry = { value: Promise<unknown>; expires: number };

// On globalThis so the route handler and the pages share one store even where
// the dev server loads this module more than once.
const store: Map<string, Entry> = ((
  globalThis as unknown as { __bankCache?: Map<string, Entry> }
).__bankCache ??= new Map());

const FLUSH_HOUR_UK = 3;

/** The next 03:00 in Europe/London, as a timestamp. */
export function nextUkFlush(now = Date.now()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)])
  );

  // Today's 03:00 if it is still ahead, otherwise tomorrow's.
  const day = parts.hour < FLUSH_HOUR_UK ? parts.day : parts.day + 1;
  const wallClock = Date.UTC(parts.year, parts.month - 1, day, FLUSH_HOUR_UK);

  // London's offset at that moment: +1h in BST, 0 in GMT. 03:00 is clear of
  // both clock changes (they happen at 01:00 UTC), so it always exists once.
  const offsetName = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "shortOffset",
  })
    .formatToParts(wallClock)
    .find((p) => p.type === "timeZoneName")?.value;
  const offsetHours = Number(offsetName?.replace("GMT", "") || 0);

  return wallClock - offsetHours * 3_600_000;
}

/**
 * Wraps a bank-listing function so its result is reused until the next 03:00
 * UK flush. Arguments are part of the key, so each level is cached apart.
 */
export function cachedUntilFlush<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  return (...args: A) => {
    const key = `${name}:${JSON.stringify(args)}`;
    const now = Date.now();
    const hit = store.get(key);
    if (hit && hit.expires > now) return hit.value as Promise<R>;

    const value = fn(...args);
    store.set(key, { value, expires: nextUkFlush(now) });
    // A failed query must not be served until 03:00.
    value.catch(() => store.delete(key));
    return value;
  };
}

/** Empties the cache; the next page view reads the bank afresh. */
export function clearBankCache(): number {
  const size = store.size;
  store.clear();
  return size;
}
