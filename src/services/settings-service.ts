/**
 * Account settings backed by MongoDB: the user's name, photo and phone (users, profiles),
 * preferences (profiles), password and devices (users, sessions), and account deletion.
 */
import { DEFAULT_DATE_FORMAT, type DateFormat } from "@/constants/settings";
import type { PreferencesInput, ProfileInput, SettingsData } from "@/features/settings/schemas";
import { getDb } from "@/lib/mongo";
import { syncUser } from "./admin-sync";
import { validSessions } from "./sessions-service";
import { setPassword, verifyPassword } from "./auth-service";
import { getPlanName } from "./billing-service";
import { notifySecurity } from "./notification-events";
import { listSessions } from "./sessions-service";

type ProfileDoc = {
  _id: string;
  phone?: string;
  monthlyIncome?: number | null;
  dateFormat?: DateFormat;
  /** "Budget alerts" (shared with the Budgets page). */
  alertsEnabled?: boolean;
  emailBillReminders?: boolean;
  emailMonthlyReport?: boolean;
  emailAnnouncements?: boolean;
  /** SMS is opt-in: absent means no consent. */
  smsAnnouncements?: boolean;
  pushTokens?: string[];
};
type UserDoc = { _id: string; name: string; email: string; avatar?: string; mfaEnabled: boolean };

async function profiles() {
  return (await getDb()).collection<ProfileDoc>("profiles");
}
async function users() {
  return (await getDb()).collection<UserDoc>("users");
}

/** Preferences with their defaults filled in. */
export function preferencesOf(profile: ProfileDoc | null): SettingsData["preferences"] {
  return {
    currency: "INR",
    dateFormat: profile?.dateFormat ?? DEFAULT_DATE_FORMAT,
    emailBudgetAlerts: profile?.alertsEnabled ?? true,
    emailBillReminders: profile?.emailBillReminders ?? true,
    emailMonthlyReport: profile?.emailMonthlyReport ?? false,
    emailAnnouncements: profile?.emailAnnouncements ?? true,
    smsAnnouncements: profile?.smsAnnouncements ?? false,
  };
}

export async function getPreferences(userId: string) {
  return preferencesOf(await (await profiles()).findOne({ _id: userId }));
}

export async function getSettings(userId: string, sid: string): Promise<SettingsData | null> {
  const [user, profile, sessions] = await Promise.all([
    users().then((c) => c.findOne({ _id: userId })),
    profiles().then((c) => c.findOne({ _id: userId })),
    listSessions(userId, sid),
  ]);
  if (!user) return null;
  return {
    profile: {
      name: user.name,
      email: user.email,
      phone: profile?.phone ?? "",
      monthlyIncome: profile?.monthlyIncome ?? null,
      avatar: user.avatar ?? null,
    },
    preferences: preferencesOf(profile),
    security: { mfaEnabled: user.mfaEnabled, sessions },
  };
}

/** Just what the app shell needs: the photo and the preferred date format. */
export async function getShellSettings(userId: string) {
  const [user, profile, planName] = await Promise.all([
    users().then((c) => c.findOne({ _id: userId }, { projection: { avatar: 1 } })),
    profiles().then((c) => c.findOne({ _id: userId }, { projection: { dateFormat: 1 } })),
    getPlanName(userId),
  ]);
  return {
    avatar: user?.avatar ?? null,
    dateFormat: profile?.dateFormat ?? DEFAULT_DATE_FORMAT,
    planName,
  };
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  await Promise.all([
    users().then((c) => c.updateOne({ _id: userId }, { $set: { name: input.name } })),
    profiles().then((c) =>
      c.updateOne(
        { _id: userId },
        { $set: { phone: input.phone, monthlyIncome: input.monthlyIncome } },
        { upsert: true },
      ),
    ),
  ]);
  validSessions.clear(); // the name shown in the app comes from the session lookup
  syncUser(userId);
}

export async function setAvatar(userId: string, dataUrl: string | null): Promise<void> {
  await (
    await users()
  ).updateOne(
    { _id: userId },
    dataUrl ? { $set: { avatar: dataUrl } } : { $unset: { avatar: "" } },
  );
}

export async function updatePreferences(userId: string, input: PreferencesInput): Promise<void> {
  await (
    await profiles()
  ).updateOne(
    { _id: userId },
    {
      $set: {
        dateFormat: input.dateFormat,
        alertsEnabled: input.emailBudgetAlerts,
        emailBillReminders: input.emailBillReminders,
        emailMonthlyReport: input.emailMonthlyReport,
        emailAnnouncements: input.emailAnnouncements,
        smsAnnouncements: input.smsAnnouncements,
      },
    },
    { upsert: true },
  );
  syncUser(userId);
}

/** Changes the password and signs out every other device. */
export async function changePassword(
  userId: string,
  currentSid: string,
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "wrong_password"> {
  if (!(await verifyPassword(userId, currentPassword))) return "wrong_password";
  await setPassword(userId, newPassword);
  await (
    await getDb()
  )
    .collection<{ _id: string; userId: string }>("sessions")
    .deleteMany({ userId, _id: { $ne: currentSid } });
  await notifySecurity(
    userId,
    "Password changed",
    "Your password was changed and your other devices were signed out.",
    `password:${Date.now()}`,
  );
  return "ok";
}

const COLLECTIONS_BY_USER_ID = [
  "transactions",
  "budgets",
  "recurring",
  "categories",
  "notifications",
  "sessions",
] as const;

/** Permanently deletes the account and everything in it. */
export async function deleteAccount(
  userId: string,
  password: string,
): Promise<"ok" | "wrong_password"> {
  if (!(await verifyPassword(userId, password))) return "wrong_password";
  const db = await getDb();
  const user = await db
    .collection<{ _id: string; email: string }>("users")
    .findOne({ _id: userId });
  await Promise.all([
    ...COLLECTIONS_BY_USER_ID.map((name) => db.collection(name).deleteMany({ userId })),
    db.collection<{ _id: string }>("profiles").deleteOne({ _id: userId }),
    user
      ? Promise.all([
          db
            .collection<{ _id: string }>("auth_codes")
            .deleteMany({ _id: { $regex: `:${escapeRegex(user.email)}$` } }),
          db.collection<{ _id: string }>("mfa_attempts").deleteOne({ _id: user.email }),
        ])
      : Promise.resolve(),
  ]);
  await db.collection<{ _id: string }>("users").deleteOne({ _id: userId });
  return "ok";
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
