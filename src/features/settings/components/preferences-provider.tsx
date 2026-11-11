"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_DATE_FORMAT, type DateFormat } from "@/constants/settings";
import { formatDatePref } from "@/utils/format";

type PreferencesContextValue = {
  dateFormat: DateFormat;
  /** Formats an ISO instant or a "YYYY-MM-DD" date the way the user chose in Settings. */
  formatDate: (value: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue>({
  dateFormat: DEFAULT_DATE_FORMAT,
  formatDate: (value) => formatDatePref(value, DEFAULT_DATE_FORMAT),
});

export const usePreferences = () => useContext(PreferencesContext);

/** Passes the user's display preferences (read on the server) to every screen. */
export function PreferencesProvider({
  dateFormat,
  children,
}: {
  dateFormat: DateFormat;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ dateFormat, formatDate: (v: string) => formatDatePref(v, dateFormat) }),
    [dateFormat],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
