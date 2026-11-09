'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'EUB-202611-101';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#272D2F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#D7D7D7] text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FFC529]/30 text-[#FE724C] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-[#272D2F] bg-[#FFC529] px-3 py-1 rounded-full uppercase tracking-wider">
            Payment Verified
          </span>
          <h1 className="text-2xl font-black text-[#272D2F] mt-3">Order Confirmed!</h1>
          <p className="text-xs text-[#272D2F]/65 mt-1">Order #{orderNumber} has been sent to the kitchen.</p>
        </div>

        {/* PIN Box */}
        <div className="p-5 rounded-2xl bg-[#272D2F] text-white space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#FFC529] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Delivery Verification PIN</span>
          </div>
          <p className="text-2xl font-black tracking-wider text-white">
            Unlocked in Tracker & Chat
          </p>
          <p className="text-[11px] text-[#D7D7D7] leading-tight">
            Share your 4-digit code with your rider only when receiving your meal at your hostel.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={`/track?orderNumber=${orderNumber}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#FE724C] hover:bg-[#e55a35] text-white font-bold py-3.5 rounded-2xl text-xs transition-colors shadow-md shadow-[#FE724C]/20"
          >
            <span>Track Order & View PIN</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center text-[#272D2F]/70 hover:text-[#272D2F] font-bold py-2 text-xs transition-colors"
          >
            Return to Campus Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#272D2F]/60">Loading confirmation...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
