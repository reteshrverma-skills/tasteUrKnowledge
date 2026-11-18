"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface YearOption {
  id: string;
  name: string;
}

const inputClass =
  "w-full px-3 py-2 bg-surface border border-line-strong rounded-lg text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand";

const EMPTY = {
  fName: "",
  mName: "",
  lName: "",
  profileName: "",
  password: "",
  confirmPassword: "",
  passcode: "",
  confirmPasscode: "",
  studentYear: "",
  countryCode: "",
  programmeCode: "",
};

export interface ProgrammeOption {
  code: string;
  name: string;
  /** False: shown as "coming soon" and cannot be chosen yet. */
  available: boolean;
}

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string | null;
}

/**
 * Creating a child gives them their own login: the child signs in as
 * themselves to practise, and the parent manages the account from here.
 */
export function AddChildForm({
  years,
  countries,
  defaultCountry,
  programmes,
}: {
  years: YearOption[];
  countries: CountryOption[];
  /** The parent's own country, pre-selected. */
  defaultCountry: string;
  /** Every programme; those without content yet show as "coming soon". */
  programmes: ProgrammeOption[];
}) {
  const router = useRouter();
  const blank = {
    ...EMPTY,
    countryCode: defaultCountry,
    programmeCode: programmes.find((p) => p.available)?.code ?? "",
  };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  // The children are listed on the dashboard, so say so when one is added.
  const [created, setCreated] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreated("");
    setSaving(true);

    try {
      const response = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create the profile");
        return;
      }

      setCreated(`${form.fName.trim()}'s profile was created - login id ${data.child?.profileName ?? form.profileName}.`);
      setForm(blank);
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-poor-tint border border-poor/25 text-poor px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {created && (
        <div role="status" className="bg-good-tint border border-good/25 text-good px-4 py-3 rounded-lg text-sm">
          {created}{" "}
          <Link href="/parent" className="font-semibold underline underline-offset-2">
            Back to dashboard
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            First name
          </label>
          <input type="text" name="fName" value={form.fName} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Middle name
          </label>
          <input type="text" name="mName" value={form.mName} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Last name
          </label>
          <input type="text" name="lName" value={form.lName} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Child&apos;s login id
          </label>
          <input
            type="text"
            name="profileName"
            value={form.profileName}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="e.g. nayasha.v"
          />
          <p className="text-xs text-ink-faint mt-1">
            3-30 characters. Letters, numbers, dot, dash or underscore.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            School year
          </label>
          <select
            name="studentYear"
            value={form.studentYear}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Choose a year</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-faint mt-1">
            Decides which work your child is shown.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink-soft mb-1">
          Preparing for
        </label>
        <select
          name="programmeCode"
          value={form.programmeCode}
          onChange={handleChange}
          required
          className={inputClass}
        >
          {programmes.map((programme) => (
            <option
              key={programme.code}
              value={programme.code}
              disabled={!programme.available}
            >
              {programme.name}
              {programme.available ? "" : " (coming soon)"}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-faint mt-1">
          Your child sees only this programme&apos;s subjects and questions.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink-soft mb-1">
          Country
        </label>
        <select
          name="countryCode"
          value={form.countryCode}
          onChange={handleChange}
          required
          className={inputClass}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
              {country.dialCode ? ` (${country.dialCode})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Password
          </label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Confirm password
          </label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      {/* Optional: a 6-digit Pin the child can sign in with instead of the password. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Login Pin <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <input
            type="password"
            name="passcode"
            value={form.passcode}
            onChange={handleChange}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="new-password"
            title="6 digits"
            className={inputClass}
            placeholder="6 digits"
          />
          <p className="text-xs text-ink-faint mt-1">
            Your child can sign in with this instead of the password.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1">
            Confirm Pin
          </label>
          <input
            type="password"
            name="confirmPasscode"
            value={form.confirmPasscode}
            onChange={handleChange}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="new-password"
            required={form.passcode !== ""}
            title="6 digits"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full sm:w-auto px-6 py-2.5"
      >
        {saving ? "Creating..." : "Create profile"}
      </button>
    </form>
  );
}
