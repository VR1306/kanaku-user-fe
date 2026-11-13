export class BillingError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_coupon" | "invalid_signature" | "not_found" | "unavailable",
  ) {
    super(message);
  }
}
