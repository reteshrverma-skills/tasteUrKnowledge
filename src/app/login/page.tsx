"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        redirect: "follow", // Follow redirects
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        return;
      }

      // The API redirects admins to /admin, parents to /parent and students
      // to /dashboard; follow wherever it landed.
      const destination = new URL(response.url).pathname;
      router.push(destination === "/api/auth/login" ? "/dashboard" : destination);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-grid place-items-center w-12 h-12 rounded-xl bg-brand text-white font-display text-xl font-bold mb-4">
            T
          </span>
          <h1 className="font-display text-2xl font-bold text-ink">
            TasteUrKnowledge
          </h1>
          <p className="text-ink-soft text-sm mt-1.5">
            11+ practice for Year 4 and 5
          </p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="profileName" className="label">
                User ID
              </label>
              <input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                autoComplete="username"
                className="field"
                placeholder="your user id"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="label">
                  Password
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
                placeholder="••••••"
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
              className="btn-primary w-full py-2.5"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-soft mt-6">
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand hover:text-brand-hover"
          >
            Create a parent account
          </Link>
        </p>
      </div>
    </div>
  );
}
