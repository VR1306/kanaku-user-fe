"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/types/forms";

/**
 * Connects a react-hook-form instance to a server action.
 * Field errors returned by the server are mapped onto the form; `message` is a form-level error.
 * (Server actions that succeed usually `redirect()`, which navigates away.)
 */
export function useActionSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  action: (values: T) => Promise<ActionResult>,
) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();

  const onSubmit = (values: T) => {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action(values);
      if (!result) return;
      for (const [name, error] of Object.entries(result.errors ?? {})) {
        form.setError(name as Path<T>, { type: "server", message: error });
      }
      if (result.message) setMessage(result.message);
    });
  };

  return { onSubmit, pending, message };
}
