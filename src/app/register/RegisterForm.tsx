"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import type { ProgrammeOption } from "@/lib/programme";

export function RegisterForm({ programmes }: { programmes: ProgrammeOption[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // No default: the programme must be chosen.
    programmeCode: "",
    fName: "",
    mName: "",
    lName: "",
    profileName: "",
    password: "",
    confirmPassword: "",
    emailAddress: "",
    // The United Kingdom, pre-selected; it is also first in the list.
    countryCode: "GB",
  });
  const [countries, setCountries] = useState<
    { code: string; name: string; dialCode: string | null }[]
  >([]);

  // The list comes from the country table, so it can change without a deploy.
  useEffect(() => {
    let active = true;
    fetch("/api/countries")
      .then((response) => (response.ok ? response.json() : []))
      .then((list) => {
        if (active && Array.isArray(list)) setCountries(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, acceptTerms }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Parents go to /parent, GCSE / A-Level students to their dashboard.
      router.push(data.redirect || "/parent");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // GCSE and A-Level sign-ups are students, who must sign in with a user ID.
  const isStudent = formData.programmeCode !== "" && formData.programmeCode !== "GRAMMAR";

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const star = (
    <span className="text-red-600" aria-hidden="true">
      *
    </span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 inline-flex items-center gap-2">
            <BrandLogo height={56} />
          </h1>
          <p className="text-gray-600 mt-2">Create Your Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="programmeCode" className={labelClass}>
              Academic Programme {star}
            </label>
            <select
              id="programmeCode"
              name="programmeCode"
              value={formData.programmeCode}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="" disabled>
                Select a programme
              </option>
              {programmes.map((programme) => (
                <option key={programme.code} value={programme.code}>
                  {programme.name}
                </option>
              ))}
            </select>
            {formData.programmeCode === "GRAMMAR" && (
              <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                Sign up for yourself — you will add your children afterwards.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="fName" className={labelClass}>
                First Name {star}
              </label>
              <input
                id="fName"
                type="text"
                name="fName"
                value={formData.fName}
                onChange={handleChange}
                required
                autoComplete="given-name"
                className={inputClass}
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="mName" className={labelClass}>
                Middle Name
              </label>
              <input
                id="mName"
                type="text"
                name="mName"
                value={formData.mName}
                onChange={handleChange}
                autoComplete="additional-name"
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <div>
              <label htmlFor="lName" className={labelClass}>
                Last Name
              </label>
              <input
                id="lName"
                type="text"
                name="lName"
                value={formData.lName}
                onChange={handleChange}
                autoComplete="family-name"
                className={inputClass}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="profileName" className={labelClass}>
                User ID {isStudent && star}
              </label>
              <input
                id="profileName"
                type="text"
                name="profileName"
                value={formData.profileName}
                onChange={handleChange}
                required={isStudent}
                autoComplete="username"
                className={inputClass}
                placeholder={isStudent ? "the id you'll sign in with" : "Optional - or sign in with email"}
              />
            </div>
            <div>
              <label htmlFor="emailAddress" className={labelClass}>
                Email ID {star}
              </label>
              <input
                id="emailAddress"
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                required
                autoComplete="email"
                className={inputClass}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className={labelClass}>
                Password {star}
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className={inputClass}
                placeholder="••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Re-type Password {star}
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className={inputClass}
                placeholder="••••••"
              />
            </div>
          </div>

          <div>
            <label htmlFor="countryCode" className={labelClass}>
              Country Code {star}
            </label>
            <select
              id="countryCode"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {countries.length === 0 ? (
                <option value="GB">United Kingdom (+44)</option>
              ) : (
                countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                    {country.dialCode ? ` (${country.dialCode})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2"
              >
                Terms &amp; Copyright notice
              </Link>
              . All questions and passages are owned by SIGQS and are
              for my family&apos;s personal use only - not to be copied,
              shared or resold.
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {/* Leaves without creating anything - back to sign in. */}
            <Link
              href="/login"
              className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </div>
          <p className="text-xs text-gray-500">{star} Required</p>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
