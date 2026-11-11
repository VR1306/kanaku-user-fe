"use client";

import type { FormHTMLAttributes } from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

type FormProps<T extends FieldValues> = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
};

/** Provides the form to every `Form*` control below it and wires up validation + submit. */
export function Form<T extends FieldValues>({ form, onSubmit, children, ...rest }: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} {...rest}>
        {children}
      </form>
    </FormProvider>
  );
}
