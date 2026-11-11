/** Email-safe colours (inline styles only), taken from the Kanaku palette. */
export const COLORS = {
  navy: "#0B1220",
  brand: "#1D4ED8",
  onNavy: "#F6F8FB",
  accent: "#22D3EE",
  accentDark: "#0E7490",
  page: "#F6F8FB",
  surface: "#FFFFFF",
  line: "#E2E8F0",
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  subtle: "#94A3B8",
  codeBg: "#ECFEFF",
  codeLine: "#A5F3FC",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const firstName = (name?: string) => name?.trim().split(/\s+/)[0] || "there";
