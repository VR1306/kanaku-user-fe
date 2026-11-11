export const FREQUENCIES = [
  { value: "weekly", label: "Weekly", perMonth: 52 / 12 },
  { value: "monthly", label: "Monthly", perMonth: 1 },
  { value: "quarterly", label: "Quarterly", perMonth: 1 / 3 },
  { value: "yearly", label: "Yearly", perMonth: 1 / 12 },
] as const;
export type Frequency = (typeof FREQUENCIES)[number]["value"];

/** Most missed payments logged in one go (e.g. a weekly payment after months away). */
export const MAX_CATCH_UP = 24;

const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};

/** "Monthly on 1st" · "Quarterly" · "Weekly on Friday" · "Yearly on 5 Mar" */
export function describeSchedule(frequency: Frequency, anchorDay: number, nextDue: string): string {
  const date = new Date(`${nextDue}T12:00:00Z`);
  switch (frequency) {
    case "monthly":
      return `Monthly on ${ordinal(anchorDay)}`;
    case "weekly":
      return `Weekly on ${new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date)}`;
    case "yearly":
      return `Yearly on ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(date)}`;
    default:
      return "Quarterly";
  }
}
