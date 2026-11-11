"use client";

import { FOCUS_FIELD } from "@/constants/styles";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { Field } from "../field";
import { useFormField } from "./use-form-field";

type FormTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id"> & {
  name: string;
  label: string;
  hint?: string;
};

export function FormTextarea({
  name,
  label,
  hint,
  className,
  rows = 4,
  ...rest
}: FormTextareaProps) {
  const { id, error, register, aria } = useFormField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        {...aria}
        {...rest}
        {...register(name)}
        className={cn(
          "w-full resize-y rounded-control border bg-surface px-4 py-3 text-[15px] text-ink",
          "placeholder:text-subtle transition-colors",
          FOCUS_FIELD,
          error ? "border-danger" : "border-line-strong",
          className,
        )}
      />
    </Field>
  );
}
