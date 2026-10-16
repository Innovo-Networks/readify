/**
 * Where to send someone after they sign in or register.
 * Only same-site paths are accepted so a crafted link cannot bounce users elsewhere.
 */
export const DEFAULT_AUTH_REDIRECT = '/account'

/** True for a same-site path: exactly one leading slash, so '//host' and '/\host' are rejected. */
function isSameSitePath(value: string): boolean {
  if (value.charAt(0) !== '/') return false
  const second = value.charAt(1)
  return second !== '/' && second !== String.fromCharCode(92)
}

export function safeRedirect(raw: string | null | undefined, fallback = DEFAULT_AUTH_REDIRECT): string {
  return raw && isSameSitePath(raw) ? raw : fallback
}

/** Appends ?redirect=… to an auth route so the destination survives login ↔ register ↔ email confirmation. */
export function withRedirect(path: string, redirect: string, fallback = DEFAULT_AUTH_REDIRECT): string {
  return redirect === fallback ? path : `${path}?redirect=${encodeURIComponent(redirect)}`
}
