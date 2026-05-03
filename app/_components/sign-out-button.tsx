/**
 * Sign-out button. Plain HTML form posting to /api/auth/logout — no client
 * JS, works even with JS disabled. The route handler returns a 303 to /login
 * and clears the session cookie in the same response.
 *
 * Designed to slot into a page's secondary nav row with `ml-auto` pushing it
 * to the right. The visual style matches NavTabClient (caps-action, muted)
 * so it reads as a peer of the navigation tabs, not a stray UI element.
 */
export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action="/api/auth/logout" method="POST" className={className}>
      <button
        type="submit"
        className="caps-action text-muted-foreground/70 hover:text-foreground transition-colors py-3"
      >
        Sign out
      </button>
    </form>
  );
}
