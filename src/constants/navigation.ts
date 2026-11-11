import type { NavSection } from "@/types/navigation";
import { ROUTES } from "./routes";

/** Sidebar structure, mirrored from the dashboard design. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.dashboard, icon: "dashboard" },
      { label: "Transactions", href: ROUTES.transactions, icon: "transactions" },
      { label: "Budgets", href: ROUTES.budgets, icon: "budgets" },
      { label: "Reports", href: ROUTES.reports, icon: "reports" },
      { label: "Recurring", href: ROUTES.recurringPayments, icon: "recurring" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Categories", href: ROUTES.categories, icon: "categories" },
      { label: "Notifications", href: ROUTES.notifications, icon: "notifications" },
      { label: "Settings", href: ROUTES.settings, icon: "settings" },
      { label: "Help & support", href: ROUTES.help, icon: "help" },
    ],
  },
];
