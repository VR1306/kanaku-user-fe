"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { Form, FormCheckbox, FormInput, FormSelect } from "@/components/ui/form";
import { BUDGET_PERIODS } from "@/constants/budgets";
import { useCategories } from "@/features/categories/components/categories-provider";
import { useZodForm } from "@/hooks/use-zod-form";
import { createBudget, deleteBudget, updateBudget, updateBudgetSettings } from "../api";
import {
  budgetFormSchema,
  overallFormSchema,
  toAmount,
  type BudgetFormValues,
  type BudgetItem,
  type OverallFormValues,
} from "../schemas";

/** What the drawer is doing: a new budget, an existing one, or the overall limit. */
export type DrawerTarget =
  | { kind: "new" }
  | { kind: "edit"; budget: BudgetItem }
  | { kind: "overall"; limit: number }
  | null;

type Props = {
  target: DrawerTarget;
  /** Categories that already have a budget. */
  taken: string[];
  onClose: () => void;
  /** Called after any successful save/delete so the screen can reload. */
  onChanged: () => void;
};

const messageOf = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function BudgetForm({
  target,
  taken,
  onClose,
  onChanged,
}: Props & { target: NonNullable<DrawerTarget> & { kind: "new" | "edit" } }) {
  const editing = target.kind === "edit" ? target.budget : null;
  const { byType } = useCategories();
  const available = byType("expense").filter(
    (c) => c.name === editing?.category || !taken.includes(c.name),
  );
  const form = useZodForm(budgetFormSchema, {
    category: editing?.category ?? "",
    limit: editing ? String(editing.baseLimit) : "",
    period: "monthly" as const,
    rollover: editing?.rollover ?? false,
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  async function save(values: BudgetFormValues) {
    setPending(true);
    setMessage(undefined);
    const input = {
      category: values.category,
      limit: toAmount(values.limit),
      period: values.period,
      rollover: values.rollover,
    };
    try {
      if (editing) await updateBudget(editing.id, input);
      else await createBudget(input);
      onChanged();
      onClose();
    } catch (e) {
      setMessage(messageOf(e, "Couldn't save this budget. Please try again."));
      setPending(false);
    }
  }

  async function remove() {
    if (!editing) return;
    setPending(true);
    try {
      await deleteBudget(editing.id);
      onChanged();
      onClose();
    } catch (e) {
      setConfirming(false);
      setMessage(messageOf(e, "Couldn't delete this budget."));
      setPending(false);
    }
  }

  return (
    <Form form={form} onSubmit={save} className="mt-8 flex flex-1 flex-col">
      <div className="flex flex-col gap-6">
        <FormSelect
          name="category"
          label="Category"
          placeholder="Choose a category"
          options={available.map((c) => ({ value: c.name, label: c.name }))}
        />
        <FormInput
          name="limit"
          label="Monthly limit"
          inputMode="decimal"
          autoComplete="off"
          placeholder="₹0"
        />
        <FormSelect
          name="period"
          label="Period"
          options={BUDGET_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        />
        <FormCheckbox name="rollover">Roll over unspent amount</FormCheckbox>
        {editing ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-fit text-sm font-semibold text-danger hover:underline"
          >
            Delete this budget
          </button>
        ) : null}
        {message ? (
          <p role="alert" className="rounded-control bg-danger-tint px-4 py-3 text-sm text-danger">
            {message}
          </p>
        ) : null}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <Button variant="outline" size="lg" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={pending}>
          Save budget
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        tone="danger"
        icon="trash"
        title={`Delete the ${editing?.category} budget?`}
        description="Spending in this category stays as it is; only the limit is removed."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </Form>
  );
}

function OverallForm({
  limit,
  onClose,
  onChanged,
}: Pick<Props, "onClose" | "onChanged"> & { limit: number }) {
  const form = useZodForm(overallFormSchema, { limit: String(limit) });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function save(values: OverallFormValues) {
    setPending(true);
    setMessage(undefined);
    try {
      await updateBudgetSettings({ overallLimit: toAmount(values.limit) });
      onChanged();
      onClose();
    } catch (e) {
      setMessage(messageOf(e, "Couldn't save the overall budget."));
      setPending(false);
    }
  }

  return (
    <Form form={form} onSubmit={save} className="mt-8 flex flex-1 flex-col">
      <div className="flex flex-col gap-6">
        <FormInput
          name="limit"
          label="Overall monthly budget"
          inputMode="decimal"
          autoComplete="off"
          hint="Your total spending limit across every category."
        />
        {message ? (
          <p role="alert" className="rounded-control bg-danger-tint px-4 py-3 text-sm text-danger">
            {message}
          </p>
        ) : null}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <Button variant="outline" size="lg" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={pending}>
          Save budget
        </Button>
      </div>
    </Form>
  );
}

export function BudgetDrawer({ target, taken, onClose, onChanged }: Props) {
  const title =
    target?.kind === "overall"
      ? "Overall budget"
      : target?.kind === "edit"
        ? "Edit budget"
        : "New budget";
  return (
    <Drawer open={target !== null} title={title} onClose={onClose}>
      {target?.kind === "overall" ? (
        <OverallForm limit={target.limit} onClose={onClose} onChanged={onChanged} />
      ) : target ? (
        <BudgetForm
          // A fresh form per target so values never leak between budgets.
          key={target.kind === "edit" ? target.budget.id : "new"}
          target={target}
          taken={taken}
          onClose={onClose}
          onChanged={onChanged}
        />
      ) : null}
    </Drawer>
  );
}
