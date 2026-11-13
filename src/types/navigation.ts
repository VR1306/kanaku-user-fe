import type { IconName } from "@/constants/icons";

import type { ModuleKey } from "@/constants/modules";

/** `module` ties an item to a plan-controlled module; items without one are always shown. */
export type NavItem = { label: string; href: string; icon: IconName; module?: ModuleKey };
export type NavSection = { title: string; items: NavItem[] };
