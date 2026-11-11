import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionFormView } from "@/features/transactions/components/transaction-form-view";

export const metadata: Metadata = { title: "Edit transaction" };

export default function EditTransactionPage({ params }: PageProps<"/transactions/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
      {params.then(({ id }) => (
        <TransactionFormView id={id} />
      ))}
    </Suspense>
  );
}
