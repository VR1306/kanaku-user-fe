import { API_ROUTES } from "@/constants/api";
import type { HelpTopic } from "@/constants/help";
import { apiGet, apiSend } from "@/services/api-client";
import {
  articleSchema,
  articlesSchema,
  ticketDetailSchema,
  ticketsSchema,
  type AttachmentInput,
  type NewTicketInput,
} from "./schemas";

export const fetchArticles = (query: string, topic?: HelpTopic, signal?: AbortSignal) => {
  const p = new URLSearchParams();
  if (query) p.set("q", query);
  if (topic) p.set("topic", topic);
  return apiGet(`${API_ROUTES.help}/articles?${p}`, articlesSchema, signal);
};
export const fetchArticle = (slug: string, signal?: AbortSignal) =>
  apiGet(`${API_ROUTES.help}/articles/${encodeURIComponent(slug)}`, articleSchema, signal);

const tickets = `${API_ROUTES.support}/tickets`;
export const fetchTickets = (signal?: AbortSignal) => apiGet(tickets, ticketsSchema, signal);
export const fetchTicket = (id: string, signal?: AbortSignal) =>
  apiGet(`${tickets}/${encodeURIComponent(id)}`, ticketDetailSchema, signal);
export const createTicket = (input: NewTicketInput) =>
  apiSend("POST", tickets, ticketDetailSchema, input);
export const replyToTicket = (id: string, message: string, attachment: AttachmentInput | null) =>
  apiSend("POST", `${tickets}/${encodeURIComponent(id)}/messages`, ticketDetailSchema, {
    message,
    attachment,
  });
export const resolveTicket = (id: string) =>
  apiSend("POST", `${tickets}/${encodeURIComponent(id)}/resolve`, ticketDetailSchema);
