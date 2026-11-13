import { Suspense } from "react";
import { ModuleGate } from "@/components/layout/module-gate";
import type { Metadata } from "next";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getSession } from "@/lib/session";
import { PAGES } from "@/constants/pages";

export const metadata: Metadata = { title: PAGES.dashboard.title };

async function DashboardContent() {
  const session = await getSession();
  const firstName = session?.name.trim().split(/\s+/)[0] || "there";
  return <DashboardView firstName={firstName} />;
}

export default function DashboardPage() {
  return (
    <>
      <ModuleGate module="dashboard" />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}
