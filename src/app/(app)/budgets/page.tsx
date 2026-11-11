import type { Metadata } from "next";
import { BudgetsView } from "@/features/budgets/components/budgets-view";
import { PAGES } from "@/constants/pages";

export const metadata: Metadata = { title: PAGES.budgets.title };

export default function BudgetsPage() {
  return <BudgetsView />;
}
