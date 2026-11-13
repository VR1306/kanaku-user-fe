import { Suspense } from "react";
import { ModuleGate } from "@/components/layout/module-gate";
import type { Metadata } from "next";
import { PAGES } from "@/constants/pages";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsView } from "@/features/transactions/components/transactions-view";

export const metadata: Metadata = { title: PAGES.transactions.title };

export default function TransactionsPage() {
  return (
    <>
      <ModuleGate module="transactions" />
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
        <TransactionsView />
      </Suspense>
    </>
  );
}
