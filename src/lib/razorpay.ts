import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Razorpay REST client (server-side) for Standard Web Checkout: create an order, open
 * Checkout with its id in the browser, then verify the signature Razorpay returns. The key secret
 * never leaves the server; only the key id is sent to the browser.
 */
const DEFAULT_BASE = "https://api.razorpay.com/v1";

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET || "";
export const isRazorpayConfigured = () => Boolean(razorpayKeyId() && keySecret());

export class RazorpayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RazorpayError";
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!isRazorpayConfigured()) throw new RazorpayError("Payments aren't set up yet.", 503);
  const base = process.env.RAZORPAY_API_BASE || DEFAULT_BASE;
  const auth = Buffer.from(`${razorpayKeyId()}:${keySecret()}`).toString("base64");
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: { description?: string } };
  if (!response.ok) {
    throw new RazorpayError(
      json.error?.description ?? "Razorpay couldn't process that request.",
      response.status,
    );
  }
  return json as T;
}

export type RzpOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
};

export type RzpPayment = {
  id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  vpa?: string;
  bank?: string;
  wallet?: string;
  card?: { network?: string; last4?: string; type?: string };
  created_at?: number;
};

/** Creates an order. `amountPaise` must be at least 100. */
export function createOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return call<RzpOrder>("POST", "/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
}

export const fetchPayment = (id: string) => call<RzpPayment>("GET", `/payments/${id}`);

/** Captures an authorized payment (otherwise Razorpay refunds it after a few days). */
export const capturePayment = (id: string, amountPaise: number) =>
  call<RzpPayment>("POST", `/payments/${id}/capture`, { amount: amountPaise, currency: "INR" });

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const hmac = (secret: string, data: string) =>
  createHmac("sha256", secret).update(data).digest("hex");

/** HMAC-SHA256(order_id + "|" + payment_id, key secret) must equal the signature from Checkout. */
export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  return (
    isRazorpayConfigured() &&
    safeEqualHex(hmac(keySecret(), `${input.orderId}|${input.paymentId}`), input.signature)
  );
}

/** Checks that a webhook really came from Razorpay. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  return Boolean(secret && signature && safeEqualHex(hmac(secret, rawBody), signature));
}

/** "Visa •••• 4242", "UPI · name@bank", "Net banking · HDFC" ... */
export function describePaymentMethod(p: RzpPayment): string {
  switch (p.method) {
    case "card": {
      const network = p.card?.network ?? "Card";
      return p.card?.last4 ? `${network} •••• ${p.card.last4}` : network;
    }
    case "upi":
      return p.vpa ? `UPI · ${p.vpa}` : "UPI";
    case "netbanking":
      return p.bank ? `Net banking · ${p.bank}` : "Net banking";
    case "wallet":
      return p.wallet ? `Wallet · ${p.wallet}` : "Wallet";
    default:
      return p.method ? p.method.charAt(0).toUpperCase() + p.method.slice(1) : "Razorpay";
  }
}
