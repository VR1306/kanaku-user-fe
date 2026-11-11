import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionDetailView } from "@/features/transactions/components/transaction-detail-view";

export const metadata: Metadata = { title: "Transaction details" };

export default function TransactionDetailPage({ params }: PageProps<"/transactions/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
      {params.then(({ id }) => (
        <TransactionDetailView id={id} />
      ))}
    </Suspense>
  );
}
