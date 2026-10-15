/**
 * The one logout control, for every signed-in page's top bar. A plain form
 * POST, so it works without JavaScript; the route answers with a redirect to
 * /login.
 */
export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className={
          className ??
          "text-sm font-medium text-ink-soft hover:text-poor transition"
        }
      >
        Log out
      </button>
    </form>
  );
}
