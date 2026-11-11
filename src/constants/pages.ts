import type { IconName } from "./icons";

export type PageMeta = { title: string; description: string; icon: IconName };

/** Default title/description/icon for every authenticated page. */
export const PAGES = {
  dashboard: {
    title: "Dashboard",
    description: "Your balance, spending and budgets at a glance.",
    icon: "dashboard",
  },
  transactions: {
    title: "Transactions",
    description: "Every expense and income, searchable and filterable.",
    icon: "transactions",
  },
  budgets: {
    title: "Budgets",
    description: "Set monthly limits and see how much you've used.",
    icon: "budgets",
  },
  reports: {
    title: "Reports",
    description: "Trends and breakdowns of where your money goes.",
    icon: "reports",
  },
  recurringPayments: {
    title: "Recurring payments",
    description: "Subscriptions and bills that repeat on a schedule.",
    icon: "recurring",
  },
  categories: {
    title: "Categories",
    description: "Organise spending and income with your own categories.",
    icon: "categories",
  },
  notifications: {
    title: "Notifications",
    description: "Alerts about budgets, bills and your account.",
    icon: "notifications",
  },
  settings: {
    title: "Settings",
    description: "Profile, preferences, security and privacy.",
    icon: "settings",
  },
  help: {
    title: "Help & support",
    description: "Answers to common questions and ways to reach us.",
    icon: "help",
  },
  billing: {
    title: "Plans & billing",
    description: "Your current plan and payment details.",
    icon: "budgets",
  },
} as const satisfies Record<string, PageMeta>;
