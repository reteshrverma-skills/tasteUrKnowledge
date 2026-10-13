/**
 * Asks before a round is handed in, with the browser's own OK / Cancel box.
 * Unanswered questions are called out, since that is usually why a child
 * would want to go back.
 */
export function confirmSubmit(answered: number, total: number): boolean {
  const unanswered = total - answered;
  const message =
    unanswered > 0
      ? `You have not answered ${unanswered} of ${total} question${
          total === 1 ? "" : "s"
        }.\n\nSubmit your answers anyway?`
      : "Are you sure you want to submit your answers?";
  return window.confirm(message);
}
