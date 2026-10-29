"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

const EMPTY = {
  fName: "",
  lName: "",
  profileName: "",
  password: "",
  confirmPassword: "",
};

/** Creates a Product Director login: statistics only, nothing else. */
export function CreateDirectorForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCreated("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/director-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create the account");
      setCreated(data.profileName);
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">First name</span>
          <input name="fName" value={form.fName} onChange={change} required className={`${inputClass} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Last name</span>
          <input name="lName" value={form.lName} onChange={change} required className={`${inputClass} mt-1`} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-ink">Login ID</span>
        <input name="profileName" value={form.profileName} onChange={change} required className={`${inputClass} mt-1`} />
        <span className="text-xs text-ink-faint">3-30 characters: letters, numbers, dot, dash or underscore.</span>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Password</span>
          <input type="password" name="password" value={form.password} onChange={change} required className={`${inputClass} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Confirm password</span>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} required className={`${inputClass} mt-1`} />
        </label>
      </div>

      {error && <p className="text-sm text-poor" role="alert">{error}</p>}
      {created && (
        <p className="text-sm text-good font-semibold" role="status">
          ✓ Created “{created}”. They log in on the normal login page and land on the statistics.
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Creating…" : "Create Product Director"}
      </button>
    </form>
  );
}
