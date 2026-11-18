export const STEPS = [
  {
    title: "Parent Registration",
    text: "Parents create an account on SIGQS and set up a separate profile for each child.",
  },
  {
    title: "Child Login",
    text: "Children log in using their individual profiles to access their learning and practice activities.",
  },
  {
    title: "Subject-Wise Tests",
    text: "Children take practice tests in subjects such as Maths, English, Verbal Reasoning and Non-Verbal Reasoning to prepare for Grammar School entrance exams.",
  },
  {
    title: "Parent Dashboard",
    text: "Parents can access their dashboard to monitor each child's performance, track progress, identify strengths and areas for improvement, and support their preparation.",
  },
];

/** The four steps as a narrow side panel, for the dashboard's right column. */
export function HowItWorksSteps() {
  return (
    <ol className="mt-3 space-y-3">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-brand-tint text-brand grid place-items-center font-display font-bold text-xs">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{step.title}</span>
            <span className="block text-xs text-ink-soft mt-0.5 leading-relaxed">{step.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * The four steps of using SIGQS, on the parent dashboard. Open by default
 * until the first child is added; after that it folds away so the children's
 * progress comes first, and stays one click from view.
 */
export function HowItWorks({ open }: { open: boolean }) {
  return (
    <details open={open} className="card mb-8 group">
      <summary className="cursor-pointer list-none px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">How SIGQS Works</h2>
        <span className="text-sm text-ink-soft group-open:hidden">Show</span>
        <span className="text-sm text-ink-soft hidden group-open:inline">Hide</span>
      </summary>

      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 px-5 sm:px-6 pb-6">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-line p-4">
            <span className="w-8 h-8 rounded-full bg-brand-tint text-brand grid place-items-center font-display font-bold text-sm">
              {index + 1}
            </span>
            <p className="font-display font-semibold text-ink mt-3">{step.title}</p>
            <p className="text-sm text-ink-soft mt-1 leading-relaxed">{step.text}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
