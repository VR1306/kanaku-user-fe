import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** AES-256-GCM for secrets stored in the database (e.g. authenticator secrets). */
function key(): Buffer {
  const secret = process.env.DATA_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return createHash("sha256").update(secret).digest();
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATA_ENCRYPTION_KEY or SESSION_SECRET (min 32 chars) must be set.");
  }
  return createHash("sha256").update("dev-only-insecure-secret-do-not-use-in-prod").digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(token: string): string {
  const [iv, tag, body] = token.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

/** One-way hash for short-lived e-mail codes, so they aren't readable in the database. */
export const hashCode = (value: string) =>
  createHash("sha256")
    .update(`${key().toString("hex")}:${value}`)
    .digest("hex");
