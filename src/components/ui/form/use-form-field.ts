"use client";

import { useId } from "react";
import { get, useFormContext } from "react-hook-form";

/** Shared plumbing for every Form* control: id, error text and a11y attributes. */
export function useFormField(name: string) {
  const { register, formState, control } = useFormContext();
  const uid = useId();
  const id = `${uid}-${name}`;
  const error = (get(formState.errors, name) as { message?: string } | undefined)?.message;
  return {
    id,
    error,
    register,
    control,
    aria: {
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
    },
  };
}
