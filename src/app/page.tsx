import { ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";

// TODO(phase 5): replace with the configuration-driven landing page.
export default function Home() {
  redirect(ROUTES.login);
}
