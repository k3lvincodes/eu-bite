import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
