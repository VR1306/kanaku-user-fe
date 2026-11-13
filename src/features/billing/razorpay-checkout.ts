import type { CheckoutSession } from "./schemas";

/** What Razorpay hands the browser after a successful payment. */
export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  /** Which payment methods Checkout shows first, and how. */
  config?: { display: Record<string, unknown> };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};
type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (e: { error: { description: string } }) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | undefined;

/** Loads Razorpay's Checkout script once. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = undefined;
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export type CheckoutOutcome =
  | { status: "paid"; response: RazorpaySuccess }
  | { status: "dismissed" }
  | { status: "failed"; message: string };

/** Opens Razorpay Checkout (UPI, cards, net banking, wallets) for an order. */
export async function openCheckout(session: CheckoutSession): Promise<CheckoutOutcome> {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("The payment window isn't available.");
  return new Promise((resolve) => {
    const checkout = new Razorpay({
      key: session.keyId,
      order_id: session.orderId,
      amount: session.amountPaise,
      currency: "INR",
      name: "Kanaku",
      description: session.description,
      prefill: session.prefill,
      theme: { color: "#1D4ED8" },
      // UPI first: scan a QR with any UPI app (Google Pay, PhonePe, Paytm…), enter a UPI ID, or - on a phone - open an
      // installed app directly. Cards, net banking and wallets follow. What actually appears also depends on the methods
      // switched on for the Razorpay account (Dashboard > Settings > Payment Methods) and on test vs live mode.
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay with UPI",
              instruments: [
                {
                  method: "upi",
                  flows: ["qr", "collect", "intent"],
                  apps: ["google_pay", "phonepe", "paytm"],
                },
              ],
            },
            other: {
              name: "Cards, net banking & wallets",
              instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }],
            },
          },
          sequence: ["block.upi", "block.other"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: (response) => resolve({ status: "paid", response }),
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    });
    checkout.on("payment.failed", (e) =>
      resolve({ status: "failed", message: e.error.description || "The payment failed." }),
    );
    checkout.open();
  });
}
