import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/constants/theme";
import { MotionProvider } from "@/components/motion/provider";
import "./globals.css";

// latin-ext carries the rupee sign (U+20B9); without it ₹ falls back to a system font.
// `optional`: text never waits for, or swaps to, a late web font (no render delay, no layout shift). Fonts are preloaded.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "optional",
});
// Variable font: one file per subset instead of one per weight.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "optional",
});

export const metadata: Metadata = {
  title: { default: "Kanaku", template: "%s · Kanaku" },
  description: "Spend smart. Grow faster.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
