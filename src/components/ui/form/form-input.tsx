"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { Field, Input } from "../field";
import { PasswordInput } from "../password-input";
import { useFormField } from "./use-form-field";

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id"> & {
  name: string;
  label: string;
  hint?: string;
  labelAction?: ReactNode;
};

/** Text-like input (text, email, number, …) bound to the surrounding form. */
export function FormInput({ name, label, hint, labelAction, ...rest }: FormInputProps) {
  const { id, error, register, aria } = useFormField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint} labelAction={labelAction}>
      <Input id={id} invalid={!!error} {...aria} {...rest} {...register(name)} />
    </Field>
  );
}

/** Password input with a show/hide toggle, bound to the surrounding form. */
export function FormPasswordInput({ name, label, hint, labelAction, ...rest }: FormInputProps) {
  const { id, error, register, aria } = useFormField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint} labelAction={labelAction}>
      <PasswordInput id={id} invalid={!!error} {...aria} {...rest} {...register(name)} />
    </Field>
  );
}
