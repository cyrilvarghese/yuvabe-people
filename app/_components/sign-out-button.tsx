/**
 * Sign-out button rendered in the layout for authenticated routes.
 *
 * Plain HTML form posting to /api/auth/logout — no client JS, works even
 * with JS disabled. The route handler returns a 303 to /login and clears
 * the session cookie in the same response.
 *
 * Position: fixed top-right, low-key mono-caps styling so it never competes
 * with the page's primary content. z-50 to sit above page headers (z-10).
 */
export function SignOutButton() {
  return (
    <form
      action="/api/auth/logout"
      method="POST"
      className="fixed top-4 right-4 md:top-5 md:right-6 z-50"
    >
      <button
        type="submit"
        className="caps-action text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
