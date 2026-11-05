import Image from "next/image";
import { STEPS } from "@/app/parent/HowItWorks";

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
      <Image
        src="/learning-journey.png"
        alt={LEVELS.map((l) => `${l.level}: ${l.tag}.`).join(" ")}
        width={1672}
        height={941}
        sizes="(min-width: 1200px) 1136px, 100vw"
        className="mt-6 w-full h-auto rounded-2xl border border-login-border"
      />
    </section>
  );
}
