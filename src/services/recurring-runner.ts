import { notifyTransactionSaved } from "./notifications-service";
import { processDue } from "./recurring-service";

/**
 * Logs recurring payments that have come due and tells the user about them. Runs whenever a signed
 * in page loads, so schedules are honoured without a background job. Never throws.
 */
export async function runDueRecurring(userId: string, now = new Date()): Promise<void> {
  try {
    for (const payment of await processDue(userId, now)) {
      await notifyTransactionSaved(userId, payment, now);
    }
  } catch (error) {
    console.error("Couldn't process recurring payments", error);
  }
}
