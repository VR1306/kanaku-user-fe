import type { HelpTopic } from "./help";

export type HelpArticle = {
  slug: string;
  topic: HelpTopic;
  title: string;
  summary: string;
  /** Paragraphs. A paragraph starting with "- " is a bullet. */
  body: string[];
};

/**
 * The help centre's articles. They are served by the API (/api/help/articles) and searched on the
 * server, so the page never needs to know what is in them.
 */
export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "add-first-expense",
    topic: "getting-started",
    title: "Add your first expense",
    summary: "Record spending in a few taps.",
    body: [
      "Choose New transaction in the sidebar. Pick Expense, type the amount, choose a category and how you paid, and add a short description.",
      "The date starts as today. You can choose an earlier date, but not a future one.",
      "Before you save, the page shows how much of that category's budget you have left, so you can see the effect.",
      "- Tick “Repeats every month” if it recurs (rent, a subscription). Kanaku then logs it for you each month.",
      "- Add a note for anything you want to remember. Notes are searchable.",
    ],
  },
  {
    slug: "set-up-your-account",
    topic: "getting-started",
    title: "Set up your account",
    summary: "The three steps you see after signing up.",
    body: [
      "After you verify your email and set up your authenticator app, Kanaku asks three short things: a few details about you (all optional), the spending categories you care about, and your overall monthly budget.",
      "From your answers Kanaku creates starting budgets. You can change any of them later on the Budgets page.",
      "You can change your name, phone, photo and monthly income any time in Settings → Profile.",
    ],
  },
  {
    slug: "categories",
    topic: "getting-started",
    title: "Create and edit categories",
    summary: "Group your money the way you think about it.",
    body: [
      "Open Categories to see every category with this month's total. Use the form on the right to add one: a name, expense or income, a colour, and an optional monthly budget.",
      "Click the pencil on a card to rename it or change its colour. Renaming updates your past transactions too.",
      "Deleting a category moves its transactions to “Other” (or “Other income”) and removes its budget. The “Other” categories can't be deleted.",
    ],
  },
  {
    slug: "import-and-export",
    topic: "getting-started",
    title: "Import and export your data",
    summary: "Bring your history in, or take a copy out.",
    body: [
      "On the Transactions page, Import CSV reads a file with the columns Date (YYYY-MM-DD), Description, Category, Payment, Type and Amount. Rows with a bad or future date are skipped and explained. Importing the same file twice doesn't create duplicates.",
      "In Settings → Data & privacy, Export all data (Excel) gives you a workbook with a sheet for each part of your account. Export as CSV gives you one file you can import back.",
    ],
  },
  {
    slug: "how-budgets-work",
    topic: "budgets",
    title: "How budgets work",
    summary: "Limits, spending and what's left.",
    body: [
      "Each budget is a monthly limit for one expense category. Spending is worked out from your transactions, so a budget moves the moment you add, edit or delete one.",
      "Your overall budget is a separate total for the month. Edit it from the blue card at the top of the Budgets page.",
      "A card turns amber from 80% used and red once you pass 100%.",
    ],
  },
  {
    slug: "rollover",
    topic: "budgets",
    title: "Rolling over unspent budget",
    summary: "Carry what you didn't spend into next month.",
    body: [
      "Turn on “Roll over unspent amount” when you create or edit a budget. Whatever you didn't spend last month is added to this month's limit.",
      "Only unspent money rolls over. If you overspent, the next month starts from your normal limit.",
    ],
  },
  {
    slug: "budget-alerts",
    topic: "budgets",
    title: "Budget alerts and notifications",
    summary: "Where updates appear, and when you get an email.",
    body: [
      "Kanaku tells you when a budget reaches 80% and when it goes over 100%. Every update, along with your transactions, recurring payments, reports and purchases, appears on the Notifications page.",
      "In Settings → Preferences you choose which updates are also emailed: budget alerts, bill reminders and the monthly report. Purchase receipts are always emailed.",
    ],
  },
  {
    slug: "recurring-payments",
    topic: "budgets",
    title: "Recurring payments",
    summary: "Rent, bills and salary, logged on schedule.",
    body: [
      "Add a recurring payment from the Recurring page: what it is, how much, how often (weekly, monthly, quarterly or yearly) and the first date. On each due date Kanaku adds a real transaction, so your budgets and reports include it.",
      "Use the switch to pause a payment. Resuming it skips the dates you missed. You'll get a reminder a few days before a bill is due.",
    ],
  },
  {
    slug: "pro-plan",
    topic: "billing",
    title: "What you get with Pro",
    summary: "Plans, prices and what's included.",
    body: [
      "Starter is free. Pro adds unlimited budgets and recurring payments, the receipt vault and PDF exports, and smart alerts.",
      "You can see current prices in Settings → Plan & billing → Upgrade to Pro. Prices are shown before GST; the order summary adds 18% GST and shows your total.",
    ],
  },
  {
    slug: "paying-for-pro",
    topic: "billing",
    title: "Paying for Pro",
    summary: "UPI, cards and net banking.",
    body: [
      "Choose Monthly or Yearly (yearly saves 20%), review the order summary and select Pay securely. Payment runs through Razorpay, which supports UPI, cards, net banking and wallets.",
      "Pro doesn't renew by itself. Your plan card shows when it's active until, and you can extend it any time; the new period starts when the current one ends. We'll remind you a few days before it ends.",
    ],
  },
  {
    slug: "coupons-and-receipts",
    topic: "billing",
    title: "Coupons, receipts and GST",
    summary: "Where to enter a code and find your invoice.",
    body: [
      "Enter a coupon in the order summary and select Apply. The discount and your new total show immediately.",
      "After every payment you get an emailed receipt and a notification. Past payments are listed under Settings → Plan & billing → View billing history.",
      "GST at 18% is included in the total you pay.",
    ],
  },
  {
    slug: "two-step-login",
    topic: "privacy",
    title: "Two-step login",
    summary: "Why you need an authenticator code.",
    body: [
      "Every account uses an authenticator app (like Google Authenticator) as a second step when you log in. You set it up the first time you sign in by scanning a QR code.",
      "If you change your password, Kanaku signs your other devices out for you.",
    ],
  },
  {
    slug: "sessions",
    topic: "privacy",
    title: "See and revoke signed-in devices",
    summary: "Sign a lost phone or old laptop out.",
    body: [
      "Settings → Security lists this device and your other sessions. Select Revoke to sign a single device out at once, or Revoke all other sessions to sign everything else out.",
      "You also get a notification each time a new device signs in. If it wasn't you, change your password and revoke that session.",
    ],
  },
  {
    slug: "delete-account",
    topic: "privacy",
    title: "Export your data or delete your account",
    summary: "Your data is yours.",
    body: [
      "Export a copy first from Settings → Data & privacy. To delete your account, choose Delete my account in the Danger zone and enter your password.",
      "Deleting removes your transactions, budgets, categories, recurring payments, notifications and profile for good. It can't be undone.",
    ],
  },
];
