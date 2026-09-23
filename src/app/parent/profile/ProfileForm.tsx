"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ParentDetails {
  fName: string;
  mName: string;
  lName: string;
  emailAddress: string;
  contactNumber1: string;
  contactNumber2: string;
  userAdd1: string;
  userAdd2: string;
  userAdd3: string;
  userCity: string;
  userCounty: string;
  userZipCode: string;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  name: keyof ParentDetails;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={inputClass}
      />
    </div>
  );
}

export function ProfileForm({ initial }: { initial: ParentDetails }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/parent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not save your details");
        return;
      }

      setSaved(true);
      // The name in the nav bar comes from the server, so it has to re-render.
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
          Your details have been saved.
        </div>
      )}

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Your name
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="First name" name="fName" value={form.fName} onChange={handleChange} required />
          <Field label="Middle name" name="mName" value={form.mName} onChange={handleChange} />
          <Field label="Last name" name="lName" value={form.lName} onChange={handleChange} required />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Email" name="emailAddress" type="email" value={form.emailAddress} onChange={handleChange} />
          <Field label="Phone" name="contactNumber1" value={form.contactNumber1} onChange={handleChange} />
          <Field label="Alternative phone" name="contactNumber2" value={form.contactNumber2} onChange={handleChange} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Address
        </h3>
        <div className="space-y-3">
          <Field label="Address line 1" name="userAdd1" value={form.userAdd1} onChange={handleChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Address line 2" name="userAdd2" value={form.userAdd2} onChange={handleChange} />
            <Field label="Address line 3" name="userAdd3" value={form.userAdd3} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Town or city" name="userCity" value={form.userCity} onChange={handleChange} />
            <Field label="County" name="userCounty" value={form.userCounty} onChange={handleChange} />
            <Field label="Postcode" name="userZipCode" value={form.userZipCode} onChange={handleChange} />
          </div>
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
