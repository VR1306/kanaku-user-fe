"use client";

import { useId } from "react";
import { get, useFormContext } from "react-hook-form";

export type RadioOption = { value: string; label: string; description?: string };

type FormRadioGroupProps = {
  name: string;
  legend: string;
  options: RadioOption[];
  orientation?: "vertical" | "horizontal";
};

/** Group of radio buttons sharing one form value. */
export function FormRadioGroup({
  name,
  legend,
  options,
  orientation = "vertical",
}: FormRadioGroupProps) {
  const { register, formState } = useFormContext();
  const uid = useId();
  const error = (get(formState.errors, name) as { message?: string } | undefined)?.message;

  return (
    <fieldset aria-describedby={error ? `${uid}-error` : undefined}>
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div
        className={orientation === "horizontal" ? "flex flex-wrap gap-5" : "flex flex-col gap-3"}
      >
        {options.map((o) => (
          <label key={o.value} className="flex items-start gap-3 text-sm text-ink-2">
            <input
              type="radio"
              value={o.value}
              className="mt-0.5 size-[18px] accent-brand"
              {...register(name)}
            />
            <span>
              <span className="font-medium text-ink">{o.label}</span>
              {o.description ? <span className="block text-muted">{o.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${uid}-error`} role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
