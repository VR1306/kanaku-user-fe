/** Icon paths copied verbatim from the design SVGs (24x24 grid, 1.8 stroke). */
export const ICON_PATHS = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  transactions: "M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4",
  budgets: "M4 7h16v12H4zM4 11h16M15 15h2M7 7V5h10v2",
  reports: "M4 20V10M10 20V4M16 20v-7M21 20H3",
  recurring: "M20 12a8 8 0 1 1-3-6.2M20 4v5h-5",
  categories: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z",
  notifications: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4",
  settings:
    "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  help: "M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01",
  plus: "M12 5v14M5 12h14",
  desktop: "M3 5h18v12H3zM8 21h8M12 17v4",
  mobile: "M7 2h10v20H7zM11 18h2",
  file: "M7 3h7l5 5v13H7zM14 3v5h5",
  warning: "M12 3l10 18H2zM12 10v4M12 17h.01",
  check: "M5 13l4 4L19 7",
  calendar: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4",
  chevronDown: "M6 9l6 6 6-6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  logout: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9",
  chevronLeft: "M15 18l-6-6 6-6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  close: "M6 6l12 12M18 6L6 18",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  eyeOff:
    "M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.7 8.4 2 12 2 12s4 7 10 7c1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
} as const;

export type IconName = keyof typeof ICON_PATHS;
