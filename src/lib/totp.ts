/** RFC 6238 time-based one-time passwords (what Google Authenticator generates). */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { MFA_ISSUER, TOTP_DIGITS, TOTP_PERIOD_SEC, TOTP_WINDOW } from "@/constants/auth";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of input.replace(/=+$/, "").toUpperCase()) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
    value &= (1 << bits) - 1;
  }
  return Buffer.from(bytes);
}

/** 160-bit random secret, base32 encoded (the format authenticator apps expect). */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hash = createHmac("sha1", secret).update(message).digest();
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    (hash[offset + 1] << 16) |
    (hash[offset + 2] << 8) |
    hash[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / TOTP_PERIOD_SEC);

/**
 * Checks a code against the current step ± TOTP_WINDOW (clock drift).
 * Returns the matched step, or null. Steps at or before `afterStep` are rejected (replay protection).
 */
export function verifyTotp(
  secret: string,
  code: string,
  opts: { now?: number; afterStep?: number } = {},
): number | null {
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(code)) return null;
  const key = base32Decode(secret);
  const center = currentStep(opts.now);
  for (let step = center - TOTP_WINDOW; step <= center + TOTP_WINDOW; step++) {
    if (opts.afterStep !== undefined && step <= opts.afterStep) continue;
    const expected = Buffer.from(hotp(key, step));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

/** otpauth:// URI that authenticator apps read from a QR code. */
export function buildOtpauthUri(secret: string, account: string): string {
  const label = `${encodeURIComponent(MFA_ISSUER)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret,
    issuer: MFA_ISSUER,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SEC),
  });
  return `otpauth://totp/${label}?${params}`;
}
