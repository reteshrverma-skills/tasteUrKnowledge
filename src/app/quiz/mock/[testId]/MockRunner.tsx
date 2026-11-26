"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { QuestionBody } from "./QuestionBody";

export interface RunnerQuestion {
  id: string;
  order: number;
  quest: string;
  /** Sanitised SVG markup, or null. */
  stem: string | null;
  optionFormat: string;
  /** value is text, or sanitised SVG when optionFormat is not "text". */
  options: { letter: string; value: string }[];
}

export type RunnerView =
  | { kind: "intro" }
  | { kind: "upcoming"; opensAt: string }
  | { kind: "closed" }
  | {
      kind: "section";
      /** The section attempt's id, to keep this sitting's review flags apart. */
      attemptKey: string;
      setNo: number;
      sectionLabel: string;
      endsAt: number;
      passage: { title: string; story: string } | null;
      questions: RunnerQuestion[];
      answers: Record<string, string>;
    }
  | { kind: "between"; setNo: number; next: { label: string; minutes: number; questions: number } }
  | { kind: "break"; breakEnds: number }
  | { kind: "finished"; marks: number; total: number; sets: { setNo: number; marks: number; total: number; reason: string | null }[] };

interface SectionRow {
  id: string;
  setNo: number;
  label: string;
  minutes: number;
  questions: number;
  status: "waiting" | "running" | "done";
  correct: number | null;
  total: number | null;
}

