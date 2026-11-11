"use client";

import { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { Icon } from "@/components/icons/icon";
import { useCategories } from "@/features/categories/components/categories-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  METHODS_BY_TYPE,
  RECEIPT_MAX_BYTES,
  RECEIPT_TYPES,
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/constants/transactions";
import { TONE_BORDER, TONE_DOT, TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import type { TransactionFormValues } from "../schemas";

/** Expense / Income switch. Changing it resets a category or method that doesn't apply. */
export function TypeToggle() {
  const { control, getValues, setValue } = useFormContext<TransactionFormValues>();
  const { field } = useController({ control, name: "type" });
  const { byType } = useCategories();

  function choose(next: TransactionType) {
    field.onChange(next);
    if (!byType(next).some((c) => c.name === getValues("category"))) {
      setValue("category", "", { shouldValidate: false });
    }
    if (!METHODS_BY_TYPE[next].some((m) => m === getValues("method"))) {
      setValue("method", METHODS_BY_TYPE[next][0]);
    }
  }

  return (
    <SegmentedControl
      aria-label="Transaction type"
      variant="page"
      options={TRANSACTION_TYPES}
      value={field.value}
      onChange={choose}
    />
  );
}

/** The big blue amount box. Text input so "1,250" and "486.50" can be typed naturally. */
export function AmountHero() {
  const {
    register,
    formState: { errors },
  } = useFormContext<TransactionFormValues>();
  const error = errors.amount?.message;
  return (
    <div>
      <div className="rounded-[22px] bg-brand px-6 py-8 text-center">
        <label htmlFor="tx-amount" className="text-xs font-bold tracking-[0.16em] text-accent-pale">
          AMOUNT
        </label>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span aria-hidden="true" className="font-display text-[44px] font-semibold text-accent">
            ₹
          </span>
          <input
            id="tx-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "tx-amount-error" : undefined}
            className="field-sizing-content max-w-full min-w-[1ch] bg-transparent text-center font-display text-[56px] leading-none font-bold text-on-primary placeholder:text-on-primary/30 focus:outline-none sm:text-[68px]"
            {...register("amount")}
          />
        </div>
      </div>
      {error ? (
        <p id="tx-amount-error" role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CategoryTiles() {
  const { control, watch } = useFormContext<TransactionFormValues>();
  const { field, fieldState } = useController({ control, name: "category" });
  const type = watch("type");
  const { byType } = useCategories();
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-ink">Category</legend>
      <div
        role="radiogroup"
        aria-label="Category"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {byType(type).map((c) => {
          const selected = field.value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c.name}
              onClick={() => field.onChange(c.name)}
              className={cn(
                "flex h-24 flex-col items-center justify-between rounded-2xl border-2 p-3.5 text-center transition-colors",
                selected
                  ? cn(TONE_TINT[c.tone], TONE_BORDER[c.tone])
                  : "border-line bg-surface hover:bg-page",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-[34px] place-items-center rounded-[11px] font-display text-sm font-bold",
                  TONE_DOT[c.tone],
                  c.tone === "accent" ? "text-on-accent" : "text-white",
                )}
              >
                {c.short.charAt(0)}
              </span>
              <span className="text-sm font-bold text-ink">{c.short}</span>
            </button>
          );
        })}
      </div>
      {fieldState.error ? (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {fieldState.error.message}
        </p>
      ) : null}
    </fieldset>
  );
}

export function MethodPills() {
  const { control, watch } = useFormContext<TransactionFormValues>();
  const { field, fieldState } = useController({ control, name: "method" });
  const type = watch("type");
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-ink">
        {type === "income" ? "Received by" : "Paid with"}
      </legend>
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {METHODS_BY_TYPE[type].map((m) => {
          const selected = field.value === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => field.onChange(m)}
              className={cn(
                "h-11 rounded-full border px-[18px] text-sm transition-colors",
                selected
                  ? "border-brand bg-brand font-bold text-on-primary"
                  : "border-line-strong bg-surface text-ink-2 hover:bg-page",
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
      {fieldState.error ? (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {fieldState.error.message}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Attach-receipt picker. It validates the file but nothing uploads it yet (no storage backend). */
export function ReceiptPicker() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();

  function pick(next?: File) {
    setError(undefined);
    if (!next) return;
    if (!RECEIPT_TYPES.includes(next.type)) return setError("Use a JPG, PNG or PDF file.");
    if (next.size > RECEIPT_MAX_BYTES) return setError("That file is over 5 MB.");
    setFile(next);
  }

  return (
    <div className="flex-1 basis-[240px]">
      <label className="flex min-h-[69px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-accent bg-accent-tint/40 px-4 py-3">
        <Icon name="upload" size={20} strokeWidth={2} className="shrink-0 text-accent-deep" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-ink">
            {file ? file.name : "Attach receipt"}
          </span>
          <span className="block text-[13px] text-muted">JPG, PNG or PDF · up to 5 MB</span>
        </span>
        <input
          ref={input}
          type="file"
          accept={RECEIPT_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>
      {file ? (
        <button
          type="button"
          onClick={() => {
            setFile(undefined);
            if (input.current) input.current.value = "";
          }}
          className="mt-2 text-[13px] font-semibold text-link underline"
        >
          Remove
        </button>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        Receipts aren&apos;t saved yet: storage isn&apos;t connected.
      </p>
      {error ? (
        <p role="alert" className="mt-1 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
