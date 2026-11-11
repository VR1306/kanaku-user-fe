"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useMountTime } from "@/hooks/use-mount-time";
import { useTransaction } from "../hooks/use-transaction";
import { localDate } from "../schemas";
import { TransactionForm } from "./transaction-form";

const FormSkeleton = () => (
  <div aria-busy="true" aria-label="Loading form" className="grid gap-6 lg:grid-cols-[1fr_317px]">
    <Skeleton className="h-[720px] rounded-[28px]" />
    <Skeleton className="h-[178px] rounded-[24px]" />
  </div>
);

/** Add (no `id`) or edit (`id`) screen. The form mounts only once the browser's date is known. */
export function TransactionFormView({ id }: { id?: string }) {
  const mountTime = useMountTime();
  const { data, error, loading, reload } = useTransaction(id ?? null);

  if (id && error && !data) {
    const missing = error.status === 404;
    return (
      <EmptyState
        icon="help"
        title={missing ? "Transaction not found" : "We couldn't load this transaction"}
        description={missing ? "It may have been deleted." : error.message}
        action={
          missing ? (
            <Link href={ROUTES.transactions} className={buttonClasses()}>
              Back to transactions
            </Link>
          ) : (
            <Button onClick={reload}>Try again</Button>
          )
        }
      />
    );
  }
  if (!mountTime || (id && (loading || !data))) return <FormSkeleton />;

  return <TransactionForm existing={data} today={localDate(0, new Date(mountTime))} />;
}
