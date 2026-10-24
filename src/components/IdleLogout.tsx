"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import sessionConfig from "@/config/session.json";

/**
 * Signs the user out after a stretch with no activity (src/config/session.json),
 * and renews the session while they are active.
 *
 * Activity is a click, key press, touch or scroll, so a child reading a long
 * passage and scrolling counts as active. A box appears shortly before
 * sign-out, because losing a half-finished quiz is worse than a quick tap.
 *
 * This is the friendly half. The real enforcement is on the server: the token
 * itself expires after the same time unless /api/auth/keepalive renews it, so
 * closing the tab or stopping this script does not extend the session.
 */

const IDLE_MS = sessionConfig.idleTimeoutMinutes * 60_000;
const WARN_MS = sessionConfig.warningSeconds * 1_000;
const PING_MS = sessionConfig.keepaliveEveryMinutes * 60_000;

/** Last activity in any tab, so working in one tab keeps the others alive. */
const STORAGE_KEY = "sigqs:lastActive";

/** Pages a visitor sees before signing in; nothing to time out there. */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/terms",
];

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "click",
] as const;

/**
 * A full page load, not a client-side navigation: signing out should drop
 * every cached page and any state held in memory, not just change the route.
 */
function goToLogin(query = ""): void {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login${query}`);
}

/** Whether a 401 from keepalive means this account signed in elsewhere. */
async function wasReplaced(response: Response): Promise<boolean> {
  const data = await response.json().catch(() => ({}));
  return data?.reason === "replaced";
}

function storedActivity(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function IdleWatcher() {
  const lastActive = useRef(0);
  const lastPing = useRef(0);
  const lastWrite = useRef(0);
  const warningOpen = useRef(false);
  const signingOut = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    // The page just loaded, which counts as activity.
    lastActive.current = Date.now();

    const signOut = async () => {
      if (signingOut.current) return;
      signingOut.current = true;
      try {
        // Records the logout and clears the cookie.
        await fetch("/api/auth/logout", { method: "POST", redirect: "manual" });
      } catch {
        // Offline: the token still expires on its own; send them away anyway.
      }
      goToLogin("?reason=idle");
    };

    const ping = () => {
      lastPing.current = Date.now();
      fetch("/api/auth/keepalive", { method: "POST" })
        .then(async (response) => {
          if (response.status !== 401) return;
          if (await wasReplaced(response)) {
            // Signed in on another device. No logout call: that would end
            // the new session too. Just leave, saying why.
            signingOut.current = true;
            goToLogin("?reason=elsewhere");
          } else {
            // Expired, or logged out in another tab.
            signOut();
          }
        })
        .catch(() => {});
    };

    const markActive = () => {
      const now = Date.now();
      lastActive.current = now;
      if (now - lastWrite.current > 5_000) {
        lastWrite.current = now;
        try {
          window.localStorage.setItem(STORAGE_KEY, String(now));
        } catch {
          // Storage blocked: this tab's own clock still works.
        }
      }
      if (now - lastPing.current > PING_MS) ping();
    };

    // While the warning is up, only the buttons count - a stray mouse move
    // must not quietly dismiss it.
    const onActivity = () => {
      if (!warningOpen.current) markActive();
    };

    const check = () => {
      if (signingOut.current) return;
      const idleFor =
        Date.now() - Math.max(lastActive.current, storedActivity());

      if (idleFor >= IDLE_MS) {
        signOut();
      } else if (idleFor >= IDLE_MS - WARN_MS) {
        warningOpen.current = true;
        setSecondsLeft(Math.max(1, Math.ceil((IDLE_MS - idleFor) / 1_000)));
      } else if (warningOpen.current) {
        // Activity in another tab cleared it.
        warningOpen.current = false;
        setSecondsLeft(null);
      }
    };

    for (const name of ACTIVITY_EVENTS) {
      // Capture, so scrolling inside a panel (which does not bubble) counts.
      window.addEventListener(name, onActivity, { passive: true, capture: true });
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(check, 5_000);

    return () => {
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity, { capture: true });
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  const stay = () => {
    warningOpen.current = false;
    setSecondsLeft(null);
    const now = Date.now();
    lastActive.current = now;
    lastPing.current = now;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // see above
    }
    fetch("/api/auth/keepalive", { method: "POST" })
      .then(async (response) => {
        if (response.status === 401) {
          goToLogin((await wasReplaced(response)) ? "?reason=elsewhere" : "?reason=idle");
        }
      })
      .catch(() => {});
  };

  const leave = async () => {
    signingOut.current = true;
    try {
      await fetch("/api/auth/logout", { method: "POST", redirect: "manual" });
    } catch {
      // see above
    }
    goToLogin();
  };

  if (secondsLeft === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-5"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-title"
    >
      <div className="card p-6 sm:p-8 max-w-sm w-full text-center">
        <h2 id="idle-title" className="font-display text-xl font-bold text-ink">
          Still there?
        </h2>
        <p className="text-sm text-ink-soft mt-2">
          You will be signed out in{" "}
          <span className="font-semibold tabular text-ink">{secondsLeft}</span>{" "}
          seconds because there has been no activity.
        </p>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={leave} className="btn-quiet flex-1 py-2.5 text-sm">
            Sign out
          </button>
          <button type="button" onClick={stay} className="btn-primary flex-1 py-2.5 text-sm">
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}

export function IdleLogout() {
  const pathname = usePathname();
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return <IdleWatcher />;
}
