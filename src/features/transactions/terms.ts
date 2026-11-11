/** Splits user input into lower-case search terms ("₹1,250 uPI" -> ["1250", "upi"]). */
export function searchTerms(query: string): string[] {
  return query.toLowerCase().replace(/[₹,]/g, "").split(/\s+/).filter(Boolean);
}
