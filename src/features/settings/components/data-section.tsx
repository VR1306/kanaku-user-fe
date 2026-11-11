"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { Drawer } from "@/components/ui/drawer";
import { FOCUS_FIELD } from "@/constants/styles";
import { cn } from "@/utils/cn";
import { deleteAccount, exportAllUrl, exportCsvUrl } from "../api";
import type { ImportResult } from "../schemas";
import { CsvImportButton, ImportSummary } from "./csv-import";
import { SectionShell } from "./section-shell";

function DeleteAccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await deleteAccount(password);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete your account.");
      setPending(false);
    }
  }

  return (
    <Drawer open={open} title="Delete account" onClose={onClose} busy={pending}>
      {open ? (
        <form onSubmit={confirm} className="mt-6 flex flex-1 flex-col">
          <div className="flex items-start gap-4 rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-5 dark:border-danger/40 dark:bg-danger-tint">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-danger text-on-danger">
              <Icon name="warning" size={22} strokeWidth={2} />
            </span>
            <div>
              <p className="text-base font-bold text-danger">This can&apos;t be undone</p>
              <p className="mt-1 text-sm text-muted">
                Your account and everything in it is deleted for good, and you are signed out on
                every device.
              </p>
            </div>
          </div>

          <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-ink-2 marker:text-danger">
            <li>Transactions, budgets and categories</li>
            <li>Recurring payments and notifications</li>
            <li>Your profile, photo and settings</li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Want a copy first? Close this and use{" "}
            <strong className="text-ink">Export all data (CSV)</strong>.
          </p>

          <div className="mt-6">
            <label htmlFor="delete-password" className="mb-2 block text-sm font-semibold text-ink">
              Enter your password to confirm
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              className={cn(
                "h-[54px] w-full rounded-control border bg-surface px-4 text-[15px] text-ink placeholder:text-subtle",
                error ? "border-danger" : "border-line-strong",
                FOCUS_FIELD,
              )}
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" fullWidth onClick={onClose} disabled={pending}>
              Keep my account
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="lg"
              fullWidth
              loading={pending}
              disabled={!password}
            >
              Delete forever
            </Button>
          </div>
        </form>
      ) : null}
    </Drawer>
  );
}

export function DataSection({ onChanged }: { onChanged: () => void }) {
  const [result, setResult] = useState<ImportResult | { error: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <SectionShell title="Data & privacy">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={exportAllUrl}
          download
          className={cn(buttonClasses({ variant: "outline" }), "text-link")}
        >
          Export all data (Excel)
        </a>
        <a
          href={exportCsvUrl}
          download
          className={cn(buttonClasses({ variant: "outline" }), "text-link")}
        >
          Export as CSV
        </a>
        <CsvImportButton onResult={setResult} onImported={onChanged} />
      </div>
      <p className="mt-3 text-sm text-muted">
        The Excel file has a sheet for each part of your account: Profile, Transactions, Budgets,
        Recurring payments, Categories, Monthly summary and Notifications. Import reads a CSV with
        the same columns as the export: Date (YYYY-MM-DD), Description, Category, Payment, Type and
        Amount. Importing the same file twice doesn&apos;t create duplicates.
      </p>
      {result ? (
        <div className="mt-4">
          <ImportSummary result={result} />
        </div>
      ) : null}

      <div className="mt-8 rounded-[18px] border border-[#FECDD3] bg-[#FFF1F2] p-[23px] dark:border-danger/40 dark:bg-danger-tint">
        <h3 className="text-[17px] font-bold text-danger">Danger zone</h3>
        <p className="mt-3 max-w-[520px] text-[15px] text-muted">
          Deleting your account permanently removes all transactions, budgets and receipts. This
          cannot be undone.
        </p>
        <Button variant="danger" className="mt-5" onClick={() => setDeleting(true)}>
          Delete my account
        </Button>
      </div>
      <DeleteAccountDrawer open={deleting} onClose={() => setDeleting(false)} />
    </SectionShell>
  );
}
