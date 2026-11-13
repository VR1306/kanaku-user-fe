import type { NavSection } from "@/types/navigation";
import { ROUTES } from "./routes";

/** Sidebar structure, mirrored from the dashboard design. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.dashboard, icon: "dashboard", module: "dashboard" },
      {
        label: "Transactions",
        href: ROUTES.transactions,
        icon: "transactions",
        module: "transactions",
      },
      { label: "Budgets", href: ROUTES.budgets, icon: "budgets", module: "budgets" },
      { label: "Reports", href: ROUTES.reports, icon: "reports", module: "reports" },
      {
        label: "Recurring",
        href: ROUTES.recurringPayments,
        icon: "recurring",
        module: "recurring",
      },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Categories", href: ROUTES.categories, icon: "categories", module: "categories" },
      {
        label: "Notifications",
        href: ROUTES.notifications,
        icon: "notifications",
        module: "notifications",
      },
      { label: "Settings", href: ROUTES.settings, icon: "settings" },
      { label: "Help & support", href: ROUTES.help, icon: "help" },
    ],
  },
];
