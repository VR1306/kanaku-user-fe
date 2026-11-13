"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icons/icon";
import { Logo } from "@/components/ui/logo";
import {
  SIDEBAR_MOTION,
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/constants/layout";
import { cn } from "@/utils/cn";
import { usePersistedFlag } from "@/hooks/use-persisted-flag";
import { useNotificationsContext } from "@/features/notifications/components/notifications-provider";
import { Sidebar, type SidebarUser } from "./sidebar";

type AppShellProps = {
  user: SidebarUser;
  /** Modules the customer's plan includes (menu items for others are hidden). */
  modules?: readonly string[];
  onLogout: () => Promise<void>;
  children: ReactNode;
};

/** Authenticated layout: collapsible sidebar on desktop, slide-over drawer on small screens. */
export function AppShell({ user: account, modules, onLogout, children }: AppShellProps) {
  const { unread } = useNotificationsContext();
  const user = { ...account, unreadCount: unread };
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = usePersistedFlag(SIDEBAR_STORAGE_KEY);
  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Close the drawer on Escape (link clicks close it via onNavigate).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-page" style={{ "--sidebar-w": `${width}px` } as CSSProperties}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden transition-[width] lg:block print:hidden",
          SIDEBAR_MOTION,
        )}
        style={{ width }}
      >
        <Sidebar user={user} modules={modules} collapsed={collapsed} onLogout={onLogout} />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-9 -right-3 grid size-6 place-items-center rounded-full bg-accent text-on-accent shadow-sm transition-colors hover:bg-accent-pale"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} className="grid">
            <Icon name="chevronLeft" size={14} strokeWidth={2.4} />
          </motion.span>
        </button>
      </aside>

      <header className="flex h-16 items-center justify-between bg-navy-950 px-4 lg:hidden print:hidden">
        <Logo tone="dark" size={32} />
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-control text-on-inverse hover:bg-white/10"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      <AnimatePresence>
        {open ? (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-navy-950/60"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative h-full w-sidebar max-w-[85vw]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <Sidebar
                user={user}
                modules={modules}
                onLogout={onLogout}
                onNavigate={() => setOpen(false)}
              />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <main
        id="main"
        className={cn(
          "px-4 py-8 transition-[padding] lg:pt-10 lg:pr-10 lg:pl-[calc(var(--sidebar-w)+40px)] print:p-0 print:lg:p-0",
          SIDEBAR_MOTION,
        )}
      >
        {children}
      </main>
    </div>
  );
}
