"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { HowItWorksSection } from "./HowItWorksSection";

const SUBJECTS = [
  {
    name: "Mathematics",
    tile: "bg-explorer-tint text-explorer",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" />
      </>
    ),
  },
  {
    name: "English",
    tile: "bg-starter-tint text-starter",
    icon: <path d="M12 6.5C10 5 7 4.5 3 4.5v14c4 0 7 .5 9 2 2-1.5 5-2 9-2v-14c-4 0-7 .5-9 2Zm0 0v14" />,
  },
  {
    name: "Verbal Reasoning",
    tile: "bg-challenger-tint text-challenger",
    icon: (
      <path d="M12 5a3 3 0 0 0-5.5-1.6A3 3 0 0 0 4 8a3.5 3.5 0 0 0 .5 6A3.5 3.5 0 0 0 9 19.5 3 3 0 0 0 12 18m0-13a3 3 0 0 1 5.5-1.6A3 3 0 0 1 20 8a3.5 3.5 0 0 1-.5 6 3.5 3.5 0 0 1-4.5 5.5A3 3 0 0 1 12 18m0-13v13" />
    ),
  },
  {
    name: "Non-Verbal Reasoning",
    tile: "bg-warm-tint text-warm",
    icon: (
      <>
        <path d="m12 3 3.5 6h-7L12 3Z" />
        <circle cx="7" cy="17" r="3.5" />
        <rect x="14" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
  },
];

/** A box over the dimmed page; a click on the dimmed part closes it. */
function Popup({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="card p-7 space-y-5 w-full max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-sans text-xl font-semibold text-login-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close"
            className="text-xl leading-none text-ink-soft hover:text-ink"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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

  const fieldClass =
    "w-full rounded-lg border border-login-border bg-white px-3.5 py-2.5 text-[15px] text-login-body placeholder:text-ink-faint focus:outline-none focus:border-login-teal focus:ring-1 focus:ring-login-teal";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-login-border">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link href="/login" className="inline-flex items-center">
            <BrandLogo height={56} />
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-3 text-sm font-semibold text-login-teal">
            <a
              href="#sigqs-pathway"
              className="whitespace-nowrap rounded-full bg-brand-tint px-2.5 sm:px-3.5 py-1.5 hover:bg-login-border transition"
            >
              SIGQS Pathway
            </a>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="whitespace-nowrap rounded-full bg-brand-tint px-2.5 sm:px-3.5 py-1.5 hover:bg-login-border transition"
            >
              About
            </button>
            <Link
              href="/register"
              className="whitespace-nowrap rounded-full bg-login-teal text-white px-2.5 sm:px-3.5 py-1.5 hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Fills the first screen on a desktop, with the SIGQS Pathway below it. */}
      <main className="flex items-center lg:min-h-[calc(100vh-73px)]">
        {/* On a phone these run in the order written: introduction, login form,
            subjects. On a desktop the form moves to its own column on the right. */}
        <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 py-8 grid gap-x-10 gap-y-7 lg:grid-cols-[55fr_45fr]">
          <section className="lg:col-start-1 lg:row-start-1">
            <p className="inline-block rounded-full bg-explorer-tint px-3 py-1 text-xs font-semibold tracking-wide text-login-teal">
              11+ GRAMMAR SCHOOL PREPARATION
            </p>
            <h1 className="font-sans mt-4 text-3xl lg:text-[40px] lg:leading-[1.2] font-semibold text-login-navy">
              Build confidence. Achieve your potential.
            </h1>
            <span className="block mt-4 h-1 w-12 rounded-full bg-login-gold" aria-hidden="true" />
            <p className="mt-4 text-base text-login-body">
              Structured practice and intelligent assessment to help every student progress with
              confidence.
            </p>
          </section>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[400px] mx-auto lg:mx-0 lg:justify-self-end lg:self-center lg:col-start-2 lg:row-start-1 lg:row-span-2 rounded-2xl bg-login-card p-6 sm:p-7 space-y-4"
          >
            <div className="text-center">
              <h2 className="font-sans text-[27px] font-semibold text-login-navy">Welcome back!</h2>
              <p className="mt-1 text-sm text-login-body">Sign in to continue your learning journey.</p>
            </div>

            <div>
              <label htmlFor="profileName" className="block mb-1.5 text-sm font-medium text-login-body">
                User ID
              </label>
              <input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                autoComplete="username"
                className={fieldClass}
                placeholder="Enter your user ID"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-login-body">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-login-teal hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={fieldClass}
                placeholder="Enter your password"
              />
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
              className="w-full rounded-lg bg-login-cta py-3 text-[15px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60 transition"
            >
              {loading ? "Logging in…" : "Log In"}
            </button>

            <p className="text-center text-sm text-login-body">New to SIGQS?</p>
            <Link
              href="/register"
              className="block w-full rounded-lg border border-login-teal bg-white py-2.5 text-center text-[15px] font-semibold text-login-teal hover:bg-brand-tint transition"
            >
              Create an Account
            </Link>
            <p className="text-center text-xs text-login-body">Secure access for parents and students</p>
          </form>

          <section className="lg:col-start-1 lg:row-start-2">
            <h2 className="font-sans text-lg font-semibold text-login-body">Everything you need to practise</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {SUBJECTS.map((subject) => (
                <li key={subject.name} className={`rounded-xl p-3.5 ${subject.tile}`}>
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
                    {subject.icon}
                  </svg>
                  <p className="mt-2 text-[15px] font-medium text-login-body">{subject.name}</p>
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
              Practise • Improve • Track progress
            </p>
          </section>
        </div>
      </main>

      <HowItWorksSection />

      {aboutOpen && (
        <Popup title="About SIGQS" onClose={() => setAboutOpen(false)}>
          <p className="text-[15px] text-login-body leading-relaxed">
            SIGQS offers structured 11+ practice in Maths, English, Verbal Reasoning and Non-Verbal
            Reasoning, to help children prepare for Grammar School entrance exams. Children practise
            at their own stage, and parents can follow their progress from their own
            dashboard.
          </p>
        </Popup>
      )}
    </div>
  );
}
