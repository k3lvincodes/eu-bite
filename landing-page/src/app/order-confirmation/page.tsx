'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, ArrowRight, UtensilsCrossed } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'EUB-202610-101';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Payment Verified
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-3">Order Confirmed!</h1>
          <p className="text-xs text-slate-500 mt-1">Order #{orderNumber} has been received by the kitchen.</p>
        </div>

        {/* PIN Box */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Delivery Verification PIN</span>
          </div>
          <p className="text-3xl font-black tracking-widest font-mono text-emerald-400">
            Available in Tracker
          </p>
          <p className="text-[11px] text-slate-400 leading-tight">
            Hand this 4-digit code to your rider only after receiving your package at your hostel.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={`/track?orderNumber=${orderNumber}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20"
          >
            <span>Track Order & View PIN</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center text-slate-600 hover:text-slate-900 font-semibold py-2 text-xs transition-colors"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading confirmation...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
