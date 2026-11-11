"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClasses, Button } from "@/components/ui/button";
import { Form, FormCheckbox, FormInput, FormTextarea } from "@/components/ui/form";
import { ROUTES, transactionRoute } from "@/constants/routes";
import { NOTE_MAX_LENGTH, TITLE_MAX_LENGTH } from "@/constants/transactions";
import { useZodForm } from "@/hooks/use-zod-form";
import { createTransaction, updateTransaction } from "../api";
import {
  localDate,
  toInput,
  transactionFormSchema,
  type TransactionDetail,
  type TransactionFormValues,
} from "../schemas";
import { FormAside } from "./form-aside";
import { AmountHero, CategoryTiles, MethodPills, ReceiptPicker, TypeToggle } from "./form-controls";

type TransactionFormProps = {
  /** The transaction being edited; omit to create a new one. */
  existing?: TransactionDetail;
  /** Today in the browser (YYYY-MM-DD), computed after mount so it can't mismatch the server HTML. */
  today: string;
};

function defaultsFor(
  existing: TransactionDetail | undefined,
  today: string,
): TransactionFormValues {
  if (!existing) {
    return {
      type: "expense",
      amount: "",
      category: "",
      title: "",
      date: today,
      method: "UPI",
      note: "",
      recurring: false,
    };
  }
  return {
    type: existing.type,
    amount: String(Math.abs(existing.amount)),
    category: existing.category,
    title: existing.title,
    date: existing.date.slice(0, 10),
    method: existing.method as TransactionFormValues["method"],
    note: existing.note,
    recurring: existing.recurring,
  };
}

export function TransactionForm({ existing, today }: TransactionFormProps) {
  const router = useRouter();
  const form = useZodForm(transactionFormSchema, defaultsFor(existing, today));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const editing = Boolean(existing);
  const cancelHref = existing ? transactionRoute(existing.id) : ROUTES.transactions;

  async function onSubmit(values: TransactionFormValues) {
    setPending(true);
    setMessage(undefined);
    try {
      const input = toInput(values);
      const { data } = existing
        ? await updateTransaction(existing.id, input)
        : await createTransaction(input);
      router.push(transactionRoute(data.id));
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Couldn't save the transaction. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    // One form context spans the card and the aside; the form element itself is the page grid.
    <Form
      form={form}
      onSubmit={onSubmit}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_317px]"
      aria-label={editing ? "Edit transaction" : "New transaction"}
    >
      <div className="rounded-[28px] border border-line bg-surface p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] leading-tight font-bold text-ink sm:text-4xl">
              {editing ? "Edit transaction" : "New transaction"}
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              {editing ? "Update the details below." : "Log an expense or income in seconds."}
            </p>
          </div>
          <TypeToggle />
        </div>

        <div className="mt-8 flex flex-col gap-7">
          <AmountHero />
          <CategoryTiles />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              name="title"
              label="Description"
              placeholder="e.g. Food delivery"
              maxLength={TITLE_MAX_LENGTH}
              autoComplete="off"
            />
            <FormInput name="date" label="Date" type="date" max={localDate(0)} />
          </div>
          <MethodPills />
          <FormTextarea
            name="note"
            label="Note (optional)"
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Team lunch, split later with friends."
          />
          <div className="flex flex-wrap items-start gap-3">
            <ReceiptPicker />
            <div className="flex min-h-[69px] flex-1 basis-[200px] items-center rounded-2xl border border-line px-5">
              <FormCheckbox name="recurring">Repeat every month</FormCheckbox>
            </div>
          </div>
        </div>

        {message ? (
          <p
            role="alert"
            className="mt-6 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-line-soft pt-6">
          <Link href={cancelHref} className={buttonClasses({ variant: "outline", size: "lg" })}>
            Cancel
          </Link>
          <Button type="submit" size="lg" loading={pending}>
            {editing ? "Save changes" : "Save transaction"}
          </Button>
        </div>
      </div>

      <FormAside excludeId={existing?.id} />
    </Form>
  );
}
