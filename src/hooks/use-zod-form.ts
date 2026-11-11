"use client";

import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";

/** useForm preconfigured with a zod schema (validates on submit, re-validates on change). */
export function useZodForm<T extends FieldValues>(
  schema: ZodType<T, T>,
  defaultValues: DefaultValues<T>,
): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
}
