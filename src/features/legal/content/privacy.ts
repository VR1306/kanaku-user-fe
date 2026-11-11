import type { LegalDocumentContent } from "../types";

export const PRIVACY: LegalDocumentContent = {
  title: "Privacy Policy",
  summary:
    "What Kanaku collects, why we collect it, who can see it and the choices you have. We keep it short and we don't sell your data.",
  updated: "11 November 2026",
  sections: [
    {
      id: "about",
      title: "About this policy",
      blocks: [
        "Kanaku is a personal-finance web app that helps you record income and expenses, set budgets and see where your money goes. This policy explains how Kanaku (“we”, “us”) handles your personal information when you use the website and its services.",
        "By creating an account you confirm that you have read this policy and agree to it. If you don't agree, please don't use Kanaku.",
      ],
    },
    {
      id: "collect",
      title: "Information we collect",
      blocks: [
        "We only collect what we need to run your account.",
        [
          "Account details: your name, e-mail address and password. Your password is never stored as typed; only a salted one-way hash is kept.",
          "Security details: the secret behind your authenticator app (stored encrypted), the last code you used, and failed-attempt counters used to stop guessing.",
          "Setup answers: your currency, optional monthly income, salary day, savings goal and the spending categories you chose during onboarding.",
          "Money you record: transactions (description, amount, date, category, payment method, note and whether it repeats), the edit history of each transaction, and your budgets.",
          "Temporary codes: the one-time codes we e-mail you to verify your address or reset your password. They are stored hashed and deleted automatically once they expire (15 minutes).",
          "Technical data: our hosting and database providers may keep standard server logs, such as IP address and request time, to keep the service running and secure.",
        ],
        "Kanaku does not connect to your bank accounts, cards or UPI apps, and we do not currently store receipt files. Everything in your account is information you enter yourself.",
      ],
    },
    {
      id: "use",
      title: "How we use your information",
      blocks: [
        [
          "To create and secure your account, including e-mail verification and two-step sign-in.",
          "To show your transactions, budgets, dashboard figures and exports.",
          "To send service e-mails such as verification and password-reset codes. We do not send marketing e-mail.",
          "To protect against fraud, abuse and security incidents, and to fix bugs.",
          "To meet legal obligations.",
        ],
        "We do not sell your personal information, we do not show advertising, and we do not use your financial data to build advertising profiles.",
      ],
    },
    {
      id: "basis",
      title: "Your consent and legal basis",
      blocks: [
        "We process your information with your consent, which you give when you create an account and accept this policy, and where it is necessary to provide the service you asked for. You can withdraw consent at any time by deleting your account (see section 9); withdrawing consent means we can no longer provide the service.",
        "We handle personal data in line with India's Digital Personal Data Protection Act, 2023. If you live in the European Economic Area or the United Kingdom, we apply comparable protections for you.",
      ],
    },
    {
      id: "sharing",
      title: "Who we share it with",
      blocks: [
        "We share information only with service providers that help us run Kanaku, and only what they need:",
        [
          "Database hosting: MongoDB Atlas stores your account and financial data.",
          "E-mail delivery: an SMTP e-mail provider delivers verification and password-reset messages. It sees your address and the message content.",
          "Web hosting: the provider that serves the website and API.",
        ],
        "We may disclose information if the law requires it, or to protect the rights, safety and security of our users or the service. If Kanaku is ever merged with or acquired by another organisation, your information may transfer to it and this policy will continue to apply until you are told otherwise.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      blocks: [
        "Kanaku uses only the cookies and browser storage it needs to work. There are no advertising or tracking cookies.",
        [
          "kanaku_session (cookie): keeps you signed in. It is HTTP-only and lasts for the browser session, one day or 30 days if you choose “remember me”.",
          "kanaku_flow (cookie): remembers which step of sign-up, verification or password reset you are on. It lasts up to an hour.",
          "kanaku-theme and kanaku-sidebar-collapsed (local storage): remember your light/dark choice and whether the sidebar is collapsed. They stay on your device.",
        ],
        "Because these are essential, blocking them will stop sign-in from working.",
      ],
    },
    {
      id: "security",
      title: "How we protect your data",
      blocks: [
        [
          "Passwords are hashed with scrypt and a unique salt.",
          "Two-step sign-in with an authenticator app is required for every account, and authenticator secrets are encrypted at rest.",
          "Connections to Kanaku are encrypted in transit.",
          "Every request is checked against your session, and you can only reach your own data.",
        ],
        "No online service is perfectly secure. Please use a strong, unique password, keep your authenticator device safe and tell us straight away if you think someone else has access to your account.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      blocks: [
        "We keep your account and financial data for as long as your account is open. Verification and reset codes are deleted automatically when they expire. When you delete your account we delete your personal data from our database, except anything we must keep to meet a legal obligation. Routine backups and provider logs are overwritten on their normal schedule.",
      ],
    },
    {
      id: "rights",
      title: "Your choices and rights",
      blocks: [
        "You can ask us at any time to:",
        [
          "give you a copy of the personal data we hold about you (you can also export your transactions as a CSV file from the Transactions page);",
          "correct information that is wrong or incomplete;",
          "delete your account and the data in it;",
          "withdraw your consent, or object to a particular use of your data;",
          "nominate someone to exercise these rights on your behalf if you are unable to, as allowed under Indian law.",
        ],
        "Contact us using the details in section 12. We may need to confirm it's really you before we act, and we aim to reply within 30 days. If you are not happy with our answer you can complain to us first, and then to the Data Protection Board of India or your local data-protection authority.",
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: [
        "Kanaku is meant for people aged 18 or over. We do not knowingly collect information from children. If you believe a child has given us personal data, contact us and we will delete it.",
      ],
    },
    {
      id: "transfers",
      title: "Where your data is stored, and changes",
      blocks: [
        "Our providers may store and process data in data centres outside your country, including outside India. Wherever it is handled, we require providers to protect it to a standard consistent with this policy.",
        "We may update this policy as Kanaku changes. When we make a significant change we will tell you by e-mail or in the app before it takes effect. The date at the top shows when it was last updated.",
      ],
    },
    {
      id: "contact",
      title: "Contact and grievances",
      blocks: [
        "Questions, requests or complaints about your privacy can be sent to our support team. Use the contact details below and write “Privacy” in the subject. Our grievance contact will acknowledge your message and respond within the time set by law.",
      ],
    },
  ],
};
