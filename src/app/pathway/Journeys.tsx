import Image from "next/image";
import { STEPS } from "@/app/parent/HowItWorks";
import { LevelIcon } from "@/app/dashboard/subject/LevelIcon";
import { LEVEL_STAGES } from "@/lib/level-style";

const LEVELS = [
  { level: "Starter", tag: "Build the basics" },
  { level: "Explorer", tag: "Discover more" },
  { level: "Navigator", tag: "Find your way" },
  { level: "Challenger", tag: "Take on challenges" },
  { level: "Master", tag: "Lead with excellence" },
];

/** Drawn rather than photographed, so they stay sharp and hold no real child's details. */
function Picture({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 140" className="w-full h-auto rounded-xl bg-login-card" aria-hidden="true">
      {children}
    </svg>
  );
}

function Person({ x, y, scale = 1, className }: { x: number; y: number; scale?: number; className: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={className}>
      <circle cx="0" cy="0" r="11" />
      <path d="M-18 34a18 18 0 0 1 36 0Z" />
    </g>
  );
}

const PICTURES = [
  // A parent, with a profile card for each child.
  <Picture key="parent">
    <Person x={58} y={52} scale={1.3} className="fill-login-navy" />
    <path d="M92 70h24" className="stroke-login-gold" strokeWidth="3" strokeLinecap="round" />
    {[26, 78].map((y, i) => (
      <g key={y}>
        <rect x="126" y={y} width="92" height="20" rx="8" className="fill-white stroke-login-border" />
        <Person x={146} y={y + 14} scale={0.45} className={i ? "fill-challenger" : "fill-login-teal"} />
        <rect x="164" y={y + 12} width="42" height="6" rx="3" className="fill-login-navy" />
        <rect x="164" y={y + 24} width="28" height="5" rx="2.5" className="fill-login-border" />
      </g>
    ))}
  </Picture>,

  // A child's own login on a tablet.
  <Picture key="child">
    <rect x="62" y="12" width="116" height="116" rx="10" className="fill-white stroke-login-border" />
    <Person x={120} y={38} scale={0.65} className="fill-login-teal" />
    <rect x="80" y="70" width="80" height="11" rx="4" className="fill-login-card stroke-login-border" />
    <rect x="80" y="86" width="80" height="11" rx="4" className="fill-login-card stroke-login-border" />
    <rect x="80" y="104" width="80" height="13" rx="5" className="fill-login-cta" />
  </Picture>,

  // A test question with the right answer ticked.
  <Picture key="test">
    <rect x="30" y="12" width="180" height="116" rx="10" className="fill-white stroke-login-border" />
    <rect x="44" y="24" width="48" height="10" rx="5" className="fill-explorer-tint" />
    <rect x="44" y="42" width="152" height="6" rx="3" className="fill-login-navy" />
    {[56, 80, 104].map((y, i) => (
      <g key={y}>
        <rect
          x="44"
          y={y}
          width="152"
          height="18"
          rx="5"
          className={i === 1 ? "fill-starter-tint stroke-starter" : "fill-white stroke-login-border"}
        />
        {i === 1 && (
          <path d="m52 89 4 4 7-8" fill="none" className="stroke-starter" strokeWidth="2.5" strokeLinecap="round" />
        )}
        <rect x="70" y={y + 7} width={i === 1 ? 80 : 100} height="4" rx="2" className="fill-login-border" />
      </g>
    ))}
  </Picture>,

  // The parent's dashboard: progress rising, with a score for each subject.
  <Picture key="dashboard">
    <rect x="24" y="12" width="192" height="116" rx="10" className="fill-white stroke-login-border" />
    {[
      [40, 34, "fill-explorer"],
      [64, 50, "fill-starter"],
      [88, 42, "fill-challenger"],
      [112, 66, "fill-login-teal"],
    ].map(([x, height, fill]) => (
      <rect key={x} x={x} y={112 - Number(height)} width="16" height={height} rx="3" className={String(fill)} />
    ))}
    <path d="M38 112h94" className="stroke-login-border" strokeWidth="2" />
    <path d="m38 52 26-10 24 6 34-22" fill="none" className="stroke-login-gold" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {[32, 58, 84].map((y, i) => (
      <g key={y}>
        <rect x="146" y={y} width="58" height="6" rx="3" className="fill-login-border" />
        <rect x="146" y={y} width={[50, 38, 44][i]} height="6" rx="3" className="fill-login-teal" />
        <rect x="146" y={y + 11} width="30" height="4" rx="2" className="fill-login-border" />
      </g>
    ))}
  </Picture>,
];