/** Milliseconds until `target` by the server's clock, ticking every second. */
function useCountdown(target: number | null, serverNow: number) {
  const [offset] = useState(() => serverNow - Date.now());
  const [left, setLeft] = useState(() => (target === null ? 0 : Math.max(0, target - (Date.now() + offset))));
  useEffect(() => {
    if (target === null) return;
    const tick = () => setLeft(Math.max(0, target - (Date.now() + offset)));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [target, offset]);
  return left;
}

/** "Mark for review" flags live in localStorage; this event tells the page they changed. */
const FLAG_EVENT = "mock-flags-change";
function subscribeFlags(onChange: () => void) {
  window.addEventListener(FLAG_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(FLAG_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function readFlags(key: string) {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

/** Seconds since a performance.now() reading. */
function secondsSince(start: number) {
  return (performance.now() - start) / 1000;
}

function clock(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function MockRunner({
  testId,
  name,
  closesAt,
  closesAtMs,
  breakMinutes,
  serverNow,
  sections,
  view,
}: {
  testId: string;
  name: string;
  closesAt: string;
  closesAtMs: number;
  breakMinutes: number;
  serverNow: number;
  sections: SectionRow[];
  view: RunnerView;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const act = useCallback(
    async (body: Record<string, unknown>, refresh = true) => {
      setError("");
      const response = await fetch(`/api/mock/${testId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.error || "Something went wrong. Please try again.");
      if (refresh || !response.ok) router.refresh();
      return response.ok;
    },
    [testId, router]
  );

  const start = async () => {
    setBusy(true);
    await act({ action: "start" });
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-ground">
      <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo height={36} />
            <span className="font-semibold text-ink truncate">{name}</span>
          </div>
          {view.kind === "section" ? (
            <SectionClock endsAt={view.endsAt} serverNow={serverNow} label={`Set ${view.setNo} · ${view.sectionLabel}`} />
          ) : (
            <Link href="/dashboard/mock-tests" className="text-sm font-medium text-ink-soft hover:text-brand">
              ← Mock Test
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {error && (
          <p className="mb-4 rounded-lg bg-poor-tint px-4 py-2.5 text-sm text-poor" role="alert">
            {error}
          </p>
        )}
        {view.kind === "intro" && (
          <Intro sections={sections} breakMinutes={breakMinutes} closesAt={closesAt} closesAtMs={closesAtMs} serverNow={serverNow} busy={busy} onStart={start} />
        )}
        {view.kind === "upcoming" && <Message title="Not open yet">This mock test opens {view.opensAt}.</Message>}
        {view.kind === "closed" && (
          <Message title="This mock test has closed">It closed on {closesAt} and can no longer be started.</Message>
        )}
        {view.kind === "section" && <Section view={view} serverNow={serverNow} act={act} />}
        {view.kind === "between" && (
          <div className="max-w-xl mx-auto space-y-4">
            <Overview sections={sections} />
            <div className="card p-6 text-center">
              <p className="text-xs font-semibold tracking-wide text-login-teal">SET {view.setNo} · NEXT SECTION</p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{view.next.label}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {view.next.questions} questions · {view.next.minutes} minutes. The clock starts when you press Start.
              </p>
              <button type="button" onClick={start} disabled={busy} className="mt-5 btn-primary px-6 py-2.5 disabled:opacity-50">
                {busy ? "Starting..." : `Start ${view.next.label}`}
              </button>
            </div>
          </div>
        )}
        {view.kind === "break" && <Break breakEnds={view.breakEnds} serverNow={serverNow} sections={sections} busy={busy} onStart={start} />}
        {view.kind === "finished" && <Finished testId={testId} view={view} sections={sections} />}
      </main>
    </div>
  );
}

function SectionClock({ endsAt, serverNow, label }: { endsAt: number; serverNow: number; label: string }) {
  const left = useCountdown(endsAt, serverNow);
  const low = left < 60000;
  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-sm text-ink-soft">{label}</span>
      <span
        className={`rounded-lg px-3 py-1.5 font-semibold tabular ${low ? "bg-poor-tint text-poor" : "bg-brand-tint text-brand"}`}
        aria-live="off"
      >
        {clock(left)}
      </span>
    </div>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-8 max-w-xl mx-auto text-center">
      <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{children}</p>
      <Link href="/dashboard/mock-tests" className="mt-5 inline-block btn-primary px-5 py-2">
        Back to Mock Test
      </Link>
    </div>
  );
}

function Overview({ sections }: { sections: SectionRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[1, 2].map((setNo) => (
        <div key={setNo} className="card p-4">
          <h3 className="font-semibold text-ink">Set {setNo}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {sections
              .filter((s) => s.setNo === setNo)
              .map((s) => (
                <li key={s.id} className="flex justify-between gap-3">
                  <span className="text-ink">{s.label}</span>
                  <span className="text-ink-soft tabular">
                    {s.status === "done" ? "Done" : s.status === "running" ? "In progress" : `${s.questions} Q · ${s.minutes} min`}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Intro({
  sections,
  breakMinutes,
  closesAt,
  closesAtMs,
  serverNow,
  busy,
  onStart,
}: {
  sections: SectionRow[];
  breakMinutes: number;
  closesAt: string;
  closesAtMs: number;
  serverNow: number;
  busy: boolean;
  onStart: () => void;
}) {
  const totalMinutes = sections.reduce((n, s) => n + s.minutes, 0) + breakMinutes;
  const minutesLeft = Math.floor((closesAtMs - serverNow) / 60000);
  const tight = minutesLeft < totalMinutes;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card p-6">
        <p className="text-xs font-semibold tracking-wide text-login-teal">MOCK TEST</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Before you start</h1>
        <ul className="mt-4 space-y-2 text-sm text-ink">
          <li>• There are 2 sets. Each has English, Maths and Verbal Reasoning, then Non-Verbal Reasoning in 3 short parts. Every section is timed separately.</li>
          <li>• Each section has its own clock. When it reaches zero, the section closes and you cannot go back to it.</li>
          <li>• You can move between questions and change answers until the section ends. Answers are saved as you go.</li>
          <li>• After Set 1 there is a {breakMinutes}-minute break. You can start Set 2 early; when the break ends it starts by itself.</li>
          <li>• You can sit this mock test once. If you lose your connection, come back and carry on: the clock keeps running.</li>
        </ul>
        {tight && (
          <p className="mt-4 rounded-lg bg-warm-tint px-4 py-2.5 text-sm text-warm">
            This mock test closes at {closesAt}. You have about {minutesLeft} minutes left, but the whole test takes about{" "}
            {totalMinutes} minutes, so you may not finish.
          </p>
        )}
      </div>
      <Overview sections={sections} />
      <div className="text-center">
        <button type="button" onClick={onStart} disabled={busy} className="btn-primary px-8 py-3 text-base disabled:opacity-50">
          {busy ? "Starting..." : "Start Set 1"}
        </button>
      </div>
    </div>
  );
}

function Section({
  view,
  serverNow,
  act,
}: {
  view: Extract<RunnerView, { kind: "section" }>;
  serverNow: number;
  act: (body: Record<string, unknown>, refresh?: boolean) => Promise<boolean>;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(view.answers);
  const [finishing, setFinishing] = useState(false);
  // Questions the child wants to come back to. Kept in this browser only, so a
  // reload keeps them; they mean nothing to the marking.
  const flagKey = `mock-flags:${view.attemptKey}`;
  const flagRaw = useSyncExternalStore(subscribeFlags, () => readFlags(flagKey), () => "[]");
  const flagged = useMemo(() => {
    try {
      const saved = JSON.parse(flagRaw);
      return new Set<string>(Array.isArray(saved) ? saved.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, [flagRaw]);
  const toggleFlag = (id: string) => {
    const next = new Set(flagged);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      localStorage.setItem(flagKey, JSON.stringify([...next]));
    } catch {}
    window.dispatchEvent(new Event(FLAG_EVENT));
  };
  const spent = useRef<Record<string, number>>({});
  const shownAt = useRef<number>(0);
  const left = useCountdown(view.endsAt, serverNow);
  const ended = useRef(false);
  const q = view.questions[index];

  // Time on each question, so the report can show where time went.
  useEffect(() => {
    shownAt.current = performance.now();
    const id = q?.id;
    const store = spent.current;
    return () => {
      if (id) store[id] = (store[id] ?? 0) + secondsSince(shownAt.current);
    };
  }, [q?.id]);

  // When the clock reaches zero the server closes the section; reload to move on.
  useEffect(() => {
    if (left === 0 && !ended.current) {
      ended.current = true;
      act({ action: "submit" });
    }
  }, [left, act]);

  if (!q) return null;

  const choose = (letter: string) => {
    const chosen = answers[q.id] === letter ? null : letter;
    setAnswers((a) => {
      const next = { ...a };
      if (chosen) next[q.id] = chosen;
      else delete next[q.id];
      return next;
    });
    const seconds = (spent.current[q.id] ?? 0) + secondsSince(shownAt.current);
    act({ action: "answer", questionId: q.id, chosen, seconds: Math.round(seconds * 100) / 100 }, false);
  };

  const finish = async () => {
    const unanswered = view.questions.length - Object.keys(answers).length;
    const marked = view.questions.filter((x) => flagged.has(x.id)).length;
    let note = unanswered > 0 ? ` You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}.` : "";
    if (marked > 0) note += ` ${marked} question${marked === 1 ? " is" : "s are"} marked for review.`;
    if (!window.confirm(`Finish ${view.sectionLabel} now? You cannot come back to it.${note}`)) return;
    setFinishing(true);
    ended.current = true;
    await act({ action: "submit" });
  };

  const questionCard = (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-login-teal">
          QUESTION {q.order} OF {view.questions.length}
        </p>
        <button
          type="button"
          onClick={() => toggleFlag(q.id)}
          aria-pressed={flagged.has(q.id)}
          className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
            flagged.has(q.id) ? "border-warm bg-warm-tint text-warm" : "border-line text-ink-soft hover:border-line-strong"
          }`}
        >
          {flagged.has(q.id) ? "⚑ Marked for review" : "⚐ Mark for review"}
        </button>
      </div>
      <QuestionBody q={q} chosen={answers[q.id] ?? null} onChoose={choose} />
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="btn-quiet px-4 py-2 text-sm disabled:opacity-40">
          ← Previous
        </button>
        {index < view.questions.length - 1 ? (
          <button type="button" onClick={() => setIndex((i) => i + 1)} className="btn-primary px-4 py-2 text-sm">
            Next →
          </button>
        ) : (
          <button type="button" onClick={finish} disabled={finishing} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            Finish section
          </button>
        )}
      </div>
    </div>
  );

  const navigator = (
    <div className="card p-4">
      <p className="text-sm font-semibold text-ink">
        {Object.keys(answers).length} of {view.questions.length} answered
      </p>
      {flagged.size > 0 && (
        <p className="mt-0.5 text-xs text-warm">
          {view.questions.filter((x) => flagged.has(x.id)).length} marked for review
        </p>
      )}
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
        {view.questions.map((x, i) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Question ${x.order}${flagged.has(x.id) ? ", marked for review" : ""}`}
            className={`relative h-8 rounded-md text-xs font-semibold tabular ${
              i === index ? "ring-2 ring-brand" : ""
            } ${answers[x.id] ? "bg-brand text-white" : "bg-ground text-ink-soft"} ${
              flagged.has(x.id) ? "outline-2 outline-warm outline-offset-[-2px]" : ""
            }`}
          >
            {x.order}
            {flagged.has(x.id) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warm" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand" />Answered</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warm" />For review</span>
      </div>
      <button type="button" onClick={finish} disabled={finishing} className="mt-4 w-full btn-quiet px-3 py-2 text-sm disabled:opacity-50">
        {finishing ? "Finishing..." : "Finish section"}
      </button>
    </div>
  );

  if (view.passage) {
    return (
      // Passage on the left takes the extra width; the question with the
      // question numbers under it on the right.
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
        <article className="card p-5 sm:p-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:sticky lg:top-20">
          <h2 className="font-display text-lg font-semibold text-ink">{view.passage.title}</h2>
          {view.passage.story.split("\n\n").map((p, i) => (
            <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink">
              {p}
            </p>
          ))}
        </article>
        <div className="space-y-5 min-w-0">
          {questionCard}
          {navigator}
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] items-start max-w-4xl mx-auto">
      {questionCard}
      {navigator}
    </div>
  );
}

function Break({
  breakEnds,
  serverNow,
  sections,
  busy,
  onStart,
}: {
  breakEnds: number;
  serverNow: number;
  sections: SectionRow[];
  busy: boolean;
  onStart: () => void;
}) {
  const router = useRouter();
  const left = useCountdown(breakEnds, serverNow);
  const reloaded = useRef(false);
  useEffect(() => {
    // The server starts Set 2 when the break ends; reload to show it.
    if (left === 0 && !reloaded.current) {
      reloaded.current = true;
      router.refresh();
    }
  }, [left, router]);
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="card p-6 text-center">
        <p className="text-xs font-semibold tracking-wide text-login-teal">SET 1 DONE · BREAK</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Take a short break</h1>
        <p className="mt-3 font-display text-4xl font-semibold text-brand tabular">{clock(left)}</p>
        <p className="mt-2 text-sm text-ink-soft">Set 2 starts by itself when the break ends, or you can start it now.</p>
        <button type="button" onClick={onStart} disabled={busy} className="mt-5 btn-primary px-6 py-2.5 disabled:opacity-50">
          {busy ? "Starting..." : "Start Set 2 now"}
        </button>
      </div>
      <Overview sections={sections} />
    </div>
  );
}

function Finished({ testId, view, sections }: { testId: string; view: Extract<RunnerView, { kind: "finished" }>; sections: SectionRow[] }) {
  const pct = view.total ? Math.round((view.marks / view.total) * 100) : 0;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card p-6 text-center">
        <p className="text-xs font-semibold tracking-wide text-login-teal">MOCK TEST COMPLETE</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Well done for finishing!</h1>
        <p className="mt-3 font-display text-4xl font-semibold text-brand tabular">
          {view.marks} / {view.total}
        </p>
        <p className="text-sm text-ink-soft">{pct}% overall</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {view.sets.map((set) => (
          <div key={set.setNo} className="card p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-ink">Set {set.setNo}</h3>
              <span className="font-semibold text-brand tabular">
                {set.marks}/{set.total}
              </span>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {sections
                .filter((s) => s.setNo === set.setNo)
                .map((s) => (
                  <li key={s.id} className="flex justify-between gap-3">
                    <span className="text-ink">{s.label}</span>
                    <span className="text-ink-soft tabular">
                      {s.correct === null ? "Not reached" : `${s.correct}/${s.total}`}
                    </span>
                  </li>
                ))}
            </ul>
            {set.reason === "paper_closed" && <p className="mt-2 text-xs text-warm">The mock test closed before this set was finished.</p>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={`/quiz/mock/${testId}/review`} className="btn-primary px-6 py-2.5">
          Review answers
        </Link>
        <Link href="/dashboard/mock-tests" className="btn-quiet px-6 py-2.5">
          Back to Mock Test
        </Link>
      </div>
    </div>
  );
}
