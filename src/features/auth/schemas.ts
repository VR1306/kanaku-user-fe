import { CODE_LENGTH } from "@/constants/auth";
import { z } from "zod";
import { PASSWORD_RULES } from "./validation";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .pipe(z.email("Enter a valid email address."));

const newPassword = z
  .string()
  .min(1, "Create a password.")
  .superRefine((value, ctx) => {
    const missing = PASSWORD_RULES.find((rule) => !rule.test(value));
    if (missing) {
      ctx.addIssue({ code: "custom", message: `Password needs: ${missing.label.toLowerCase()}.` });
    }
  });

const code = z
  .string()
  .regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), `Enter the ${CODE_LENGTH}-digit code.`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long."),
  email,
  password: newPassword,
  terms: z.boolean().refine((v) => v, "Please accept the Terms and Privacy Policy."),
});

export const verifyEmailSchema = z.object({ code });

export const mfaCodeSchema = z.object({ code });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ code, password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
