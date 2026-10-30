"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The small forms on the School Admin (/school) and teacher (/teacher)
 * pages. Each posts JSON to its route and refreshes the page on success; the
 * routes decide what this account may do, so these hold no rules of their own.
 */

const inputClass =
  "w-full px-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent";

export interface Option {
  id: number | string;
  label: string;
}

/** Sends `body` to `url`; returns the parsed answer or throws its error. */
async function sendJson(url: string, body: unknown, method: "POST" | "PATCH") {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

/** Saving state, error and success message shared by every form here. */
function useSubmit() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const run = async (
    url: string,
    body: unknown,
    message: string | ((data: never) => string),
    method: "POST" | "PATCH" = "POST"
  ) => {
    setError("");
    setDone("");
    setSaving(true);
    try {
      const data = await sendJson(url, body, method);
      setDone(typeof message === "function" ? message(data as never) : message);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const status = (
    <>
      {error && <p className="text-sm text-poor" role="alert">{error}</p>}
      {done && <p className="text-sm text-good font-semibold" role="status">✓ {done}</p>}
    </>
  );
  return { saving, run, status };
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input {...props} className={`${inputClass} mt-1`} />
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} required className={`${inputClass} mt-1`}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const EMPTY_TEACHER = { fName: "", lName: "", email: "", profileName: "", password: "", confirmPassword: "" };

/** School Admin: a teacher login, optionally put on some Years at once. */
export function CreateTeacherForm({ years }: { years: Option[] }) {
  const { saving, run, status } = useSubmit();
  const [form, setForm] = useState(EMPTY_TEACHER);
  const [yearIds, setYearIds] = useState<string[]>([]);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggle = (id: string) =>
    setYearIds((prev) => (prev.includes(id) ? prev.filter((y) => y !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(
      "/api/school/teachers",
      { ...form, yearIds },
      (data: { profileName: string }) => `Created teacher. They log in as “${data.profileName}”.`
    );
    if (ok) {
      setForm(EMPTY_TEACHER);
      setYearIds([]);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" name="fName" value={form.fName} onChange={change} required />
        <Field label="Last name" name="lName" value={form.lName} onChange={change} required />
      </div>
      <Field
        label="Email"
        type="email"
        name="email"
        value={form.email}
        onChange={change}
        required
        hint="Used to reset a forgotten password."
      />
      <Field
        label="Login ID"
        name="profileName"
        value={form.profileName}
        onChange={change}
        required
        hint="3-30 characters: letters, numbers, dot, dash or underscore."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Password" type="password" name="password" value={form.password} onChange={change} required />
        <Field
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={change}
          required
        />
      </div>
      {years.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-ink mb-1">Years they teach</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {years.map((y) => (
              <label key={y.id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={yearIds.includes(String(y.id))}
                  onChange={() => toggle(String(y.id))}
                />
                {y.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {status}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Creating…" : "Create teacher"}
      </button>
    </form>
  );
}

/** School Admin: put a teacher on a Year. */
export function AssignTeacherForm({ years, teachers }: { years: Option[]; teachers: Option[] }) {
  const { saving, run, status } = useSubmit();
  const [yearId, setYearId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await run("/api/school/class-teachers", { yearId, teacherId }, "Teacher added to the year.");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="Year" options={years} value={yearId} onChange={setYearId} />
        <Select label="Teacher" options={teachers} value={teacherId} onChange={setTeacherId} />
      </div>
      {status}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Saving…" : "Add to year"}
      </button>
    </form>
  );
}

/** School Admin or teacher: a pupil in a Year, by name only. */
export function AddPupilForm({ years }: { years: Option[] }) {
  const { saving, run, status } = useSubmit();
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [username, setUsername] = useState("");
  const [yearId, setYearId] = useState(years.length === 1 ? String(years[0].id) : "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run("/api/school/pupils", { fName, lName, username, yearId }, `Added ${fName} ${lName}.`)) {
      setFName("");
      setLName("");
      setUsername("");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" value={fName} onChange={(e) => setFName(e.target.value)} required />
        <Field label="Last name" value={lName} onChange={(e) => setLName(e.target.value)} required />
        <Field
          label="Username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          hint="3-30 characters: letters, numbers, dot, dash or underscore."
        />
        <Select label="Year" options={years} value={yearId} onChange={setYearId} />
      </div>
      <p className="text-xs text-ink-faint">Pupils have no password. Their teacher opens them for practice.</p>
      {status}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Adding…" : "Add pupil"}
      </button>
    </form>
  );
}

/** Teacher: the 4-digit PIN that ends a pupil's turn on a classroom device. */
export function SetPinForm({ hasPin }: { hasPin: boolean }) {
  const { saving, run, status } = useSubmit();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run("/api/teacher/pin", { pin, confirmPin, password }, "PIN saved.")) {
      setPin("");
      setConfirmPin("");
      setPassword("");
    }
  };

  const digits = { inputMode: "numeric" as const, pattern: "\\d{4}", maxLength: 4, autoComplete: "off" };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink-soft">
        {hasPin
          ? "Your PIN is set. Enter a new one to change it."
          : "No PIN yet - pupils' turns end with your password until you set one."}
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="New PIN" type="password" {...digits} value={pin} onChange={(e) => setPin(e.target.value)} required />
        <Field
          label="Confirm PIN"
          type="password"
          {...digits}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          required
        />
        <Field
          label="Your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {status}
      <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
        {saving ? "Saving…" : "Save PIN"}
      </button>
    </form>
  );
}

export interface TeacherDetails {
  id: number;
  fName: string;
  lName: string;
  email: string;
  profileName: string;
  isActive: boolean;
  yearIds: string[];
}

/**
 * School Admin: edit a teacher in place - name, email, login ID, Years,
 * active, and a new password only if one is typed.
 */
export function EditTeacherForm({
  teacher,
  years,
  onDone,
}: {
  teacher: TeacherDetails;
  years: Option[];
  onDone: () => void;
}) {
  const { saving, run, status } = useSubmit();
  const [form, setForm] = useState({
    fName: teacher.fName,
    lName: teacher.lName,
    email: teacher.email,
    profileName: teacher.profileName,
    password: "",
    confirmPassword: "",
  });
  const [isActive, setIsActive] = useState(teacher.isActive);
  const [yearIds, setYearIds] = useState<string[]>(teacher.yearIds);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggle = (id: string) =>
    setYearIds((prev) => (prev.includes(id) ? prev.filter((y) => y !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(
      "/api/school/teachers",
      { teacherId: teacher.id, ...form, isActive, yearIds },
      "Teacher updated.",
      "PATCH"
    );
    if (ok) onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4 pt-3">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" name="fName" value={form.fName} onChange={change} required />
        <Field label="Last name" name="lName" value={form.lName} onChange={change} required />
        <Field label="Email" type="email" name="email" value={form.email} onChange={change} required />
        <Field label="Login ID" name="profileName" value={form.profileName} onChange={change} required />
        <Field
          label="New password"
          type="password"
          name="password"
          value={form.password}
          onChange={change}
          autoComplete="new-password"
          hint="Leave blank to keep the current one."
        />
        <Field
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={change}
          autoComplete="new-password"
        />
      </div>
      {years.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-ink mb-1">Years they teach</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {years.map((y) => (
              <label key={y.id} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={yearIds.includes(String(y.id))}
                  onChange={() => toggle(String(y.id))}
                />
                {y.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active - untick to stop this teacher signing in
      </label>
      {status}
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

/** One teacher in the School Admin's list, with an Edit button that opens the form. */
export function TeacherListItem({
  teacher,
  yearNames,
  years,
}: {
  teacher: TeacherDetails;
  yearNames: string;
  years: Option[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="py-2.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="text-ink">
          {teacher.fName} {teacher.lName}
          {!teacher.isActive && <span className="text-poor"> · inactive</span>}
          <span className="text-ink-soft"> · {yearNames || "no year"}</span>
        </span>
        <span className="flex items-center gap-4 text-ink-soft">
          <span>
            {teacher.profileName}
            {teacher.email && ` · ${teacher.email}`}
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
      {editing && <EditTeacherForm teacher={teacher} years={years} onDone={() => setEditing(false)} />}
    </li>
  );
}

export interface PupilDetails {
  studentId: number;
  fName: string;
  lName: string;
  username: string | null;
  yearId: string | null;
  isActive: boolean;
}

/**
 * School Admin or teacher: edit a pupil in place - name, username, Year and
 * active. A blank username gives the pupil a made-up one.
 */
export function EditPupilForm({
  pupil,
  years,
  onDone,
}: {
  pupil: PupilDetails;
  years: Option[];
  onDone: () => void;
}) {
  const { saving, run, status } = useSubmit();
  const [fName, setFName] = useState(pupil.fName);
  const [lName, setLName] = useState(pupil.lName);
  const [username, setUsername] = useState(pupil.username ?? "");
  const [yearId, setYearId] = useState(pupil.yearId ?? "");
  const [isActive, setIsActive] = useState(pupil.isActive);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run(
      "/api/school/pupils",
      { studentId: pupil.studentId, fName, lName, username, yearId, isActive },
      "Pupil updated.",
      "PATCH"
    );
    if (ok) onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4 pt-3">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" value={fName} onChange={(e) => setFName(e.target.value)} required />
        <Field label="Last name" value={lName} onChange={(e) => setLName(e.target.value)} required />
        <Field
          label="Username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          hint="Leave blank for a made-up one."
        />
        <Select label="Year" options={years} value={yearId} onChange={setYearId} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active - untick to hide this pupil and end any turn they have open
      </label>
      {status}
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

/** One pupil in an edit list, with an Edit button that opens the form. */
export function PupilListItem({
  pupil,
  yearName,
  inSession,
  years,
}: {
  pupil: PupilDetails;
  yearName: string | null;
  inSession: boolean;
  years: Option[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="text-ink">
          {pupil.fName} {pupil.lName}
          {pupil.username && <span className="text-ink-soft"> · {pupil.username}</span>}
          {!pupil.isActive && <span className="text-poor"> · inactive</span>}
        </span>
        <span className="flex items-center gap-4 text-ink-soft">
          <span>
            {yearName}
            {inSession && <span className="text-good"> · practising now</span>}
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
      {editing && <EditPupilForm pupil={pupil} years={years} onDone={() => setEditing(false)} />}
    </li>
  );
}
