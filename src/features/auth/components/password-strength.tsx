"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { passwordStrength } from "../validation";

const LEVELS = [
  { label: "", bar: "" },
  { label: "Weak password", bar: "bg-danger", text: "text-danger" },
  { label: "Fair password", bar: "bg-accent-deep", text: "text-accent-deep" },
  { label: "Good password", bar: "bg-brand", text: "text-link" },
  { label: "Strong password", bar: "bg-success", text: "text-success" },
] as const;

export function PasswordStrength({ password }: { password: string }) {
  const score = passwordStrength(password);
  const level = LEVELS[score];
  return (
    <div aria-live="polite">
      <div className="flex gap-2" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <motion.span
              className={cn("block h-full origin-left rounded-full", level.bar)}
              initial={false}
              animate={{ scaleX: i <= score ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </span>
        ))}
      </div>
      <p className={cn("mt-2 h-4 text-[13px] font-semibold", "text" in level && level.text)}>
        {level.label}
      </p>
    </div>
  );
}
