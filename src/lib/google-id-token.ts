import jwt from "jsonwebtoken";

/**
 * Checks a "Sign in with Google" ID token and returns the verified email.
 *
 * The token is a JWT signed by Google. It is verified here against Google's
 * published public keys, our client ID (audience) and Google's issuer, so no
 * client secret is involved. The keys are cached for as long as Google's
 * Cache-Control header allows.
 */

const CERTS_URL = "https://www.googleapis.com/oauth2/v1/certs";
const ISSUERS: [string, string] = ["accounts.google.com", "https://accounts.google.com"];

let certCache: { keys: Record<string, string>; expires: number } | null = null;

async function googleCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expires > Date.now()) return certCache.keys;

  const res = await fetch(CERTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google certs fetch failed: ${res.status}`);
  const keys = (await res.json()) as Record<string, string>;

  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  certCache = { keys, expires: Date.now() + maxAge * 1000 };
  return keys;
}

export function googleClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
}

/** The token's email, lower-case, or null when the token is not valid. */
export async function verifiedGoogleEmail(credential: unknown): Promise<string | null> {
  const clientId = googleClientId();
  if (!clientId || typeof credential !== "string" || credential.length > 4096) return null;

  const kid = jwt.decode(credential, { complete: true })?.header.kid;
  if (!kid) return null;

  let key = (await googleCerts())[kid];
  if (!key) {
    // Google rotates keys; a new kid means our cache is stale.
    certCache = null;
    key = (await googleCerts())[kid];
  }
  if (!key) return null;

  try {
    const claims = jwt.verify(credential, key, {
      algorithms: ["RS256"],
      audience: clientId,
      issuer: ISSUERS,
    }) as { email?: string; email_verified?: boolean | string };

    // Only an address Google has confirmed belongs to this person.
    const verified = claims.email_verified === true || claims.email_verified === "true";
    return verified && claims.email ? claims.email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}
