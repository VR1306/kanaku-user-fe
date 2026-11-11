"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { useFormField } from "./use-form-field";

type FormCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id" | "type"> & {
  name: string;
  children: ReactNode;
};

/** Single boolean checkbox bound to the surrounding form. */
export function FormCheckbox({ name, children, ...rest }: FormCheckboxProps) {
  const { id, error, register, aria } = useFormField(name);
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-3 text-sm text-ink-2">
        <input
          id={id}
          type="checkbox"
          className="size-[18px] rounded-[4px] accent-brand"
          {...aria}
          {...rest}
          {...register(name)}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <motion.p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-[13px] text-danger"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      ) : null}
    </div>
  );
}
