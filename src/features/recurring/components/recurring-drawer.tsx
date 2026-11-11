"use client";

import { useState } from "react";
import { useController } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { Form, FormInput, FormSelect } from "@/components/ui/form";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FREQUENCIES } from "@/constants/recurring";
import {
  METHODS_BY_TYPE,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/constants/transactions";
import { useCategories } from "@/features/categories/components/categories-provider";
import { useZodForm } from "@/hooks/use-zod-form";
import { createRecurring, deleteRecurring, updateRecurring } from "../api";
import {
  recurringFormSchema,
  toRecurringInput,
  type RecurringFormValues,
  type RecurringItem,
} from "../schemas";

/** null = closed, "new" = adding, an item = editing it. */
export type RecurringTarget = "new" | RecurringItem | null;

type Props = {
  target: RecurringTarget;
  /** Today as YYYY-MM-DD (the earliest date a payment can start). */
  today: string;
  onClose: () => void;
  onChanged: () => void;
};

const messageOf = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

function RecurringForm({
  target,
  today,
  onClose,
  onChanged,
}: Props & { target: "new" | RecurringItem }) {
  const editing = target === "new" ? null : target;
  const form = useZodForm(recurringFormSchema, {
    type: editing?.type ?? ("expense" as TransactionType),
    title: editing?.title ?? "",
    amount: editing ? String(editing.amount) : "",
    category: editing?.category ?? "",
    method: (editing?.method as (typeof PAYMENT_METHODS)[number]) ?? "UPI",
    frequency: editing?.frequency ?? ("monthly" as const),
    nextDue: editing && editing.nextDue >= today ? editing.nextDue : today,
  });
  const type = form.watch("type");
  const { byType } = useCategories();
  const { field: typeField } = useController({ control: form.control, name: "type" });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  function chooseType(next: TransactionType) {
    typeField.onChange(next);
    if (!byType(next).some((c) => c.name === form.getValues("category"))) {
      form.setValue("category", "");
    }
    if (!METHODS_BY_TYPE[next].some((m) => m === form.getValues("method"))) {
      form.setValue("method", METHODS_BY_TYPE[next][0]);
    }
  }

  async function save(values: RecurringFormValues) {
    setPending(true);
    setMessage(undefined);
    try {
      const input = toRecurringInput(values);
      if (editing) await updateRecurring(editing.id, input);
      else await createRecurring(input);
      onChanged();
      onClose();
    } catch (e) {
      setMessage(messageOf(e, "Couldn't save this payment. Please try again."));
      setPending(false);
    }
  }

  async function remove() {
    if (!editing) return;
    setPending(true);
    try {
      await deleteRecurring(editing.id);
      onChanged();
      onClose();
    } catch (e) {
      setConfirming(false);
      setMessage(messageOf(e, "Couldn't delete this payment."));
      setPending(false);
    }
  }

  return (
    <Form form={form} onSubmit={save} className="mt-8 flex flex-1 flex-col">
      <div className="flex flex-col gap-6">
        <SegmentedControl
          aria-label="Payment type"
          variant="page"
          options={TRANSACTION_TYPES}
          value={type}
          onChange={chooseType}
          className="w-fit"
        />
        <FormInput name="title" label="Name" placeholder="e.g. House rent" autoComplete="off" />
        <FormInput
          name="amount"
          label="Amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="₹0"
        />
        <FormSelect
          name="category"
          label="Category"
          placeholder="Choose a category"
          options={byType(type).map((c) => ({ value: c.name, label: c.name }))}
        />
        <FormSelect
          name="method"
          label={type === "income" ? "Received by" : "Paid with"}
          options={METHODS_BY_TYPE[type].map((m) => ({ value: m, label: m }))}
        />
        <FormSelect
          name="frequency"
          label="Repeats"
          options={FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
        />
        <FormInput
          name="nextDue"
          label={editing ? "Next payment" : "First payment"}
          type="date"
          min={today}
          hint={
            editing
              ? undefined
              : "Starting today logs the first payment straight away; later ones are logged on their due date."
          }
        />
        {editing ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-fit text-sm font-semibold text-danger hover:underline"
          >
            Delete this recurring payment
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
          Save
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        tone="danger"
        icon="trash"
        title={`Delete ${editing?.title}?`}
        description="No more payments will be logged. Ones already logged stay in your transactions."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </Form>
  );
}

export function RecurringDrawer({ target, today, onClose, onChanged }: Props) {
  return (
    <Drawer
      open={target !== null}
      title={target === "new" ? "Add recurring" : "Edit recurring"}
      onClose={onClose}
    >
      {target ? (
        <RecurringForm
          key={target === "new" ? "new" : target.id}
          target={target}
          today={today}
          onClose={onClose}
          onChanged={onChanged}
        />
      ) : null}
    </Drawer>
  );
}
