import type { Metadata } from "next";
import { HelpView } from "@/features/help/components/help-view";

export const metadata: Metadata = { title: "Help & support" };

export default function HelpPage() {
  return <HelpView />;
}
