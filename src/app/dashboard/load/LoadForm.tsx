"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MAX_FILE_BYTES, MAX_SOURCE_BYTES, MAX_UPLOADS_PER_PAPER } from "@/lib/student-paper-limits";

export interface LoadSubject {
  code: string;
  name: string;
  /** The student's tests in this subject; pages is null when it has no paper yet. */
  tests: { id: string; label: string; pages: number | null }[];
}

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
const MB = 1024 * 1024;

const size = (bytes: number) =>
  bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MB).toFixed(1)} MB`;

const isPdf = (f: File) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);

interface Staged {
  key: string;
  file: File;
  preview: string | null;
}

/**
 * Load: a paper for a new test, or one replacing the paper of an existing
 * test. The picked photos / PDFs are merged into one PDF here, then uploaded.
 */
export function LoadForm({ subjects, storageReady }: { subjects: LoadSubject[]; storageReady: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code ?? "");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [testName, setTestName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [testId, setTestId] = useState("");
  const [staged, setStaged] = useState<Staged[]>([]);
  const [step, setStep] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const subject = subjects.find((s) => s.code === subjectCode) ?? subjects[0];
  const test = subject?.tests.find((t) => t.id === testId) ?? null;
  const busy = step !== null;
  const room = MAX_UPLOADS_PER_PAPER - staged.length;

  // Free photo previews when they leave the list or the page goes away.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const drop = (s: Staged) => {
    if (s.preview) {
      URL.revokeObjectURL(s.preview);
      previews.current.delete(s.preview);
    }
  };

  const pick = (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (input.current) input.current.value = "";
    setMessage(null);
    if (!files.length) return;
    const bad = files.find((f) => !isPdf(f) && !isImage(f));
    if (bad) return setMessage({ ok: false, text: `${bad.name} is not a PDF or a photo.` });
    const big = files.find((f) => f.size > MAX_SOURCE_BYTES);
    if (big) return setMessage({ ok: false, text: `${big.name} is over ${MAX_SOURCE_BYTES / MB} MB.` });
    if (files.length > room) {
      return setMessage({
        ok: false,
        text: `A paper takes up to ${MAX_UPLOADS_PER_PAPER} photos / PDFs${room ? ` - ${room} more fit` : ""}.`,
      });
    }
    setStaged((s) => [
      ...s,
      ...files.map((file) => {
        const preview = isImage(file) && !/\.(heic|heif)$/i.test(file.name) ? URL.createObjectURL(file) : null;
        if (preview) previews.current.add(preview);
        return { key: crypto.randomUUID(), file, preview };
      }),
    ]);
  };

  const move = (i: number, by: number) =>
    setStaged((s) => {
      const next = [...s];
      const [item] = next.splice(i, 1);
      next.splice(i + by, 0, item);
      return next;
    });

  const unstage = (i: number) =>
    setStaged((s) => {
      drop(s[i]);
      return s.filter((_, j) => j !== i);
    });

  const clear = () => {
    staged.forEach(drop);
    setStaged([]);
  };

  const ready =
    storageReady && staged.length > 0 && (mode === "new" ? testName.trim().length > 0 : Boolean(test));

  const save = async () => {
    if (!ready || busy || !subject) return;
    if (mode === "existing" && test?.pages && !confirm(`Replace the paper for "${test.label}"?`)) return;
    setMessage(null);
    setDone(null);
    try {
      setStep("Loading...");
      const { mergePaper, PaperFileError } = await import("@/lib/merge-paper");
      let merged;
      try {
        merged = await mergePaper(null, staged.map((s) => s.file), setStep);
      } catch (e) {
        throw e instanceof PaperFileError ? e : new Error("Could not join the files into one PDF");
      }
      if (merged.bytes.length > MAX_FILE_BYTES) {
        throw new Error(`The paper would be ${size(merged.bytes.length)} - over ${MAX_FILE_BYTES / MB} MB. Try fewer or smaller files.`);
      }

      setStep(mode === "new" ? "Adding the test..." : "Preparing...");
      const res = await fetch("/api/student/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "new" ? { subjectCode: subject.code, testName, testDate: testDate || undefined } : { testId }
        ),
      });
      const paper = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(paper.error || "Could not set up the paper");

      setStep(`Uploading ${size(merged.bytes.length)}...`);
      const form = new FormData();
      form.append("file", new Blob([merged.bytes], { type: "application/pdf" }), "paper.pdf");
      form.append("added", String(staged.length));
      form.append("replace", "1");
      const up = await fetch(`/api/student/papers/${paper.paperId}/files`, { method: "POST", body: form });
      const data = await up.json().catch(() => ({}));
      if (!up.ok) {
        // A new test exists now even though its paper did not upload.
        if (mode === "new") {
          setMode("existing");
          setTestId(paper.testId);
          router.refresh();
        }
        throw new Error(
          `${data.error || "Could not upload the paper"}${mode === "new" ? " - the test was added; try the upload again." : ""}`
        );
      }

      clear();
      setTestName("");
      setTestDate("");
      setTestId("");
      setMode("new");
      setDone(subject.code);
      setMessage({ ok: true, text: `Saved - ${merged.pageCount} ${merged.pageCount === 1 ? "page" : "pages"}.` });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setStep(null);
    }
  };

  const tab = (value: "new" | "existing", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => {
        setMode(value);
        setMessage(null);
      }}
      disabled={busy}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
        mode === value ? "bg-surface text-brand shadow-sm" : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="card p-4 sm:p-5 space-y-4">
      {!storageReady && (
        <p className="rounded-lg bg-warm-tint px-3 py-2 text-sm text-warm">Uploading papers is not switched on yet.</p>
      )}

      <label className="block text-sm">
        <span className="text-ink-soft">Subject</span>
        <select
          value={subject?.code}
          onChange={(e) => {
            setSubjectCode(e.target.value);
            setTestId("");
            setMessage(null);
          }}
          disabled={busy}
          className="field mt-1 w-full px-3 py-2 text-sm"
        >
          {subjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div role="tablist" className="flex gap-1 rounded-xl bg-ground p-1">
        {tab("new", "1. New test")}
        {tab("existing", "2. Already existing")}
      </div>

      {mode === "new" ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <label className="block text-sm">
            <span className="text-ink-soft">Test name</span>
            <input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              maxLength={120}
              disabled={busy}
              placeholder="e.g. Year 12 Maths Assessment 2a"
              className="field mt-1 w-full px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Test date (optional)</span>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              disabled={busy}
              className="field mt-1 w-full px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : subject && subject.tests.length === 0 ? (
        <p className="text-sm text-ink-soft">You have no {subject.name} tests yet - start a new one.</p>
      ) : (
        <label className="block text-sm">
          <span className="text-ink-soft">Test</span>
          <select
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            disabled={busy}
            className="field mt-1 w-full px-3 py-2 text-sm"
          >
            <option value="">Choose a test...</option>
            {subject?.tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.pages !== null ? " (has a paper)" : ""}
              </option>
            ))}
          </select>
          {test?.pages != null && (
            <span className="mt-1 block text-xs text-warm">
              This test already has a paper ({test.pages} {test.pages === 1 ? "page" : "pages"}). Saving replaces it.
            </span>
          )}
        </label>
      )}

      {staged.length > 0 && (
        <div className="rounded-lg border border-dashed border-line-strong p-2">
          <p className="px-1 pb-1 text-xs text-ink-soft">Pages will be in this order:</p>
          <ol className="space-y-1">
            {staged.map((s, i) => (
              <li key={s.key} className="flex items-center gap-2 rounded-md bg-surface px-2 py-1 text-sm">
                <span className="w-5 text-right text-xs text-ink-faint tabular">{i + 1}</span>
                {s.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local preview of a picked photo
                  <img src={s.preview} alt="" className="h-9 w-9 rounded object-cover border border-line" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded border border-line text-base" aria-hidden>
                    {isPdf(s.file) ? "📄" : "🖼️"}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{s.file.name}</span>
                <span className="text-xs text-ink-faint tabular">{size(s.file.size)}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="Move up" className="px-1 text-ink-soft hover:text-ink disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={busy || i === staged.length - 1} aria-label="Move down" className="px-1 text-ink-soft hover:text-ink disabled:opacity-30">
                  ↓
                </button>
                <button type="button" onClick={() => unstage(i)} disabled={busy} aria-label={`Take ${s.file.name} out`} className="px-1 text-ink-faint hover:text-poor disabled:opacity-30">
                  ✕
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => pick(e.target.files)} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={room <= 0 || busy || !storageReady}
          className="btn-quiet px-3 py-1.5 text-sm disabled:opacity-50"
        >
          + Add photos / PDFs
        </button>
        <button type="button" onClick={save} disabled={!ready || busy} className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50">
          {step ?? (mode === "existing" && test?.pages != null ? "Replace paper" : "Save paper")}
        </button>
        {staged.length > 0 && !busy && (
          <button type="button" onClick={clear} className="text-xs text-ink-soft hover:text-ink">
            Clear
          </button>
        )}
        <span className="text-xs text-ink-faint">
          Up to {MAX_UPLOADS_PER_PAPER} photos / PDFs, joined into one PDF.
        </span>
      </div>

      {message && (
        <p className={`text-sm ${message.ok ? "text-good" : "text-poor"}`} role="status">
          {message.text}{" "}
          {message.ok && done && (
            <Link href={`/dashboard/subjects/${done}`} className="font-medium text-brand hover:underline">
              See it on the subject page
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
