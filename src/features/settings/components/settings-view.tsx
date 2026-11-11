"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FadeSwitch } from "@/components/motion/presence";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/constants/settings";
import { cn } from "@/utils/cn";
import { useSettings } from "../hooks/use-settings";
import { BillingSection } from "@/features/billing/components/billing-section";
import { DataSection } from "./data-section";
import { PreferencesSection } from "./preferences-section";
import { ProfileSection } from "./profile-section";
import { SecuritySection } from "./security-section";

const navItem =
  "flex h-[46px] w-full items-center rounded-[12px] px-4 text-left text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function SettingsView({ initialSection }: { initialSection: SettingsSection }) {
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const { data, error, reload } = useSettings();

  function choose(next: SettingsSection) {
    setSection(next);
    window.history.replaceState(null, "", `?section=${next}`);
  }

  const view = error && !data ? "error" : !data ? "loading" : section;

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, preferences and security" />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[222px_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto rounded-[20px] border border-line bg-surface p-[11px] lg:flex-col lg:overflow-visible"
        >
          {SETTINGS_SECTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-current={section === item.value ? "page" : undefined}
              onClick={() => choose(item.value)}
              className={cn(
                navItem,
                "whitespace-nowrap",
                section === item.value
                  ? "bg-brand font-bold text-on-primary"
                  : "font-medium text-ink-2 hover:bg-page",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <FadeSwitch id={view}>
          {error && !data ? (
            <EmptyState
              icon="help"
              title="We couldn't load your settings"
              description={error}
              action={<Button onClick={reload}>Try again</Button>}
            />
          ) : !data ? (
            <Skeleton
              aria-busy="true"
              aria-label="Loading settings"
              className="h-[504px] rounded-[24px]"
            />
          ) : section === "profile" ? (
            <ProfileSection data={data} onSaved={reload} />
          ) : section === "preferences" ? (
            <PreferencesSection data={data} onSaved={reload} />
          ) : section === "security" ? (
            <SecuritySection data={data} onSaved={reload} />
          ) : section === "billing" ? (
            <BillingSection />
          ) : (
            <DataSection onChanged={reload} />
          )}
        </FadeSwitch>
      </div>
    </>
  );
}
