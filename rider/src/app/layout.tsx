import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EU Bite Rider — Dispatch, Claim & Deliver',
  description: 'Campus rider dispatch portal for delivering student meals with PIN verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
