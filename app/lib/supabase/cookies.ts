/** Minimal, dependency-free cookie parse/serialize for SSR auth handling. */

export function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    if (!name) continue;
    let value = pair.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep raw value */
    }
    out[name] = value;
  }
  return out;
}

type CookieOptions = {
  domain?: string;
  expires?: Date | string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

export function serializeCookie(
  name: string,
  value: string,
  opts: CookieOptions = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.expires) {
    parts.push(
      `Expires=${
        typeof opts.expires === "string" ? opts.expires : opts.expires.toUTCString()
      }`,
    );
  }
  if (opts.maxAge !== undefined && opts.maxAge !== null) {
    parts.push(`Max-Age=${opts.maxAge}`);
  }
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push("Secure");
  if (opts.httpOnly) parts.push("HttpOnly");
  return parts.join("; ");
}
