"use client";

import { useState } from "react";
import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useZodForm } from "@/hooks/use-zod-form";
import { setCategoryBudget } from "../api";
import { budgetFormSchema, toBudget, type BudgetFormValues, type CategoryItem } from "../schemas";

type Props = {
  /** The category whose budget is being set, or null for the hint panel. */
  editing: CategoryItem | null;
  onDone: () => void;
  onCancel: () => void;
};

const label = "mb-2 block text-sm font-semibold text-accent-pale";
const field =
  "h-[52px] w-full rounded-control border border-brand-light bg-navy-800 px-4 text-[15px] text-on-inverse placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

/**
 * Categories are created and maintained by the Kanaku team, so the only thing you can change here is
 * your own monthly budget for an expense category. Remount (key) it to reset.
 */
export function CategoryForm({ editing, onDone, onCancel }: Props) {
  const form = useZodForm(budgetFormSchema, {
    budget: editing?.budget ? String(editing.budget) : "",
  });
  const { register, handleSubmit, formState } = form;
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function save(values: BudgetFormValues) {
    if (!editing) return;
    setPending(true);
    setMessage(undefined);
    try {
      await setCategoryBudget(editing.id, toBudget(values));
      onDone();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't save your budget. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!editing || editing.type !== "expense") {
    return (
      <div className="rounded-[26px] bg-brand p-7 text-on-inverse">
        <h2 className="font-display text-2xl font-bold">Managed by Kanaku</h2>
        <p className="mt-3 text-[15px] text-accent-pale">
          Categories are kept up to date for you, so they always match your reports and exports.
          {editing
            ? " Income categories don't have a budget."
            : " Choose an expense category and tap the pencil to set your own monthly budget."}
        </p>
        {editing ? (
          <Button className="mt-6" variant="outline" onClick={onCancel}>
            Close
          </Button>
        ) : null}
      </div>
    );
  }

  const { errors } = formState;
  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(save)}
        noValidate
        className="rounded-[26px] bg-brand p-7 text-on-inverse"
      >
        <h2 className="font-display text-2xl font-bold">Budget for {editing.name}</h2>
        <div className="mt-6">
          <label htmlFor="category-budget" className={label}>
            Monthly budget{" "}
            <span className="font-normal text-slate-400">(leave empty for none)</span>
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
        {message ? (
          <p
            role="alert"
            className="mt-5 rounded-control bg-navy-800 px-4 py-3 text-sm text-accent-pale"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="lg" loading={pending} fullWidth>
            Save
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
