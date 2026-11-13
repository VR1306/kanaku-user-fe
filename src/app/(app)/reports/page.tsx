import type { Metadata } from "next";
import { ModuleGate } from "@/components/layout/module-gate";
import { ReportsView } from "@/features/reports/components/reports-view";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <ModuleGate module="reports" />
      <ReportsView />
    </>
  );
}
