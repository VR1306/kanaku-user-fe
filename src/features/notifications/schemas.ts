import { z } from "zod";
import { NOTIFICATION_FILTERS, NOTIFICATION_KINDS } from "@/constants/notifications";

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.enum(NOTIFICATION_KINDS),
  title: z.string(),
  body: z.string(),
  /** Where clicking the notification goes. */
  href: z.string().nullable(),
  /** ISO 8601. */
  createdAt: z.string(),
  read: z.boolean(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

export const notificationsListSchema = z.object({
  items: z.array(notificationSchema),
  unreadCount: z.number().int().min(0),
});
export type NotificationsList = z.infer<typeof notificationsListSchema>;

export const unreadCountSchema = z.object({ unreadCount: z.number().int().min(0) });

export const notificationsQuerySchema = z.object({
  filter: z.enum(NOTIFICATION_FILTERS.map((f) => f.value) as ["all", "unread"]).default("all"),
});
