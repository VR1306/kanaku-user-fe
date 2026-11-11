"use client";

import { useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/utils/cn";

type Props = {
  title: string;
  children: ReactNode;
  /** Saving state of the section's form; omit `onSave` to hide the Save button. */
  saving?: boolean;
  /** A short result shown beside the buttons ("Saved"). */
  status?: { tone: "success" | "danger"; text: string } | null;
};

/** The white card each settings section sits in: title, body, then Log out and Save changes. */
export function SectionShell({
  title,
  children,
  saving,
  status,
  formId,
}: Props & { formId?: string }) {
  const [loggingOut, startLogout] = useTransition();
  return (
    <section
      aria-labelledby="settings-section-title"
      className="rounded-[24px] border border-line bg-surface p-6 sm:p-[33px]"
    >
      <h2 id="settings-section-title" className="font-display text-[26px] font-bold text-ink">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5">
        <Button
          variant="outline"
          loading={loggingOut}
          onClick={() => startLogout(async () => logoutAction())}
        >
          Log out
        </Button>
        <div className="flex items-center gap-4">
          {status ? (
            <p
              role="status"
              className={cn(
                "text-sm font-semibold",
                status.tone === "success" ? "text-success" : "text-danger",
              )}
            >
              {status.text}
            </p>
          ) : null}
          {formId ? (
            <Button type="submit" form={formId} loading={saving}>
              Save changes
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
