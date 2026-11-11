export const SIDEBAR_WIDTH_EXPANDED = 264;
export const SIDEBAR_WIDTH_COLLAPSED = 80;
export const SIDEBAR_STORAGE_KEY = "kanaku-sidebar-collapsed";

/**
 * One duration + curve drives every collapse/expand animation (sidebar width, page padding,
 * labels, paddings), so everything moves in lockstep. Keep in sync with the `--ease-sidebar`
 * and `--duration-sidebar` tokens in globals.css.
 */
export const SIDEBAR_MOTION = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
