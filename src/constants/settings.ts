export const SETTINGS_SECTIONS = [
  { value: "profile", label: "Profile" },
  { value: "preferences", label: "Preferences" },
  { value: "security", label: "Security" },
  { value: "billing", label: "Plan & billing" },
  { value: "data", label: "Data & privacy" },
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["value"];

export const DATE_FORMATS = [
  { value: "medium", label: "1 Nov 2026" },
  { value: "dmy", label: "DD/MM/YYYY" },
  { value: "mdy", label: "MM/DD/YYYY" },
  { value: "ymd", label: "YYYY-MM-DD" },
] as const;
export type DateFormat = (typeof DATE_FORMATS)[number]["value"];
export const DEFAULT_DATE_FORMAT: DateFormat = "medium";

export const THEME_CHOICES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match my device" },
] as const;

/** Profile photos are resized in the browser to this many pixels square before upload. */
export const AVATAR_SIZE = 256;
/** Largest data URL accepted for a profile photo (about 150 KB of image). */
export const AVATAR_MAX_CHARS = 200_000;

export const IMPORT_MAX_BYTES = 1_000_000;
export const IMPORT_MAX_ROWS = 2000;

/** Dial codes offered next to the phone number. India first. */
export const COUNTRY_CODES = [
  { code: "+91", name: "India" },
  { code: "+1", name: "United States / Canada" },
  { code: "+44", name: "United Kingdom" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+65", name: "Singapore" },
  { code: "+61", name: "Australia" },
  { code: "+64", name: "New Zealand" },
  { code: "+49", name: "Germany" },
  { code: "+33", name: "France" },
  { code: "+81", name: "Japan" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+974", name: "Qatar" },
  { code: "+965", name: "Kuwait" },
  { code: "+968", name: "Oman" },
  { code: "+973", name: "Bahrain" },
  { code: "+60", name: "Malaysia" },
  { code: "+94", name: "Sri Lanka" },
  { code: "+977", name: "Nepal" },
  { code: "+880", name: "Bangladesh" },
  { code: "+92", name: "Pakistan" },
  { code: "+27", name: "South Africa" },
] as const;
export const DEFAULT_COUNTRY_CODE = "+91";

/** Splits a stored phone ("+91 98765 43210") into its dial code and number. */
export function splitPhone(phone: string): { countryCode: string; phoneNumber: string } {
  const text = phone.trim();
  const match = COUNTRY_CODES.map((c) => c.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => text.startsWith(`${code} `) || text.startsWith(code));
  if (!match) return { countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: text.replace(/^\+/, "") };
  return { countryCode: match, phoneNumber: text.slice(match.length).trim() };
}
