'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, CreditCard, Lock, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function CheckoutPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tx_ref = searchParams.get('tx_ref') || 'EUB-TX-DEMO';
  const amount = searchParams.get('amount') || '2870';
  const orderNumber = searchParams.get('order') || 'EUB-202610-101';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulatePayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref,
          status: 'successful',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Payment verification failed');
      }

      // Route to confirmation
      router.push(`/order-confirmation?orderNumber=${orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Flutterwave Header */}
        <div className="bg-[#fb923c] p-6 text-slate-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-black text-sm tracking-tight">
              <span>Flutterwave</span>
              <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-bold">SECURE CHECKOUT</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">EU Bite Campus Food Order</p>
          </div>
          <Lock className="w-5 h-5 text-slate-900" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Amount to Pay</span>
            <p className="text-3xl font-black text-slate-900 mt-1">₦{parseFloat(amount).toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Order #{orderNumber}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Choose Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-[#fb923c] bg-orange-50/50 text-slate-900 ring-2 ring-[#fb923c]/20'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-[#fb923c] bg-orange-50/50 text-slate-900 ring-2 ring-[#fb923c]/20'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Merchant:</span>
              <span className="font-semibold text-slate-900">EU Bite Technologies</span>
            </div>
            <div className="flex justify-between">
              <span>Tx Reference:</span>
              <span className="font-mono text-[11px] text-slate-500">{tx_ref}</span>
            </div>
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={processing}
            className="w-full bg-[#fb923c] hover:bg-orange-500 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{processing ? 'Verifying with Flutterwave...' : `Pay ₦${parseFloat(amount).toLocaleString()} Securely`}</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Protected by 256-bit encryption. Payment goes to EU Bite escrow until delivery PIN is verified.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-white">Loading payment screen...</div>}>
      <CheckoutPayContent />
    </Suspense>
  );
}
