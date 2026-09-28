import { Suspense } from "react";
import { NvrQuiz } from "./NvrQuiz";

/** useSearchParams needs a Suspense boundary above it. */
export default function NvrQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ground grid place-items-center">
          <p className="text-ink-soft text-sm">Loading…</p>
        </div>
      }
    >
      <NvrQuiz />
    </Suspense>
  );
}
