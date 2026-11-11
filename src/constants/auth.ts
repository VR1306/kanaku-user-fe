// Session / flow cookies
export const SESSION_COOKIE_NAME = "kanaku_session";
export const FLOW_COOKIE_NAME = "kanaku_flow";
export const SESSION_DEFAULT_TTL_SEC = 60 * 60 * 24;
export const SESSION_REMEMBER_TTL_SEC = 60 * 60 * 24 * 30;
export const FLOW_TTL_SEC = 60 * 60;

// Verification / reset codes
export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 15 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

// Password policy
export const PASSWORD_MIN_LENGTH = 8;

// Brand panel copy (edit here, no component changes needed)
export const AUTH_TAGLINES = [
  "Every rupee has a job. Give it one.",
  "Know where it goes. Decide where it grows.",
  "Small habits. Big savings.",
  "Budget today. Breathe easier tomorrow.",
  "Your money, finally making sense.",
];
export const TAGLINE_INTERVAL_MS = 3600;

// Multi-factor authentication (Google Authenticator / any TOTP app)
export const MFA_ISSUER = "Kanaku";
export const TOTP_DIGITS = CODE_LENGTH;
export const TOTP_PERIOD_SEC = 30;
/** Accepted clock drift, in 30-second steps either side of "now". */
export const TOTP_WINDOW = 1;
export const MFA_MAX_ATTEMPTS = 5;
export const MFA_LOCK_MS = 10 * 60 * 1000;
export const MFA_FLOW_MS = 10 * 60 * 1000;
