import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EU Bite Vendor — Kitchen Management & Live Order Dispatch',
  description: 'Manage campus restaurant menus, real-time incoming orders, preparation statuses, and daily campus sales.',
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
