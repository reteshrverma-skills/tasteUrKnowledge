"use client";

import { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

/**
 * Asks for a reset link.
 *
 * The confirmation never says whether the account was found, because that
 * would make this page a way to check which email addresses are registered.
 */
export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setMessage(data.message);
      setIdentifier("");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">TasteUrKnowledge</h1>
          <p className="text-gray-600 mt-2">Forgotten your password?</p>
        </div>

        {message ? (
          <>
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              The link works once and expires in an hour. If it does not arrive,
              check your spam folder.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-600">
              Enter your user ID or the email address on your account and we
              will send you a link to choose a new password.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID or email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                className={inputClass}
                placeholder="priya.sharma or priya@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {sending ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <Link
            href="/login"
            className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to sign in
          </Link>
          {/* Children have no email of their own; their parent holds the account. */}
          <p className="text-xs text-gray-500">
            Children&apos;s logins are managed by their parent — a parent can
            change a child&apos;s password under Profile → Kids Profile.
          </p>
        </div>
      </div>
    </div>
  );
}
