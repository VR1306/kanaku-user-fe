import type { Metadata } from "next";
import { ModuleGate } from "@/components/layout/module-gate";
import { RecurringView } from "@/features/recurring/components/recurring-view";

export const metadata: Metadata = { title: "Recurring payments" };

export default function RecurringPaymentsPage() {
  return (
    <>
      <ModuleGate module="recurring" />
      <RecurringView />
    </>
  );
}
