import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Plans & billing lives in Settings now; this keeps old links working. */
export default function BillingPage() {
  redirect(`${ROUTES.settings}?section=billing`);
}
