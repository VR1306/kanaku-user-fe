import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import type { NotificationFilter } from "@/constants/notifications";
import { apiGet, apiSend } from "@/services/api-client";
import { notificationsListSchema, unreadCountSchema } from "./schemas";

export const fetchNotifications = (filter: NotificationFilter, signal?: AbortSignal) =>
  apiGet(`${API_ROUTES.notifications}?filter=${filter}`, notificationsListSchema, signal);

export const fetchUnreadCount = (signal?: AbortSignal) =>
  apiGet(`${API_ROUTES.notifications}/unread-count`, unreadCountSchema, signal);

export const markNotificationRead = (id: string) =>
  apiSend(
    "PATCH",
    `${API_ROUTES.notifications}/${encodeURIComponent(id)}`,
    z.object({ id: z.string() }),
  );

export const markAllNotificationsRead = () =>
  apiSend("POST", `${API_ROUTES.notifications}/read-all`, z.object({ updated: z.number() }));
