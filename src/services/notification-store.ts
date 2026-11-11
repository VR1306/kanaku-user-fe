/**
 * Writing notifications (collection: notifications), shared by every service that has something
 * to tell the user. Kept free of other service imports so any of them can use it.
 * Every notification appears in the app; a few kinds are also e-mailed, subject to the user's
 * choices in Settings > Preferences.
 */
import type { NotificationKind } from "@/constants/notifications";
import type { EmailContent } from "@/lib/email/layout";
import { notificationEmail } from "@/lib/email/app-templates";
import { sendBrandedEmail } from "@/lib/email/send";
import { getDb, isDuplicateKey } from "@/lib/mongo";
import { randomUUID } from "node:crypto";

export type NotificationDoc = {
  _id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  key: string;
  createdAt: Date;
  read: boolean;
};

export type NewNotification = {
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  /** Same key for the same event: a second insert is ignored. */
  key: string;
  /** A tailored e-mail (e.g. a receipt) instead of the standard notification e-mail. */
  email?: (user: { name: string; email: string }) => EmailContent;
};

export async function notificationsCollection() {
  return (await getDb()).collection<NotificationDoc>("notifications");
}

type Prefs = {
  alertsEnabled?: boolean;
  emailBillReminders?: boolean;
  emailMonthlyReport?: boolean;
};

/** Which kinds are e-mailed, and under which preference ("always" = receipts and the like). */
const EMAIL_RULE: Partial<Record<NotificationKind, (p: Prefs) => boolean>> = {
  "budget-exceeded": (p) => p.alertsEnabled ?? true,
  "budget-warning": (p) => p.alertsEnabled ?? true,
  "bill-due": (p) => p.emailBillReminders ?? true,
  report: (p) => p.emailMonthlyReport ?? false,
  purchase: () => true,
  "plan-ending": () => true,
  support: () => true,
};

async function emailNotification(userId: string, n: NewNotification) {
  try {
    const rule = EMAIL_RULE[n.kind];
    if (!rule) return;
    const db = await getDb();
    const [user, profile] = await Promise.all([
      db.collection<{ _id: string; name: string; email: string }>("users").findOne({ _id: userId }),
      db.collection<Prefs & { _id: string }>("profiles").findOne({ _id: userId }),
    ]);
    if (!user || !rule(profile ?? {})) return;
    await sendBrandedEmail(
      user.email,
      n.email?.(user) ??
        notificationEmail({ name: user.name, title: n.title, body: n.body, href: n.href }),
    );
  } catch (error) {
    console.error("Couldn't e-mail notification", error);
  }
}

/** Creates a notification unless one with the same key already exists. Returns whether it was new. */
export async function createNotification(
  userId: string,
  input: NewNotification,
  now = new Date(),
): Promise<boolean> {
  try {
    await (
      await notificationsCollection()
    ).insertOne({
      _id: randomUUID(),
      userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      key: input.key,
      createdAt: now,
      read: false,
    });
    void emailNotification(userId, input);
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

/** Like `createNotification` but never throws: a notification problem must not fail the action. */
export async function tryNotify(userId: string, input: NewNotification): Promise<void> {
  try {
    await createNotification(userId, input);
  } catch (error) {
    console.error("Couldn't create notification", error);
  }
}
