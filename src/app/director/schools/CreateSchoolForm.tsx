"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

const EMPTY = {
  schoolName: "",
  address1: "",
  address2: "",
  city: "",
  postcode: "",
  contactEmail: "",
  maxStudents: "",
  adminFName: "",
  adminLName: "",
  adminEmail: "",
  adminProfileName: "",
  adminPassword: "",
  adminConfirmPassword: "",
};

type Field = keyof typeof EMPTY;

/** Creates a school and its School Admin login in one go. */
export function CreateSchoolForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ school: string; profileName: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCreated(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/director/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create the school");
      setCreated(data);
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the school");
    } finally {
      setSaving(false);
    }
  };

  const input = (
    name: Field,
    label: string,
    opts: { type?: string; required?: boolean; hint?: string } = {}
  ) => (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={opts.type ?? "text"}
        name={name}
        value={form[name]}
        onChange={change}
        required={opts.required}
        className={`${inputClass} mt-1`}
      />
      {opts.hint && <span className="text-xs text-ink-faint">{opts.hint}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">School</legend>
        {input("schoolName", "School name", { required: true })}
        <div className="grid sm:grid-cols-2 gap-4">
          {input("address1", "Address line 1")}
          {input("address2", "Address line 2")}
          {input("city", "Town / city")}
          {input("postcode", "Postcode")}
          {input("contactEmail", "School contact email", {
            type: "email",
            hint: "Leave blank to use the School Admin's email.",
          })}
          {input("maxStudents", "Pupil seats", { type: "number", hint: "Leave blank for no limit." })}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">
          School Admin login
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          {input("adminFName", "First name", { required: true })}
          {input("adminLName", "Last name", { required: true })}
        </div>
        {input("adminEmail", "Email", { type: "email", required: true, hint: "Used to reset a forgotten password." })}
        {input("adminProfileName", "Login ID", {
          required: true,
          hint: "3-30 characters: letters, numbers, dot, dash or underscore.",
        })}
        <div className="grid sm:grid-cols-2 gap-4">
          {input("adminPassword", "Password", { type: "password", required: true })}
          {input("adminConfirmPassword", "Confirm password", { type: "password", required: true })}
        </div>
      </fieldset>

      {error && <p className="text-sm text-poor" role="alert">{error}</p>}
      {created && (
        <p className="text-sm text-good font-semibold" role="status">
          ✓ Created {created.school}. The School Admin logs in as “{created.profileName}”.
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Creating…" : "Create school"}
      </button>
    </form>
  );
}
