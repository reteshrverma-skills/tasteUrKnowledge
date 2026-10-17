"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          <Link href="/login" className="flex items-center gap-3">
            <BrandLogo size={52} />
            <span className="leading-tight">
              <span className="block font-display text-2xl font-bold">
                <span className="text-[#0b3a6e]">SIGQ</span>
                <span className="text-[#12a874]">S</span>
              </span>
              <span className="block text-xs font-semibold text-ink-soft">
                Intelligent practice. Measurable progress.
              </span>
            </span>
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-block text-sm font-semibold text-brand hover:text-brand-hover"
          >
            Create an account
          </Link>
        </div>
      </header>

      {/* Banner: the page title over the logo colours, with a few faint
          figures from the question bank for texture. */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0b3a6e] via-[#1565c0] to-[#12a874] text-white">
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 300"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full opacity-15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polygon points="110,40 145,60 145,100 110,120 75,100 75,60" />
          <circle cx="210" cy="230" r="30" />
          <polygon points="420,215 445,260 395,260" />
          <rect x="760" y="50" width="54" height="54" rx="8" transform="rotate(12 787 77)" />
          <polygon points="1060,45 1090,100 1030,100" />
          <circle cx="950" cy="225" r="18" />
          <polygon points="1130,190 1155,205 1155,235 1130,250 1105,235 1105,205" />
        </svg>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Sign In</h1>
          <p className="mt-3 text-sm font-medium text-white/85">
            11+ practice for Year 4 and 5
          </p>
        </div>
      </section>

      <main className="flex-1 px-5 py-12">
        <div className="w-full max-w-xl mx-auto">
          <p className="text-center text-lg text-ink-soft">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#12a874] hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
          <h2 className="text-center font-display text-3xl font-bold text-ink mt-4 mb-8">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="card p-7 space-y-5">
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
                autoComplete="username"
                className="field"
                placeholder="User ID"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="label">
                  Your password *
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand hover:text-brand-hover"
                >
                  Forgotten?
                </Link>
              </div>
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
            </div>

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
              className="btn-primary w-full py-3"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
