import { unstable_rethrow } from "next/navigation";
import { DatabaseUnavailableError } from "@/lib/mongo";
import type { ActionResult } from "@/types/forms";

export const DATABASE_DOWN_MESSAGE =
  "We can't reach our servers right now. Please try again in a moment.";

/**
 * Runs a server action. If the database can't be reached it returns a clear message the form
 * shows, instead of leaving the button on "Please wait". Redirects pass straight through.
 */
export async function guarded(run: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DatabaseUnavailableError) {
      console.error("[db] unavailable:", error.message);
      return { message: DATABASE_DOWN_MESSAGE };
    }
    throw error;
  }
}
