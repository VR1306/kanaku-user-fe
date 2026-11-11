"use client";

import { useState } from "react";
import { FormProvider, useController } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLOURS } from "@/constants/categories";
import { TRANSACTION_TYPES, type TransactionType } from "@/constants/transactions";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/utils/cn";
import { createCategory, updateCategory } from "../api";
import {
  categoryFormSchema,
  toCategoryInput,
  type CategoryFormValues,
  type CategoryItem,
} from "../schemas";

type Props = {
  /** The category being edited, or null to create one. */
  editing: CategoryItem | null;
  /** Type to create new categories as (follows the tab on the page). */
  defaultType: TransactionType;
  onDone: () => void;
  onCancel: () => void;
};

const label = "mb-2 block text-sm font-semibold text-accent-pale";
const field =
  "h-[52px] w-full rounded-control border border-brand-light bg-navy-800 px-4 text-[15px] text-on-inverse placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

/** The blue "New category" / "Edit category" panel. Remount (key) it to reset. */
export function CategoryForm({ editing, defaultType, onDone, onCancel }: Props) {
  const form = useZodForm(categoryFormSchema, {
    name: editing?.name ?? "",
    type: editing?.type ?? defaultType,
    tone: editing?.tone ?? "accent",
    budget: editing?.budget ? String(editing.budget) : "",
  });
  const { register, handleSubmit, control, watch, formState } = form;
  const { field: tone } = useController({ control, name: "tone" });
  const type = watch("type");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function save(values: CategoryFormValues) {
    setPending(true);
    setMessage(undefined);
    try {
      const input = toCategoryInput(values);
      if (editing) await updateCategory(editing.id, input);
      else await createCategory(input);
      onDone();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't save this category. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const { errors } = formState;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(save)}
        noValidate
        className="rounded-[26px] bg-brand p-7 text-on-inverse"
      >
        <h2 className="font-display text-2xl font-bold">
          {editing ? "Edit category" : "New category"}
        </h2>

        <div className="mt-6">
          <label htmlFor="category-name" className={label}>
            Name
          </label>
          <input
            id="category-name"
            {...register("name")}
            placeholder="e.g. Education"
            autoComplete="off"
            disabled={editing?.fallback}
            aria-invalid={errors.name ? true : undefined}
            className={field}
          />
          {errors.name ? (
            <p role="alert" className="mt-2 text-sm text-accent-pale">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <label htmlFor="category-type" className={label}>
            Type
          </label>
          <select
            id="category-type"
            {...register("type")}
            disabled={Boolean(editing)}
            className={cn(field, "appearance-none")}
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="text-ink">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="mt-5">
          <legend className={label}>Colour</legend>
          <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2.5">
            {CATEGORY_COLOURS.map((c) => {
              const selected = tone.value === c.tone;
              return (
                <button
                  key={c.tone}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={c.label}
                  onClick={() => tone.onChange(c.tone)}
                  style={{ backgroundColor: c.swatch }}
                  className={cn(
                    "size-10 rounded-full border-2 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    selected
                      ? "scale-110 border-on-inverse ring-2 ring-on-inverse/40"
                      : "border-brand-light",
                  )}
                />
              );
            })}
          </div>
        </fieldset>

        {type === "expense" ? (
          <div className="mt-5">
            <label htmlFor="category-budget" className={label}>
              Monthly budget <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="category-budget"
              {...register("budget")}
              inputMode="decimal"
              autoComplete="off"
              placeholder="₹0"
              aria-invalid={errors.budget ? true : undefined}
              className={field}
            />
            {errors.budget ? (
              <p role="alert" className="mt-2 text-sm text-accent-pale">
                {errors.budget.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p
            role="alert"
            className="mt-5 rounded-control bg-navy-800 px-4 py-3 text-sm text-accent-pale"
          >
            {message}
          </p>
        ) : null}

        <div className={cn("mt-6 grid gap-3", editing && "grid-cols-2")}>
          {editing ? (
            <Button variant="outline" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="accent" size="lg" loading={pending} fullWidth>
            {editing ? "Save" : "Create category"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
