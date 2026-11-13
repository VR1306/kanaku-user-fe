import { ROUTES } from "@/constants/routes";
import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { moduleForPath } from "@/constants/modules";
import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/features/auth/actions";
import { getSession } from "@/lib/session";
import { CategoriesProvider } from "@/features/categories/components/categories-provider";
import { PreferencesProvider } from "@/features/settings/components/preferences-provider";
import { listCategories } from "@/services/categories-service";
import { canUse, getEntitlements } from "@/services/entitlements-service";
import { getShellSettings } from "@/services/settings-service";
import { NotificationsProvider } from "@/features/notifications/components/notifications-provider";
import { unreadCount } from "@/services/notifications-service";
import { runDueRecurring } from "@/services/recurring-runner";
import { isOnboarded } from "@/services/onboarding-service";

async function SessionShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);
  // New accounts finish the 3-step setup first.
  // Both only need the user id, so run them together (logging due recurring payments for a user who then gets
  // redirected to onboarding is harmless: a new account has none). Due payments are logged before anything reads
  // totals or notifications.
  const [onboarded] = await Promise.all([isOnboarded(session.id), runDueRecurring(session.id)]);
  if (!onboarded) redirect(ROUTES.onboarding);
  const [unread, categories, shell, entitlements] = await Promise.all([
    unreadCount(session.id),
    listCategories(session.id),
    getShellSettings(session.id),
    getEntitlements(session.id),
  ]);
  // Plan-based access: a page whose module isn't in the customer's plan redirects to Plan & billing.
  const locked = moduleForPath((await headers()).get("x-pathname") ?? "");
  if (locked && !canUse(entitlements, locked))
    redirect(`${ROUTES.settings}?section=billing&locked=${locked}`);
  return (
    <NotificationsProvider initialUnread={unread}>
      <CategoriesProvider initial={categories}>
        <PreferencesProvider dateFormat={shell.dateFormat}>
          <AppShell
            modules={entitlements.modules}
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
