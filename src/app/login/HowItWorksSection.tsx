import { STEPS } from "@/app/parent/HowItWorks";
import { LevelLabel } from "@/app/dashboard/subject/LevelIcon";
import { difficultyStyle } from "@/lib/level-style";

const LEVELS = [
  {
    level: "Starter",
    tag: "Building foundations",
    text: "Develop essential concepts and build confidence through structured practice.",
  },
  {
    level: "Explorer",
    tag: "Developing skills",
    text: "Strengthen core concepts, improve accuracy and explore different question types.",
  },
  {
    level: "Navigator",
    tag: "Applying knowledge",
    text: "Apply concepts to challenging questions, develop reasoning and improve problem-solving skills.",
  },
  {
    level: "Challenger",
    tag: "Advanced preparation",
    text: "Tackle complex questions, improve speed and accuracy, and build exam-ready confidence.",
  },
  {
    level: "Master",
    tag: "Ready for the challenge",
    text: "Demonstrate strong subject knowledge, consistent performance and confidence in tackling grammar school entrance exam-style questions.",
  },
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
        <rect x="126" y={y} width="92" height="40" rx="8" className="fill-white stroke-login-border" />
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

/** The SIGQS Pathway, below the login form: the four steps of using SIGQS, then the five levels a pupil climbs. */
export function HowItWorksSection() {
  return (
    <section id="sigqs-pathway" className="border-t border-login-border bg-white">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10 lg:py-12">
        <h2 className="font-sans text-center text-[27px] font-semibold text-login-navy">SIGQS Pathway</h2>

        <h3 className="mt-7 font-sans text-xl font-semibold text-login-navy">Login Journey</h3>
        <ol className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <h3 className="mt-10 font-sans text-xl font-semibold text-login-navy">Pupil&apos;s Learning Journey</h3>
        <ol className="mt-4 rounded-2xl border border-login-border divide-y divide-login-border">
          {LEVELS.map((level, index) => (
            <li key={level.level} className="p-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-login-navy">{index + 1}.</span>
                <h4 className={`chip chip-lg border font-sans ${difficultyStyle(level.level)}`}>
                  <LevelLabel level={level.level} />
                </h4>
                <span className={`chip border ${difficultyStyle(level.level)}`}>{level.tag}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-login-body">{level.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
