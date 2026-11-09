import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EU Bite — WhatsApp-First Campus Food Ordering & Delivery',
  description: 'Order hot delicious meals from your favorite campus restaurants straight to your hostel via WhatsApp.',
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
