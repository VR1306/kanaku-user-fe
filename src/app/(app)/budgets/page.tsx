import type { Metadata } from "next";
import { ModuleGate } from "@/components/layout/module-gate";
import { BudgetsView } from "@/features/budgets/components/budgets-view";
import { PAGES } from "@/constants/pages";

export const metadata: Metadata = { title: PAGES.budgets.title };

export default function BudgetsPage() {
  return (
    <>
      <ModuleGate module="budgets" />
      <BudgetsView />
    </>
  );
}
