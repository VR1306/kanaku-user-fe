import { Suspense } from "react";
import type { Metadata } from "next";
import { isModuleKey } from "@/constants/modules";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/constants/settings";
import { SettingsView } from "@/features/settings/components/settings-view";

export const metadata: Metadata = { title: "Settings" };

async function Settings({
  searchParams,
}: {
  searchParams: PageProps<"/settings">["searchParams"];
}) {
  const { section, locked } = await searchParams;
  const requested = Array.isArray(section) ? section[0] : section;
  const initial: SettingsSection =
    SETTINGS_SECTIONS.find((s) => s.value === requested)?.value ?? "profile";
  const lockedRaw = Array.isArray(locked) ? locked[0] : locked;
  return (
    <SettingsView
      initialSection={initial}
      lockedModule={lockedRaw && isModuleKey(lockedRaw) ? lockedRaw : undefined}
    />
  );
}

export default function SettingsPage(props: PageProps<"/settings">) {
  return (
    <Suspense fallback={null}>
      <Settings searchParams={props.searchParams} />
    </Suspense>
  );
}
