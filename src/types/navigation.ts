import type { IconName } from "@/constants/icons";

export type NavItem = { label: string; href: string; icon: IconName };
export type NavSection = { title: string; items: NavItem[] };
