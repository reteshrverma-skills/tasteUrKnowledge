"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface YearOption {
  id: string;
  name: string;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

const EMPTY = {
  fName: "",
  mName: "",
  lName: "",
  profileName: "",
  password: "",
  confirmPassword: "",
  studentYear: "",
};

/**
 * Creating a child gives them their own login: the child signs in as
 * themselves to practise, and the parent manages the account from here.
 */
export function AddKidForm({ years }: { years: YearOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
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
    setSaving(true);

    try {
      const response = await fetch("/api/parent/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create the profile");
        return;
      }

      setForm(EMPTY);
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
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First name
          </label>
          <input type="text" name="fName" value={form.fName} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Middle name
          </label>
          <input type="text" name="mName" value={form.mName} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <input type="text" name="lName" value={form.lName} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <p className="text-xs text-gray-500 mt-1">
            3-30 characters. Letters, numbers, dot, dash or underscore.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <p className="text-xs text-gray-500 mt-1">
            Decides which work your child is shown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {saving ? "Creating..." : "Create profile"}
      </button>
    </form>
  );
}
