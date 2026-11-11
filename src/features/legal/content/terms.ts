import type { LegalDocumentContent } from "../types";

export const TERMS: LegalDocumentContent = {
  title: "Terms of Service",
  summary:
    "The rules for using Kanaku. In short: it's a tool for tracking your own money, it isn't financial advice, and you're responsible for keeping your account secure.",
  updated: "11 November 2026",
  sections: [
    {
      id: "agreement",
      title: "Agreement to these terms",
      blocks: [
        "These Terms of Service (“Terms”) are an agreement between you and Kanaku (“we”, “us”) about your use of the Kanaku website and services (the “Service”). By creating an account or using the Service you accept these Terms and our Privacy Policy. If you don't accept them, don't use the Service.",
      ],
    },
    {
      id: "service",
      title: "What Kanaku is, and isn't",
      blocks: [
        "Kanaku helps you record your income and spending, set budgets and view summaries of your own finances.",
        [
          "Kanaku is not a bank, lender, payment service or investment adviser. We never hold, move or invest your money.",
          "Nothing in the Service is financial, tax, investment or legal advice. Figures, percentages and suggestions (such as suggested budgets or “safe to spend” amounts) are generated from what you enter, are for information only, and you decide what to do with them.",
        ],
      ],
    },
    {
      id: "eligibility",
      title: "Who can use Kanaku",
      blocks: [
        "You must be at least 18 years old and able to enter into a binding contract. By using the Service you confirm that you meet these requirements.",
      ],
    },
    {
      id: "account",
      title: "Your account",
      blocks: [
        [
          "Give accurate information when you sign up and keep it up to date.",
          "You must verify your e-mail address and set up an authenticator app. You can't use the Service without two-step sign-in.",
          "Keep your password and authenticator device private. You are responsible for activity under your account unless you tell us promptly that it has been compromised.",
          "One person, one account. Don't share an account or create accounts for someone else without their permission.",
        ],
      ],
    },
    {
      id: "content",
      title: "Your data",
      blocks: [
        "You own the information you put into Kanaku, such as your transactions, notes and budgets. You give us permission to store, process and display it solely to operate and improve the Service for you, as described in our Privacy Policy.",
        "You are responsible for the accuracy of what you enter. Kanaku can only be as accurate as your records.",
      ],
    },
    {
      id: "use",
      title: "Acceptable use",
      blocks: [
        "Please don't:",
        [
          "break the law or use the Service for fraud, money laundering or any unlawful purpose;",
          "try to access another person's account or data, or probe, scan or test the Service's security without our written permission;",
          "overload or disrupt the Service, or use bots, scrapers or automated means to access it in ways we haven't allowed;",
          "upload malicious code, or reverse engineer, copy or resell the Service;",
          "put someone else's personal information into the Service without their permission.",
        ],
        "We may suspend or limit an account that breaks these rules or puts the Service or other users at risk.",
      ],
    },
    {
      id: "ip",
      title: "Our rights in the Service",
      blocks: [
        "The Kanaku name, logo, design, software and content (other than your data) belong to us or our licensors. We give you a personal, non-exclusive, non-transferable, revocable right to use the Service for your own personal finances while these Terms apply. We reserve all other rights.",
      ],
    },
    {
      id: "fees",
      title: "Price",
      blocks: [
        "Kanaku is currently provided free of charge. If we introduce paid features we will tell you first and will not charge you unless you choose to subscribe.",
      ],
    },
    {
      id: "availability",
      title: "Availability and changes",
      blocks: [
        "We work to keep Kanaku available and your data safe, but we don't promise the Service will always be uninterrupted or error-free. We may add, change or remove features, and may carry out maintenance, with or without notice. Because we cannot guarantee against data loss, keep your own records of anything important; you can export your transactions as CSV from the Transactions page.",
      ],
    },
    {
      id: "termination",
      title: "Ending your account",
      blocks: [
        "You can stop using Kanaku at any time and ask us to delete your account using the contact details below. We may suspend or end your access if you seriously or repeatedly break these Terms, if the law requires it, or if we stop offering the Service; where reasonable we will give you notice and a chance to export your data first. Sections that by their nature should survive (such as 11, 12 and 14) continue after your account ends.",
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimers",
      blocks: [
        "To the fullest extent the law allows, the Service is provided “as is” and “as available”, without warranties of any kind, whether express or implied, including fitness for a particular purpose, accuracy and non-infringement. We do not warrant that figures or projections shown are complete, accurate or suitable for your decisions.",
      ],
    },
    {
      id: "liability",
      title: "Limit of liability",
      blocks: [
        "To the fullest extent the law allows, we are not liable for indirect, incidental, special or consequential losses, or for loss of profits, savings, data or goodwill, arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the amount you paid us for it in the 12 months before the claim, or ₹1,000 if you paid nothing.",
        "Nothing in these Terms limits liability that cannot be limited by law, or any rights you have under consumer-protection law.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these Terms",
      blocks: [
        "We may update these Terms from time to time. For significant changes we will notify you by e-mail or in the app before they take effect. If you keep using the Service after the change takes effect, you accept the updated Terms. If you don't agree, stop using the Service and delete your account.",
      ],
    },
    {
      id: "law",
      title: "Governing law and disputes",
      blocks: [
        "These Terms are governed by the laws of India. We encourage you to contact us first so we can try to resolve any dispute informally. If we can't, the courts of India will have jurisdiction, subject to any mandatory rights you have under the law of the place where you live.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        "Questions about these Terms, or requests to delete your account, can be sent to our support team using the details below.",
      ],
    },
  ],
};
