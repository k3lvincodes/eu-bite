'use client';

import { useEffect } from 'react';

export default function VendorRedirect() {
  useEffect(() => {
    const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL || 'http://localhost:3003';
    window.location.href = vendorUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
      <p>Redirecting to EU Bite Vendor Kitchen Portal (Port 3003)...</p>
    </div>
  );
}
