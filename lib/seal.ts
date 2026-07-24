import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Stateless sealed tokens: search results are AES-256-GCM encrypted and handed
 * to the client, which returns them at unlock. Works across serverless lambda
 * instances where in-memory state does not.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function key(): Buffer {
  // Derived from existing secrets so no extra env var is needed.
  const secret =
    (process.env.GHL_PRIVATE_TOKEN ?? "") +
    (process.env.GOOGLE_PLACES_API_KEY ?? "") +
    "local-client-finder-v1";
  return createHash("sha256").update(secret).digest();
}

export function seal(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const plaintext = JSON.stringify({ p: payload, exp: Date.now() + TOKEN_TTL_MS });
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

export function open<T>(token: string): T | null {
  try {
    const raw = Buffer.from(token, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
    const { p, exp } = JSON.parse(plaintext) as { p: T; exp: number };
    if (typeof exp !== "number" || exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
