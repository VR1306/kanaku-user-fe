import type { Tone } from "./schemas";

/** Tone -> theme classes / CSS colours. Written out in full so Tailwind can see every class. */
export const TONE_TINT: Record<Tone, string> = {
  brand: "bg-brand-tint text-link",
  accent: "bg-accent-tint text-accent-deep",
  danger: "bg-danger-tint text-danger",
  success: "bg-success-tint text-success",
  violet: "bg-violet-tint text-violet",
  slate: "bg-line text-muted",
};

export const TONE_DOT: Record<Tone, string> = {
  brand: "bg-brand",
  accent: "bg-accent",
  danger: "bg-danger",
  success: "bg-success",
  violet: "bg-violet",
  slate: "bg-subtle",
};

/** For SVG strokes. */
export const TONE_COLOR: Record<Tone, string> = {
  brand: "var(--color-brand)",
  accent: "var(--color-accent)",
  danger: "var(--color-danger)",
  success: "var(--color-success)",
  violet: "var(--color-violet)",
  slate: "var(--color-subtle)",
};

export const TONE_BORDER: Record<Tone, string> = {
  brand: "border-brand",
  accent: "border-accent",
  danger: "border-danger",
  success: "border-success",
  violet: "border-violet",
  slate: "border-subtle",
};
