"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import { CodeInput } from "./code-input";

/** CodeInput bound to the surrounding form (value is the joined digit string). */
export function FormCodeInput({ name = "code" }: { name?: string }) {
  const { control, formState } = useFormContext();
  const error = (get(formState.errors, name) as { message?: string } | undefined)?.message;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <CodeInput
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={error}
        />
      )}
    />
  );
}
