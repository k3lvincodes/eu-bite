import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EU Bite Admin — Platform Management & Operations',
  description: 'Campus administrative control center for orders, fleet approvals, packaging reconciliation, and platform settings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
