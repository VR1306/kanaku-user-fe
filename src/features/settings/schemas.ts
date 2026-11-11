import { z } from "zod";
import { AVATAR_MAX_CHARS, DATE_FORMATS } from "@/constants/settings";
import { AMOUNT_MAX } from "@/constants/transactions";
import { PASSWORD_RULES } from "@/features/auth/validation";

const dateFormat = z.enum(DATE_FORMATS.map((f) => f.value) as ["medium", "dmy", "mdy", "ymd"]);

export const settingsSchema = z.object({
  profile: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    monthlyIncome: z.number().nullable(),
    /** A small JPEG as a data URL, or null for the initials avatar. */
    avatar: z.string().nullable(),
  }),
  preferences: z.object({
    currency: z.literal("INR"),
    dateFormat,
    emailBudgetAlerts: z.boolean(),
    emailBillReminders: z.boolean(),
    emailMonthlyReport: z.boolean(),
  }),
  security: z.object({
    mfaEnabled: z.boolean(),
    sessions: z.array(
      z.object({
        id: z.string(),
        device: z.string(),
        signedInAt: z.string(),
        lastSeenAt: z.string(),
        current: z.boolean(),
      }),
    ),
  }),
});
export type SettingsData = z.infer<typeof settingsSchema>;
export type SettingsSessionInfo = SettingsData["security"]["sessions"][number];

const name = z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long.");
const phone = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\+?[0-9][0-9 ()-]{6,18}$/.test(v), "Enter a valid phone number.");

export const profileInputSchema = z.object({
  name,
  phone,
  monthlyIncome: z
    .number()
    .positive("Enter an amount greater than zero.")
    .max(AMOUNT_MAX)
    .nullable(),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

/** The form keeps the income as text and the phone as a dial code plus a number. */
export const profileFormSchema = z.object({
  name,
  countryCode: z.string().min(1),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9][0-9 -]{5,13}$/.test(v), "Enter a valid phone number."),
  monthlyIncome: z
    .string()
    .trim()
    .refine((s) => s === "" || /^\d[\d,]*(\.\d{0,2})?$/.test(s), "Use digits only, e.g. 85000.")
    .refine(
      (s) => s === "" || Number(s.replace(/,/g, "")) > 0,
      "Enter an amount greater than zero.",
    )
    .refine(
      (s) => s === "" || Number(s.replace(/,/g, "")) <= AMOUNT_MAX,
      "That amount is too large.",
    ),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export const toProfileInput = (v: ProfileFormValues): ProfileInput => ({
  name: v.name,
  phone: v.phoneNumber.trim() === "" ? "" : `${v.countryCode} ${v.phoneNumber.trim()}`,
  monthlyIncome: v.monthlyIncome === "" ? null : Number(v.monthlyIncome.replace(/,/g, "")),
});

export const preferencesInputSchema = z.object({
  dateFormat,
  emailBudgetAlerts: z.boolean(),
  emailBillReminders: z.boolean(),
  emailMonthlyReport: z.boolean(),
});
export type PreferencesInput = z.infer<typeof preferencesInputSchema>;

export const avatarInputSchema = z.object({
  dataUrl: z
    .string()
    .max(AVATAR_MAX_CHARS, "That photo is too large.")
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "Upload a JPEG or PNG photo."),
});

const newPassword = z.string().superRefine((value, ctx) => {
  const missing = PASSWORD_RULES.find((rule) => !rule.test(value));
  if (missing) {
    ctx.addIssue({ code: "custom", message: `Password needs: ${missing.label.toLowerCase()}.` });
  }
});

export const passwordInputSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword,
});
export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Choose a password different from the current one.",
    path: ["newPassword"],
  });
export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password."),
});

export const importResultSchema = z.object({
  imported: z.number().int().min(0),
  skipped: z.number().int().min(0),
  /** First few problems, e.g. "Row 7: Amount isn't a number." */
  problems: z.array(z.string()),
});
export type ImportResult = z.infer<typeof importResultSchema>;
