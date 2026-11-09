'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { ShieldCheck, CreditCard, Lock, Building2, AlertTriangle, Copy, Check } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ALATPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_ALATPAY_PUBLIC_KEY || '';
const ALATPAY_BUSINESS_ID = process.env.NEXT_PUBLIC_ALATPAY_BUSINESS_ID || '';

declare global {
  interface Window {
    Alatpay?: {
      setup: (config: Record<string, any>) => {
        show: () => void;
      };
    };
  }
}

function CheckoutPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tx_ref = searchParams.get('tx_ref') || 'EUB-TX-DEMO';
  const amount = searchParams.get('amount') || '2870';
  const orderNumber = searchParams.get('order') || 'EUB-202610-101';
  const customerEmail = searchParams.get('email') || 'student@eubite.com';
  const customerPhone = searchParams.get('phone') || '08000000000';
  const customerName = searchParams.get('name') || 'Campus Student';
  const vaNumber = searchParams.get('va_number') || '7820194832';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPaymentOnServer = async (alatpayRef?: string) => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref,
          alatpay_ref: alatpayRef,
          status: 'successful',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'ALATPay payment verification failed');
      }

      router.push(`/order-confirmation?orderNumber=${orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleAlatPayPayment = async () => {
    if (
      typeof window !== 'undefined' &&
      window.Alatpay &&
      ALATPAY_PUBLIC_KEY &&
      ALATPAY_BUSINESS_ID &&
      !ALATPAY_PUBLIC_KEY.includes('test_')
    ) {
      const nameParts = customerName.trim().split(/\s+/);
      const popup = window.Alatpay.setup({
        apiKey: ALATPAY_PUBLIC_KEY,
        businessId: ALATPAY_BUSINESS_ID,
        email: customerEmail,
        phone: customerPhone,
        firstName: nameParts[0] || 'Campus',
        lastName: nameParts.slice(1).join(' ') || 'Student',
        amount: parseFloat(amount),
        currency: 'NGN',
        metadata: JSON.stringify({ tx_ref, orderNumber }),
        onTransaction: (response: any) => {
          verifyPaymentOnServer(response?.transactionId || response?.reference);
        },
        onClose: () => {
          setProcessing(false);
        },
      });
      popup.show();
      return;
    }

    await verifyPaymentOnServer();
  };

  const handleCopyAccount = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#272D2F] flex items-center justify-center p-4">
      <Script src="https://web.alatpay.ng/js/alatpay.js" strategy="lazyOnload" />
      <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#D7D7D7]">
        {/* ALATPay by Wema Header */}
        <div className="bg-[#FE724C] p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-black text-sm tracking-tight">
              <span>ALATPay</span>
              <span className="text-[10px] bg-[#FFC529] text-[#272D2F] px-2 py-0.5 rounded-full font-bold">BY WEMA BANK</span>
            </div>
            <p className="text-xs font-semibold text-white/90 mt-0.5">EU Bite Campus Food Order</p>
          </div>
          <Lock className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Amount to Pay</span>
            <p className="text-3xl font-black text-slate-900 mt-1">₦{parseFloat(amount).toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Order #{orderNumber}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Choose ALATPay Channel</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-[#FE724C] bg-[#FFC529]/20 text-[#272D2F] ring-2 ring-[#FE724C]/20'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card / ALAT</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-[#FE724C] bg-[#FFC529]/20 text-[#272D2F] ring-2 ring-[#FE724C]/20'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'transfer' && (
            <div className="p-3.5 rounded-xl bg-[#FFC529]/15 border border-[#FFC529] text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Virtual Account (Wema Bank):</span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1 font-sans font-bold text-[#FE724C] hover:underline"
                >
                  <span>{vaNumber}</span>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-semibold text-slate-900">ALATPay / EU Bite Escrow</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Merchant:</span>
              <span className="font-semibold text-slate-900">EU Bite Technologies</span>
            </div>
            <div className="flex justify-between">
              <span>Tx Reference:</span>
              <span className="font-sans text-[11px] text-slate-500">{tx_ref}</span>
            </div>
          </div>

          <button
            onClick={handleAlatPayPayment}
            disabled={processing}
            className="w-full bg-[#FE724C] hover:bg-[#e55a35] text-white font-black py-3.5 rounded-2xl text-xs transition-colors shadow-lg shadow-[#FE724C]/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{processing ? 'Verifying with ALATPay...' : `Pay ₦${parseFloat(amount).toLocaleString()} via ALATPay`}</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Secured by ALATPay (Wema Bank). Payment goes to EU Bite escrow until delivery PIN is verified.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-white">Loading ALATPay checkout...</div>}>
      <CheckoutPayContent />
    </Suspense>
  );
}
