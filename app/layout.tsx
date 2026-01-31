import type { Metadata } from 'next';
import "./globals.css";
import { LocaleProvider } from '@/lib/localeProvider';

export const metadata: Metadata = {
  title: 'Values Card Sort - Prioritize Your Personal Values',
  description: 'An interactive card sorting exercise based on Dr. Judy Ho\'s Stop Self-Sabotage to help you identify and prioritize your personal values.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
