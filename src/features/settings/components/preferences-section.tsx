"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/field";
import { DATE_FORMATS, THEME_CHOICES } from "@/constants/settings";
import { FOCUS_FIELD } from "@/constants/styles";
import { applyThemeChoice, storedThemeChoice } from "@/hooks/use-theme";
import { cn } from "@/utils/cn";
import { savePreferences } from "../api";
import type { DateFormat } from "@/constants/settings";
import type { SettingsData } from "../schemas";
import { SectionShell } from "./section-shell";

const selectClass = cn(
  "h-[52px] w-full appearance-none rounded-control border border-line-strong bg-surface px-[14px] text-[15px] text-ink disabled:bg-page disabled:text-muted",
  FOCUS_FIELD,
);

function SelectField({
  id,
  label,
  hint,
  children,
  ...rest
}: { id: string; label: string; hint?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field id={id} label={label} hint={hint}>
      <select id={id} {...rest} className={selectClass}>
        {children}
      </select>
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-line-soft py-[18px] text-[15px] text-ink last:border-b-0">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-[22px] rounded-[4px] accent-brand"
      />
    </label>
  );
}

export function PreferencesSection({ data, onSaved }: { data: SettingsData; onSaved: () => void }) {
  const router = useRouter();
  const p = data.preferences;
  const [dateFormat, setDateFormat] = useState<DateFormat>(p.dateFormat);
  const [theme, setTheme] = useState(storedThemeChoice);
  const [budgetAlerts, setBudgetAlerts] = useState(p.emailBudgetAlerts);
  const [billReminders, setBillReminders] = useState(p.emailBillReminders);
  const [monthlyReport, setMonthlyReport] = useState(p.emailMonthlyReport);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await savePreferences({
        dateFormat,
        emailBudgetAlerts: budgetAlerts,
        emailBillReminders: billReminders,
        emailMonthlyReport: monthlyReport,
      });
      applyThemeChoice(theme); // the theme is remembered on this device
      setStatus({ tone: "success", text: "Saved" });
      onSaved();
      router.refresh(); // dates everywhere use the new format
    } catch (err) {
      setStatus({ tone: "danger", text: err instanceof Error ? err.message : "Couldn't save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell title="Preferences" formId="preferences-form" saving={saving} status={status}>
      <form id="preferences-form" onSubmit={save} className="flex flex-col gap-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
          <SelectField id="pref-currency" label="Currency" disabled defaultValue="INR">
            <option value="INR">₹ Indian Rupee (INR)</option>
          </SelectField>
          <SelectField
            id="pref-date"
            label="Date format"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateFormat)}
          >
            {DATE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </SelectField>
          <SelectField id="pref-month" label="Month starts on" disabled defaultValue="1">
            <option value="1">1st of the month</option>
          </SelectField>
          <SelectField
            id="pref-theme"
            label="Theme"
            hint="Remembered on this device."
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
          >
            {THEME_CHOICES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectField>
        </div>

        <fieldset>
          <legend className="text-[17px] font-bold text-ink">Email me about</legend>
          <div className="mt-2">
            <Toggle
              label="Budget alerts at 80% and 100%"
              checked={budgetAlerts}
              onChange={setBudgetAlerts}
            />
            <Toggle
              label="Upcoming bill reminders"
              checked={billReminders}
              onChange={setBillReminders}
            />
            <Toggle
              label="Monthly report summary"
              checked={monthlyReport}
              onChange={setMonthlyReport}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Everything still appears on your Notifications page. These only choose which updates are
            also emailed to you (purchase receipts are always sent).
          </p>
        </fieldset>
      </form>
    </SectionShell>
  );
}
