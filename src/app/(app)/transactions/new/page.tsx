import type { Metadata } from "next";
import { TransactionFormView } from "@/features/transactions/components/transaction-form-view";

export const metadata: Metadata = { title: "New transaction" };

export default function NewTransactionPage() {
  return <TransactionFormView />;
}
