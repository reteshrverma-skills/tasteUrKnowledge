"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { YearOption } from "../AddKidForm";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export interface EditKidInitial {
  fName: string;
  mName: string;
  lName: string;
  studentYear: string;
  isActive: boolean;
}

export function EditKidForm({
  studentId,
  initial,
  years,
}: {
  studentId: number;
  initial: EditKidInitial;
  years: YearOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  // Left blank means "leave the password alone".
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/parent/kids/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(password ? { password, confirmPassword } : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not save the profile");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
          Saved.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
          <input type="text" name="fName" value={form.fName} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle name</label>
          <input type="text" name="mName" value={form.mName} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
          <input type="text" name="lName" value={form.lName} onChange={handleChange} required className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School year</label>
        <select name="studentYear" value={form.studentYear} onChange={handleChange} required className={inputClass}>
          <option value="">Choose a year</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={handleChange}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700">
          <span className="font-medium">Account active</span>
          <span className="block text-xs text-gray-500">
            Turn this off to stop your child logging in. Their work is kept.
          </span>
        </span>
      </label>

      <section className="border-t border-gray-200 pt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Change password
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Leave both boxes empty to keep the current password.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSaved(false);
            }}
            placeholder="New password"
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setSaved(false);
            }}
            placeholder="Confirm new password"
            className={inputClass}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
