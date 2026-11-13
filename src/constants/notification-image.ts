import { API_ROUTES } from "./api";

/** Authenticated image route for an announcement notification (the picture itself lives in the Admin Portal). */
export const notificationImageUrl = (id: string) => `${API_ROUTES.notifications}/${id}/image`;