/** The four steps of using SIGQS, from a parent signing up to the parent dashboard. */
export function LoginJourney() {
  return (
    <section>
      <h1 className="font-sans text-[27px] font-semibold text-login-navy">Login Journey</h1>
      <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-login-border p-4">
              {PICTURES[index]}
              <div className="mt-4 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-login-cta text-white grid place-items-center text-sm font-semibold shrink-0">
                  {index + 1}
                </span>
                <h4 className="font-sans text-base font-semibold text-login-navy">{step.title}</h4>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-login-body">{step.text}</p>
            </li>
          ))}
        </ol>
    </section>
  );
}

/** The five levels a pupil climbs, Starter to Master. */
export function ChildrensJourney() {
  return (
    <section>
      <h1 className="font-sans text-[27px] font-semibold text-login-navy">Children&apos;s Learning Journey</h1>
      {/* Full width, but short so the stage panels fit on one screen: the
          picture is squashed to 80% height, and its own caption line (the
          bottom 126px of 941) falls outside the frame. */}
      <div className="mt-4 w-full aspect-[1672/652] overflow-hidden rounded-2xl border border-login-border">
        <Image
          src="/learning-journey.png"
          alt={LEVELS.map((l) => `${l.level}: ${l.tag}.`).join(" ")}
          width={1672}
          height={900}
          sizes="(min-width: 1200px) 1136px, 100vw"
          className="w-full h-[115.5%] max-w-none object-fill"
        />
      </div>

      {/* One vertical panel per stage, in ladder order. */}
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGE_DETAILS.map((stage) => (
          <li
            key={stage.level}
            className={`flex flex-col rounded-2xl border border-login-border border-t-4 ${stage.border} p-4`}
          >
            <div className={`w-10 h-10 rounded-xl grid place-items-center ${stage.tint}`}>
              <LevelIcon level={stage.level} className="w-5 h-5" />
            </div>
            <h2 className={`mt-3 font-sans text-lg font-semibold ${stage.text}`}>{stage.level}</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-login-body">
              {LEVEL_STAGES[stage.level.toLowerCase()]}
            </p>
            <p className="mt-1 text-sm font-medium text-login-navy">{stage.tag}</p>
            <p className="mt-3 text-sm leading-relaxed text-login-body">{stage.summary}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-login-body">
              {stage.focus.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className={`mt-[0.45rem] w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** What each stage covers. Class names are written out in full so Tailwind sees them. */
const STAGE_DETAILS = [
  {
    level: "Starter",
    tag: "Build the basics",
    border: "border-t-starter",
    tint: "bg-starter-tint text-starter",
    text: "text-starter",
    dot: "bg-starter",
    summary:
      "A gentle first step. Short rounds of simple questions build confidence and a regular practice habit.",
    focus: ["Number facts and times tables", "Short, simple reading passages", "First word and shape patterns"],
  },
  {
    level: "Explorer",
    tag: "Discover more",
    border: "border-t-explorer",
    tint: "bg-explorer-tint text-explorer",
    text: "text-explorer",
    dot: "bg-explorer",
    summary:
      "More topics open up and questions start to need two steps, so children learn to read carefully before answering.",
    focus: ["Two-step word problems", "Longer passages and vocabulary", "Introducing codes and sequences"],
  },
  {
    level: "Navigator",
    tag: "Find your way",
    border: "border-t-navigator",
    tint: "bg-navigator-tint text-navigator",
    text: "text-navigator",
    dot: "bg-navigator",
    summary:
      "Children connect ideas across topics and start choosing their own method, with mixed practice to keep everything fresh.",
    focus: ["Fractions, decimals and percentages", "Inference in comprehension", "Mixed practice across topics"],
  },
  {
    level: "Challenger",
    tag: "Take on challenges",
    border: "border-t-challenger",
    tint: "bg-challenger-tint text-challenger",
    text: "text-challenger",
    dot: "bg-challenger",
    summary:
      "Exam-style questions at full difficulty. The focus moves to accuracy, problem solving and learning from mistakes.",
    focus: ["Multi-step problem solving", "Harder vocabulary and reasoning", "Reviewing wrong answers"],
  },
  {
    level: "Master",
    tag: "Lead with excellence",
    border: "border-t-master",
    tint: "bg-master-tint text-master",
    text: "text-master",
    dot: "bg-master",
    summary:
      "Exam ready. Children work at full 11+ standard, stretch themselves with the hardest questions and polish weak spots.",
    focus: ["Full exam-standard questions", "Stretch questions for top marks", "Targeting remaining weak areas"],
  },
];
