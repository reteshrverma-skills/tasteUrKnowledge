"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Sent here by the inactivity sign-out. The server snapshot is false, so the
  // server and browser agree on the first paint and the notice appears after.
  // Sent here by an automatic sign-out: "idle" (no activity) or
  // "elsewhere" (the account signed in on another device).
  const signOutReason = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("reason") ?? "",
    () => ""
  );

  // The login form is a popup, opened by Log In. An automatic sign-out opens it
  // straight away, because the notice saying why is inside it. Null means the
  // visitor has not opened or closed it yet.
  const [loginOpen, setLoginOpen] = useState<boolean | null>(null);
  const showLogin = loginOpen ?? Boolean(signOutReason);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // The API hands back where this account belongs - admins to /admin,
      // parents to /parent, students to /dashboard - and the cookie is already
      // set on that response, so a plain client navigation lands authenticated.
      router.push(data.redirect || "/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col">
      <header className="bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/login" className="flex items-center">
            <Image
              src="/sigqs-logo.png"
              alt="SIGQS - Intelligent practice. Measurable progress."
              width={1810}
              height={546}
              priority
              className="h-20 sm:h-28 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* The banner and the two options, top left, lined up with the logo. */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8">
        {/* One frame around the banner and the two options, so they read as one
            picture rather than buttons sitting under an image. */}
        <div className="w-full max-w-[19rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <h1 className="sr-only">11+ QS</h1>
          <Image
            src="/11plus-qs-banner.png"
            alt="11+ QS: Maths, English, Verbal Reasoning and Non-Verbal Reasoning"
            width={1379}
            height={616}
            priority
            className="w-full h-auto"
          />

          <div className="grid grid-cols-2 gap-2 p-2">
            <button type="button" onClick={() => setLoginOpen(true)} className="btn-primary py-1.5 text-xs">
              Log In
            </button>
            <Link href="/register" className="btn-quiet py-1.5 text-xs text-center">
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      {showLogin && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 px-5 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          onClick={(e) => {
            // A click on the dimmed backdrop closes it; one inside the box does not.
            if (e.target === e.currentTarget) setLoginOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLoginOpen(false);
          }}
        >
          <form onSubmit={handleSubmit} className="card p-7 space-y-5 w-full max-w-md">
            <div className="flex items-center justify-between gap-4">
              <h2 id="login-title" className="font-display text-xl font-bold text-ink">
                Log In
              </h2>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                aria-label="Close"
                className="text-xl leading-none text-ink-soft hover:text-ink"
              >
                ×
              </button>
            </div>

            <div>
              <label htmlFor="profileName" className="label">
                Your user ID *
              </label>
              <input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                className="field"
                placeholder="User ID"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Your password *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="field"
                placeholder="Password"
              />
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand hover:text-brand-hover"
                >
                  Forgotten?
                </Link>
              </div>
            </div>

            {(signOutReason === "idle" || signOutReason === "elsewhere") && !error && (
              <p
                role="status"
                className="bg-warm-tint border border-warm/25 text-warm text-sm px-3.5 py-2.5 rounded-lg"
              >
                {signOutReason === "elsewhere"
                  ? "You were signed out because this account was signed in somewhere else, or its password was changed. Only one session is allowed at a time."
                  : "You were signed out because there was no activity for a while. Please sign in again."}
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="bg-poor-tint border border-poor/25 text-poor text-sm px-3.5 py-2.5 rounded-lg"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
