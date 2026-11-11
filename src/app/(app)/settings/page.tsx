import { Suspense } from "react";
import type { Metadata } from "next";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/constants/settings";
import { SettingsView } from "@/features/settings/components/settings-view";

export const metadata: Metadata = { title: "Settings" };

async function Settings({
  searchParams,
}: {
  searchParams: PageProps<"/settings">["searchParams"];
}) {
  const { section } = await searchParams;
  const requested = Array.isArray(section) ? section[0] : section;
  const initial: SettingsSection =
    SETTINGS_SECTIONS.find((s) => s.value === requested)?.value ?? "profile";
  return <SettingsView initialSection={initial} />;
}

export default function SettingsPage(props: PageProps<"/settings">) {
  return (
    <Suspense fallback={null}>
      <Settings searchParams={props.searchParams} />
    </Suspense>
  );
}
