import type { Metadata } from "next";
import { ModuleGate } from "@/components/layout/module-gate";
import { NotificationsView } from "@/features/notifications/components/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <>
      <ModuleGate module="notifications" />
      <NotificationsView />
    </>
  );
}
