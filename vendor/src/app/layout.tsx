import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const pinterestSans = localFont({
  src: [
    { path: './fonts/Pin-Sans-Regular.woff2', weight: '300', style: 'normal' },
    { path: './fonts/Pin-Sans-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Pin-Sans-Regular-Italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/Pin-Sans-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Pin-Sans-Medium-Italic.woff2', weight: '500', style: 'italic' },
    { path: './fonts/Pin-Sans-Medium.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Pin-Sans-Medium-Italic.woff2', weight: '600', style: 'italic' },
    { path: './fonts/Pin-Sans-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Pin-Sans-Bold-Italic.woff2', weight: '700', style: 'italic' },
    { path: './fonts/Pin-Sans-Bold.woff2', weight: '800', style: 'normal' },
    { path: './fonts/Pin-Sans-Bold-Italic.woff2', weight: '800', style: 'italic' },
    { path: './fonts/Pin-Sans-Heavy.woff2', weight: '900', style: 'normal' },
    { path: './fonts/Pin-Sans-Heavy-Italic.woff2', weight: '900', style: 'italic' },
  ],
  variable: '--font-pinterest-sans',
  display: 'swap',
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
    <html lang="en" className={pinterestSans.variable}>
      <body className={`${pinterestSans.className} min-h-screen bg-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
