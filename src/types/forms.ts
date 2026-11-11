/** What a form server action returns. `errors` are keyed by field name. */
export type ActionResult = { errors?: Record<string, string>; message?: string } | void;
