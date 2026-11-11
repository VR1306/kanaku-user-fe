import { ROUTES } from "@/constants/routes";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/features/auth/actions";
import { getSession } from "@/lib/session";
import { CategoriesProvider } from "@/features/categories/components/categories-provider";
import { PreferencesProvider } from "@/features/settings/components/preferences-provider";
import { listCategories } from "@/services/categories-service";
import { getShellSettings } from "@/services/settings-service";
import { NotificationsProvider } from "@/features/notifications/components/notifications-provider";
import { unreadCount } from "@/services/notifications-service";
import { runDueRecurring } from "@/services/recurring-runner";
import { isOnboarded } from "@/services/onboarding-service";

async function SessionShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);
  // New accounts finish the 3-step setup first.
  if (!(await isOnboarded(session.id))) redirect(ROUTES.onboarding);
  // Log recurring payments that have come due before anything reads totals or notifications.
  await runDueRecurring(session.id);
  const [unread, categories, shell] = await Promise.all([
    unreadCount(session.id),
    listCategories(session.id),
    getShellSettings(session.id),
  ]);
  return (
    <NotificationsProvider initialUnread={unread}>
      <CategoriesProvider initial={categories}>
        <PreferencesProvider dateFormat={shell.dateFormat}>
          <AppShell
            user={{ name: session.name, plan: `${shell.planName} plan`, avatar: shell.avatar }}
            onLogout={logoutAction}
          >
            {children}
          </AppShell>
        </PreferencesProvider>
      </CategoriesProvider>
    </NotificationsProvider>
  );
}

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950 lg:w-sidebar" aria-busy="true" />}>
      <SessionShell>{children}</SessionShell>
    </Suspense>
  );
}
