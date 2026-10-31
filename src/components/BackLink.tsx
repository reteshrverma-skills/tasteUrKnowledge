"use client";

import { useRouter } from "next/navigation";

/**
 * "← Back" to whichever page opened this one. With no page to go back to
 * (opened in a new tab, or from a bookmark) it goes to `fallbackHref`; the
 * login page sends a signed-in user on to their own home.
 */
export function BackLink({ fallbackHref = "/login" }: { fallbackHref?: string }) {
  const router = useRouter();

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={back}
      className="text-sm font-medium text-ink-soft hover:text-brand transition"
    >
      ← Back
    </button>
  );
}
