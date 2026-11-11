/**
 * The two addresses the app cares about, set in the environment.
 *
 * - NEXT_PUBLIC_APP_URL: the website (frontend), e.g. https://app.example.com
 * - NEXT_PUBLIC_API_URL: the API (backend), e.g. https://api.example.com. Leave it empty when the
 *   API is served by the same deployment as the website (the default): requests then go to
 *   relative /api/... paths.
 *
 * They are NEXT_PUBLIC_ so the browser can read them; neither is a secret.
 */
const trim = (url: string | undefined) => (url ?? "").trim().replace(/\/+$/, "");

/** The frontend's address, or "" if not set. */
export const APP_URL = trim(process.env.NEXT_PUBLIC_APP_URL);

/** Prefix for every API request: the backend's address, or "" for the same site. */
export const API_BASE = trim(process.env.NEXT_PUBLIC_API_URL);

/** True when the browser has to call a different address than the page it is on. */
export const API_IS_SEPARATE = API_BASE !== "" && API_BASE !== APP_URL;
