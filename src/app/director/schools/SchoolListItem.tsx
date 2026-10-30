"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

export interface SchoolDetails {
  id: number;
  name: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  contactEmail: string;
  maxStudents: number | null;
  isActive: boolean;
}

/** One school in the Product Director's list, with an Edit button that opens its form. */
export function SchoolListItem({
  school,
  pupilCount,
  admins,
}: {
  school: SchoolDetails;
  pupilCount: number;
  admins: string;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="text-ink font-medium">
          {school.name}
          {school.city && <span className="text-ink-soft font-normal"> · {school.city}</span>}
          {!school.isActive && <span className="text-poor font-normal"> · inactive</span>}
        </span>
        <span className="flex items-center gap-4 text-ink-soft">
          <span>
            {pupilCount}
            {school.maxStudents !== null && ` / ${school.maxStudents}`} pupils · {admins || "no admin"}
          </span>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-medium text-brand hover:underline"
            >
              Edit
            </button>
          )}
        </span>
      </div>
      {editing && <EditSchoolForm school={school} onDone={() => setEditing(false)} />}
    </li>
  );
}

/** The school's details, edited in place. The School Admin's login is not edited here. */
function EditSchoolForm({ school, onDone }: { school: SchoolDetails; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    schoolName: school.name,
    address1: school.address1,
    address2: school.address2,
    city: school.city,
    postcode: school.postcode,
    contactEmail: school.contactEmail,
    maxStudents: school.maxStudents === null ? "" : String(school.maxStudents),
  });
  const [isActive, setIsActive] = useState(school.isActive);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !isActive &&
      school.isActive &&
      !window.confirm(`Switch off ${school.name}? Its staff and pupils will be signed out and cannot sign in.`)
    ) {
      return;
    }
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/director/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: school.id, ...form, isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the school");
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the school");
    } finally {
      setSaving(false);
    }
  };

  const input = (name: keyof typeof form, label: string, opts: { type?: string; required?: boolean; hint?: string } = {}) => (
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
    <form onSubmit={submit} className="space-y-4 pt-3">
      {input("schoolName", "School name", { required: true })}
      <div className="grid sm:grid-cols-2 gap-4">
        {input("address1", "Address line 1")}
        {input("address2", "Address line 2")}
        {input("city", "Town / city")}
        {input("postcode", "Postcode")}
        {input("contactEmail", "School contact email", { type: "email" })}
        {input("maxStudents", "Pupil seats", { type: "number", hint: "Leave blank for no limit." })}
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active - untick to sign out and block the school&apos;s staff and pupils
      </label>
      {error && <p className="text-sm text-poor" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onDone} className="btn-quiet px-6 py-2.5">
          Cancel
        </button>
      </div>
    </form>
  );
}
