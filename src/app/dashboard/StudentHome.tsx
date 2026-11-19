import Link from "next/link";
import type { ProfileCardData } from "./grammar-home";

/**
 * The social-style student home shared by every programme: a top bar, a
 * profile card on the left, the feed in the middle and side panels on the
 * right. Grammar School (page.tsx) and GCSE / A-Level (SeniorHome.tsx) fill
 * it with their own content.
 */

export function StudentHomeShell({
  name,
  subtitle,
  userId,
  stats,
  feed,
  side,
}: {
  name: string;
  /** e.g. "Grammar School 11+ student" or the pupil's school. */
  subtitle: string;
  userId: string;
  stats: { label: string; value: string }[];
  feed: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ground">

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] items-start">
        {/* Left: profile card. */}
        <ProfileCard name={name} subtitle={subtitle} userId={userId} stats={stats} />

        {/* Middle: the feed. */}
        <section id="feed" className="space-y-4 min-w-0">
          {feed}
        </section>

        {/* Right: side panels. */}
        <aside id="side" className="space-y-4 lg:sticky lg:top-20 scroll-mt-20">
          {side}
        </aside>
      </main>
    </div>
  );
}

/**
 * The student's card: banner, initial, name, school or programme, user ID and
 * a few counts. On the home page and beside every subject page.
 */
export function ProfileCard({
  name,
  subtitle,
  userId,
  stats,
  className = "lg:sticky lg:top-20",
}: ProfileCardData & { className?: string }) {
  return (
    <aside className={`card overflow-hidden ${className}`}>
      <div className="h-16 bg-gradient-to-r from-brand to-login-teal" />
      <div className="px-4 pb-4 -mt-8 text-center">
        <span className="mx-auto w-16 h-16 rounded-full border-4 border-surface bg-brand text-white grid place-items-center font-display text-2xl font-semibold">
          {name.charAt(0).toUpperCase()}
        </span>
        <p className="mt-2 font-display text-lg font-semibold text-ink">{name}</p>
        <p className="text-sm text-ink-soft">{subtitle}</p>
        <p className="text-xs text-ink-faint mt-0.5">@{userId}</p>
      </div>
      <dl className="border-t border-line px-4 py-3 text-sm space-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between gap-3">
            <dt className="text-ink-soft">{stat.label}</dt>
            <dd className="font-semibold text-brand tabular">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

/** The greeting card at the top of the feed. */
export function WelcomeCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold tracking-wide text-login-teal">{eyebrow}</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-sm text-ink-soft">{children}</p>
    </div>
  );
}

/**
 * The heading card at the top of a subject page, in the same style as the
 * home page's greeting card. The chosen level shows beside the subject name.
 */
export function SubjectHeader({
  title,
  level,
  className = "mb-6",
  children,
}: {
  title: string;
  level?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <header className={`card p-5 ${className}`}>
      <p className="text-xs font-semibold tracking-wide text-login-teal">YOUR SUBJECT</p>
      <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold text-ink">
        {title}
        {level && (
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-sm font-medium text-brand">
            {level}
          </span>
        )}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">{children}</p>
    </header>
  );
}

/** "Your subjects" heading; the Subjects button in the top bar jumps here. */
export function SubjectsHeading() {
  return (
    <h3 id="subjects" className="pt-1 text-sm font-semibold text-ink-soft scroll-mt-20">
      Your subjects
    </h3>
  );
}

/** One subject as a feed post. With no href the subject is "coming soon". */
export function SubjectPost({
  name,
  blurb,
  detail,
  tile,
  mark,
  href,
  board,
}: {
  name: string;
  blurb: string;
  /** The awarding organisation chosen on My Profile, e.g. "AQA · 7357". */
  board?: string;
  /** e.g. "1,240 questions"; ignored while the subject is coming soon. */
  detail?: string;
  tile: string;
  mark: string;
  href?: string;
}) {
  return (
    <article className={`card p-4 sm:p-5 flex gap-4 ${href ? "" : "opacity-80"}`}>
      <span
        className={`w-12 h-12 shrink-0 rounded-xl grid place-items-center font-display text-base font-semibold ${tile}`}
        aria-hidden="true"
      >
        {mark}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-ink">{name}</h4>
          {board && (
            <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
              {board}
            </span>
          )}
          {href ? (
            detail && (
              <span className="rounded-full bg-good-tint px-2 py-0.5 text-xs font-medium text-good tabular">
                {detail}
              </span>
            )
          ) : (
            <span className="rounded-full bg-warm-tint px-2 py-0.5 text-xs font-medium text-warm">
              Coming soon
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-soft">{blurb}</p>
        {href ? (
          <Link href={href} className="mt-3 inline-block btn-primary px-3.5 py-1.5 text-sm">
            Start practising
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-3 btn-quiet px-3.5 py-1.5 text-sm"
            title="Available when this subject opens"
          >
            Start practising
          </button>
        )}
      </div>
    </article>
  );
}

/** A titled panel for the right-hand column. */
export function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

const TIPS = [
  "Little and often beats a long cram - try 20 minutes a day.",
  "After each practice set, revisit the questions you got wrong.",
  "Mix topics in one session; it helps you remember for longer.",
];

export function StudyTips() {
  return (
    <SidePanel title="Study tips">
      <ul className="mt-2 space-y-2.5">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-ink-soft">
            <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-login-gold" aria-hidden="true" />
            {tip}
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}
