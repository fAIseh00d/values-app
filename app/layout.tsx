import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/localeProvider";
import { LocaleSetter } from "@/components/LocaleSetter";

export const metadata: Metadata = {
  title: "Values Card Sort - Prioritize Your Personal Values",
  description:
    "An interactive card sorting exercise based on Dr. Judy Ho's Stop Self-Sabotage to help you identify and prioritize your personal values.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className="antialiased">
        <LocaleProvider>
          <LocaleSetter>{children}</LocaleSetter>
        </LocaleProvider>
      </body>
    </html>
  );
}
