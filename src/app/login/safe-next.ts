/**
 * Validate the post-login `?next=` target (IP-46 / D-164; FIX-SEC N-03, D-247).
 * Only same-origin relative paths are accepted; anything else returns the
 * fallback, which prevents open redirects.
 *
 * The value returned is the NORMALISED form (`pathname + search + hash` of the
 * parsed URL), never the raw input, and it is rejected when normalisation
 * could turn it into a protocol-relative (`//host`) or backslash target:
 * - dot segments in the path (`/./`, `/../`, trailing `/.` or `/..`), so
 *   `/.//evil.com` and `/..//evil.com` cannot collapse into `//evil.com`;
 * - percent-encoded separators/dots/escapes in the path (`%2f`, `%5c`, `%2e`,
 *   `%25` double-encoding), decoded by some routers before matching;
 * - percent-encoded control characters anywhere (`%09`, `%0a`, `%0d`, `%00`,
 *   `%7f`), which browsers strip and can merge segments.
 */
export const LOGIN_DEFAULT_DEST = "/";

const MAX_NEXT_CHARS = 2048;
const PARSE_BASE = "http://safe-next.invalid";
/** Encoded C0 control chars and DEL (`%00`-`%1f`, `%7f`), any position. */
const ENCODED_CONTROL_RE = /%(?:[01][0-9a-f]|7f)/i;
/** Encoded `/`, `\`, `.` and `%` (double encoding) inside the path part. */
const ENCODED_PATH_META_RE = /%(?:2f|5c|2e|25)/i;
/** A `.` or `..` path segment. */
const DOT_SEGMENT_RE = /(?:^|\/)\.{1,2}(?:\/|$)/;

function isUnsafePathname(p: string): boolean {
  return p.length === 0 || p[0] !== "/" || p[1] === "/" || p.includes("\\");
}

export function safeNext(raw: string | null | undefined, fallback: string = LOGIN_DEFAULT_DEST): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_NEXT_CHARS) return fallback;
  // Must be an absolute-path reference: "/x" but not "//host" or "/\host".
  if (isUnsafePathname(raw)) return fallback;
  // No backslashes or control/whitespace chars anywhere (browsers normalise them).
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (c <= 0x20 || c === 0x7f || c === 0x5c) return fallback;
  }
  if (ENCODED_CONTROL_RE.test(raw)) return fallback;
  const cut = raw.search(/[?#]/);
  const rawPath = cut >= 0 ? raw.slice(0, cut) : raw;
  if (ENCODED_PATH_META_RE.test(rawPath) || DOT_SEGMENT_RE.test(rawPath)) return fallback;
  let out: string;
  try {
    const u = new URL(raw, PARSE_BASE);
    if (u.origin !== PARSE_BASE) return fallback;
    if (isUnsafePathname(u.pathname)) return fallback;
    // Avoid bouncing straight back to the login page.
    if (u.pathname === "/login" || u.pathname === "/login/") return fallback;
    out = u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
  // Defence in depth: the normalised value must still be a plain relative path.
  if (isUnsafePathname(out) || out.length > MAX_NEXT_CHARS) return fallback;
  return out;
}
