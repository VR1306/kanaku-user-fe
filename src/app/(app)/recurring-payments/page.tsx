import type { Metadata } from "next";
import { RecurringView } from "@/features/recurring/components/recurring-view";

export const metadata: Metadata = { title: "Recurring payments" };

export default function RecurringPaymentsPage() {
  return <RecurringView />;
}
