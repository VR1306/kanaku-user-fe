"use client";

import { FOCUS_FIELD } from "@/constants/styles";
import type { SelectHTMLAttributes } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/utils/cn";
import { Field } from "../field";
import { useFormField } from "./use-form-field";

export type SelectOption = { value: string; label: string };

type FormSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "id"> & {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
};

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  hint,
  className,
  ...rest
}: FormSelectProps) {
  const { id, error, register, aria } = useFormField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          id={id}
          {...aria}
          {...rest}
          {...register(name)}
          className={cn(
            "h-[52px] w-full appearance-none rounded-control border bg-surface pr-11 pl-[14px] text-[15px] text-ink",
            "transition-colors",
            FOCUS_FIELD,
            error ? "border-danger" : "border-line-strong",
            className,
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          size={16}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink"
        />
      </div>
    </Field>
  );
}
