"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icons/icon";
import { usePreferences } from "./preferences-provider";
import { Form, FormPasswordInput } from "@/components/ui/form";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { useMountTime } from "@/hooks/use-mount-time";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/utils/cn";
import { formatDatePref, formatTimeAgo } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { changePassword, endOtherSessions, endSession } from "../api";
import { passwordFormSchema, type PasswordFormValues, type SettingsData } from "../schemas";
import { SectionShell } from "./section-shell";

function DeviceIcon({ device, className }: { device: string; className?: string }) {
  const mobile = /iPhone|Android/.test(device);
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-11 shrink-0 place-items-center rounded-[14px]", className)}
    >
      <Icon name={mobile ? "mobile" : "desktop"} size={22} strokeWidth={1.8} />
    </span>
  );
}

export function SecuritySection({ data, onSaved }: { data: SettingsData; onSaved: () => void }) {
  const form = useZodForm(passwordFormSchema, { currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState<string>();
  const newPassword = form.watch("newPassword");
  const mountTime = useMountTime();

  async function save(values: PasswordFormValues) {
    setSaving(true);
    setStatus(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      form.reset({ currentPassword: "", newPassword: "" });
      setStatus({ tone: "success", text: "Password changed. Other devices were signed out." });
      onSaved();
    } catch (e) {
      setStatus({ tone: "danger", text: e instanceof Error ? e.message : "Couldn't change it." });
    } finally {
      setSaving(false);
    }
  }

  async function signOut(id: string) {
    setBusy(id);
    try {
      await endSession(id);
      onSaved();
    } catch (e) {
      setStatus({ tone: "danger", text: e instanceof Error ? e.message : "Couldn't sign it out." });
    } finally {
      setBusy(undefined);
    }
  }

  const now = mountTime;
  const current = data.security.sessions.find((s) => s.current);
  const others = data.security.sessions.filter((s) => !s.current);
  const { dateFormat } = usePreferences();

  async function signOutOthers() {
    setBusy("all");
    try {
      await endOtherSessions();
      onSaved();
    } catch (e) {
      setStatus({
        tone: "danger",
        text: e instanceof Error ? e.message : "Couldn't sign them out.",
      });
    } finally {
      setBusy(undefined);
    }
  }
  return (
    <SectionShell title="Security" formId="password-form" saving={saving} status={status}>
      <Form form={form} onSubmit={save} id="password-form" className="grid gap-6 sm:grid-cols-2">
        <FormPasswordInput
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          placeholder="Enter your current password"
        />
        <div>
          <FormPasswordInput
            name="newPassword"
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          {newPassword ? (
            <div className="mt-3">
              <PasswordStrength password={newPassword} />
            </div>
          ) : null}
        </div>
      </Form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-page p-[18px]">
        <div className="flex min-w-0 flex-1 basis-[280px] items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-success-tint text-success">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <p className="text-base font-bold text-ink">Two-step verification</p>
            <p className="text-sm text-muted">
              {data.security.mfaEnabled
                ? "On. A code from your authenticator app is required every time you sign in."
                : "Set up your authenticator app the next time you sign in."}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-bold",
            data.security.mfaEnabled ? "bg-success-tint text-success" : "bg-line text-muted",
          )}
        >
          {data.security.mfaEnabled ? "On" : "Off"}
        </span>
      </div>

      <h3 className="mt-8 text-[17px] font-bold text-ink">Active sessions</h3>

      {current ? (
        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-brand bg-brand-tint/50 p-4">
          <DeviceIcon device={current.device} className="bg-brand text-on-primary" />
          <div className="min-w-0 flex-1 basis-[200px]">
            <p className="text-base font-bold text-ink">
              {current.device}
              <span className="ml-2 rounded-full bg-brand px-2.5 py-0.5 align-middle text-xs font-bold text-on-primary">
                This device
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Signed in {formatDatePref(current.signedInAt, dateFormat)}
            </p>
          </div>
          <span className="rounded-full bg-success-tint px-3.5 py-1 text-sm font-semibold text-success">
            Active now
          </span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-bold tracking-[0.08em] text-muted uppercase">
          Other sessions{others.length > 0 ? ` (${others.length})` : ""}
        </h4>
        <Button
          variant="outline"
          className="h-10 text-danger"
          loading={busy === "all"}
          disabled={others.length === 0}
          title={others.length === 0 ? "No other devices are signed in" : undefined}
          onClick={() => void signOutOthers()}
        >
          Revoke all other sessions
        </Button>
      </div>

      {others.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line-strong px-4 py-5 text-sm text-muted">
          You&apos;re only signed in on this device. When you sign in somewhere else it appears
          here, and you can revoke that one session, or all of them, to sign the device out
          immediately.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {others.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4"
              >
                <DeviceIcon device={s.device} className="bg-page text-ink-2" />
                <div className="min-w-0 flex-1 basis-[200px]">
                  <p className="text-base font-semibold text-ink">{s.device}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    Signed in {formatDatePref(s.signedInAt, dateFormat)} · Last active{" "}
                    {now ? formatTimeAgo(s.lastSeenAt, now).toLowerCase() : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy === s.id}
                  aria-label={`Revoke the session on ${s.device}`}
                  title="Sign this device out"
                  onClick={() => void signOut(s.id)}
                  className="h-10 rounded-[10px] border border-danger-tint bg-surface px-4 text-[15px] font-semibold text-danger transition-colors hover:bg-danger-tint disabled:opacity-60"
                >
                  {busy === s.id ? "Revoking…" : "Revoke"}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </SectionShell>
  );
}
