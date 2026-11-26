"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GoogleSignIn } from "./GoogleSignIn";
import { PinInput } from "@/components/PinInput";

/** The programmes shown under "Explore learning pathways". */
const PATHWAYS = [
  {
    name: "11+ Preparation",
    note: "Grammar School Entrance",
    tile: "bg-explorer-tint text-explorer",
    icon: (
      <>
        <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
        <path d="M6 11.5v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" />
        <path d="M22 9.5v5" />
      </>
    ),
  },
  {
    name: "GCSE",
    note: "Subject-wise Practice",
    tile: "bg-good-tint text-good",
    icon: <path d="M12 6.5C10 5 7 4.5 3 4.5v14c4 0 7 .5 9 2 2-1.5 5-2 9-2v-14c-4 0-7 .5-9 2Zm0 0v14" />,
  },
  {
    name: "A-Level",
    note: "Advanced Learning",
    tile: "bg-warm-tint text-warm",
    icon: (
      <>
        <circle cx="12" cy="8.5" r="5" />
        <path d="m9 13-1.5 8 4.5-2.5 4.5 2.5L15 13" />
      </>
    ),
  },
  {
    name: "More to come",
    note: "Future Learning Pathways",
    tile: "bg-navigator-tint text-navigator",
    icon: (
      <path d="M12 5a3 3 0 0 0-5.5-1.6A3 3 0 0 0 4 8a3.5 3.5 0 0 0 .5 6A3.5 3.5 0 0 0 9 19.5 3 3 0 0 0 12 18m0-13a3 3 0 0 1 5.5-1.6A3 3 0 0 1 20 8a3.5 3.5 0 0 1-.5 6 3.5 3.5 0 0 1-4.5 5.5A3 3 0 0 1 12 18m0-13v13" />
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"user" | "student">("user");
  const isStudent = mode === "student";
  const switchMode = (next: "user" | "student") => {
    setMode(next);
    setProfileName("");
    setPassword("");
    setError("");
  };
  // Sent here by an automatic sign-out: "idle" (no activity) or "elsewhere"
  // (the account signed in on another device). The server snapshot is empty,
  // so the server and browser agree on the first paint and the notice appears
  // after.
  const signOutReason = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("reason") ?? "",
    () => ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isStudent && password.length !== 6) {
      setError("Enter all 6 digits of your Pin");
      return;
    }
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

  // "Continue with Google": the server checks Google's token and signs in the
  // account with that email, then hands back where to go, like the form does.
  const handleGoogle = useCallback(
    async (credential: string) => {
      setError("");
      setLoading(true);
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Google sign-in failed");
          return;
        }
        router.push(data.redirect || "/dashboard");
      } catch (err) {
        setError("An error occurred. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const fieldClass =
    "w-full rounded-lg border border-login-border bg-white px-3.5 py-2.5 text-sm text-login-body placeholder:text-ink-faint focus:outline-none focus:border-login-teal focus:ring-1 focus:ring-login-teal";
  const iconClass =
    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 fill-none stroke-ink-faint [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      {/* Fills the first screen on a desktop, leaving room for the footer. */}
      <main className="flex-1 flex items-center">
        {/* On a phone these run in the order written: introduction, login form,
            subjects. On a desktop the form moves to its own column on the right. */}
        <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 py-8 grid gap-x-10 gap-y-7 lg:grid-cols-[55fr_45fr]">
          <section className="lg:col-start-1 lg:row-start-1">
            <p className="inline-block rounded-full bg-explorer-tint px-3 py-1 text-xs font-semibold tracking-wide text-login-teal">
              INTELLIGENT LEARNING PLATFORM
            </p>
            {/* display: table shrinks the heading to its first line, so "Achieve more." centres under it. */}
            <h1 className="font-sans mt-4 table text-3xl lg:text-[34px] xl:text-[38px] lg:leading-[1.25] font-semibold text-login-navy">
              <span className="block sm:whitespace-nowrap">Learn smarter. Practise better.</span>
              <span className="block text-center text-[#D99A19]">Achieve more.</span>
            </h1>
            <span className="block mt-4 h-1 w-16 rounded-full bg-login-gold" aria-hidden="true" />
            <p className="mt-4 text-base text-login-body">
              Structured learning, intelligent practice and personalised assessments to help every
              learner build knowledge, confidence and achieve their potential.
            </p>
          </section>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[400px] mx-auto lg:mx-0 lg:justify-self-end lg:self-center lg:col-start-2 lg:row-start-1 lg:row-span-2 rounded-2xl bg-login-card p-6 sm:p-7 space-y-4"
          >
            {/* User/Parent or Student sign-in; both post to the same login API. */}
            <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-xl bg-white">
              {(["user", "student"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab}
                  onClick={() => switchMode(tab)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition ${
                    mode === tab
                      ? "bg-login-cta text-white"
                      : "text-login-body hover:text-login-navy"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                    aria-hidden="true"
                  >
                    {tab === "user" ? (
                      <>
                        <circle cx="9" cy="8" r="3.5" />
                        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                        <circle cx="16.5" cy="8.5" r="3" />
                        <path d="M17 14a5.5 5.5 0 0 1 4.5 6" />
                      </>
                    ) : (
                      <>
                        <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
                        <path d="M6 11.5v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" />
                        <path d="M22 9.5v5" />
                      </>
                    )}
                  </svg>
                  {tab === "user" ? "User/Parent" : "Student"}
                </button>
              ))}
            </div>

            {/* Both tabs share this cell, so the card keeps its height when
                switching, and Google's button stays mounted (no re-render). */}
            <div className="grid">
              <div
                className={`col-start-1 row-start-1 space-y-4 ${isStudent ? "invisible" : ""}`}
                aria-hidden={isStudent}
              >
                <GoogleSignIn onCredential={handleGoogle} />

                <div className="flex items-center gap-3 text-xs text-login-body" aria-hidden="true">
                  <span className="h-px flex-1 bg-login-border" />
                  or continue with user ID or email
                  <span className="h-px flex-1 bg-login-border" />
                </div>
              </div>
              {isStudent && (
                <p className="col-start-1 row-start-1 self-center rounded-lg bg-explorer-tint px-3.5 py-2.5 text-center text-sm text-login-teal">
                  Sign in with the user ID and Pin your parent gave you.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="profileName" className="block mb-1.5 text-sm font-bold text-login-body">
                {isStudent ? "User ID" : "User ID or email"}
              </label>
              <div className="relative">
                <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
                  {isStudent ? (
                    <>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </>
                  ) : (
                    <>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3.5 6.5 8.5 6 8.5-6" />
                    </>
                  )}
                </svg>
                <input
                  id="profileName"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  autoComplete="username"
                  className={`${fieldClass} pl-10`}
                  placeholder={isStudent ? "Your user ID" : "you@example.com or your user ID"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-1.5 text-sm font-bold text-login-body">
                {isStudent ? (
                  <>
                    Pin <span className="font-normal">(set by your parent)</span>
                  </>
                ) : (
                  "Password"
                )}
              </label>
              {isStudent ? (
                <div className="flex items-center justify-center gap-2">
                  <PinInput
                    id="password"
                    label="Pin"
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      setError("");
                    }}
                    masked={!showPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide Pin" : "Show Pin"}
                    aria-pressed={showPassword}
                    className="rounded-md p-1.5 text-ink-faint hover:text-login-teal transition"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="M3 3l18 18" />}
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`${fieldClass} pl-10 pr-11`}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint hover:text-login-teal transition"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="M3 3l18 18" />}
                    </svg>
                  </button>
                </div>
              )}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-login-cta py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60 transition"
            >
              {loading ? "Signing in…" : isStudent ? "Let's Start Learning!" : "Sign In"}
            </button>

            <p className="text-center">
              <Link href="/forgot-password" className="text-sm font-semibold text-login-teal hover:underline">
                Forgot your password?
              </Link>
            </p>
          </form>

          <section className="lg:col-start-1 lg:row-start-2">
            <h2 className="font-sans text-lg font-semibold text-login-body">Explore learning pathways</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {PATHWAYS.map((pathway) => (
                <li key={pathway.name} className={`rounded-xl p-3.5 sm:p-4 ${pathway.tile}`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7"
                    aria-hidden="true"
                  >
                    {pathway.icon}
                  </svg>
                  <p className="mt-2 text-[15px] font-semibold text-login-body">{pathway.name}</p>
                  <p className="text-xs text-ink-soft">{pathway.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2.5 text-sm text-login-body">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-login-teal shrink-0"
                aria-hidden="true"
              >
                <path d="M4 20v-4M10 20v-8M16 20v-6M22 20V9M3 11l6-5 5 3 7-6" />
              </svg>
              Learn • Practise • Assess • Progress
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-login-border px-5 py-4 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} SIGQS Lab Ltd. All rights reserved.
      </footer>
    </div>
  );
}
