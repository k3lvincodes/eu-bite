'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  UtensilsCrossed,
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  MapPin,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get('orderNumber') || '';

  const [orderNumber, setOrderNumber] = useState(initialNumber);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (searchNum: string) => {
    if (!searchNum.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cleanQuery = searchNum.trim();
      const res = await fetch(`${API_BASE}/api/orders/track/${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || `Order #${cleanQuery} not found. Please double check the order number.`);
      }
      setOrder(data.data);
    } catch (err: any) {
      setError(err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialNumber) {
      fetchOrder(initialNumber);
    }
  }, [initialNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderNumber);
  };

  const steps = [
    { key: 'paid', label: 'Payment Confirmed' },
    { key: 'vendor_accepted', label: 'Kitchen Preparing' },
    { key: 'ready_for_pickup', label: 'Ready for Rider' },
    { key: 'in_transit', label: 'Rider on the Way' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'upcoming';
    const hierarchy = [
      'pending_payment',
      'paid',
      'vendor_accepted',
      'preparing',
      'ready_for_pickup',
      'rider_assigned',
      'in_transit',
      'delivered',
    ];
    const currentIndex = hierarchy.indexOf(order.status);
    const stepIndex = hierarchy.indexOf(stepKey);

    if (currentIndex >= stepIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#272D2F] flex flex-col">
      <header className="bg-white/90 backdrop-blur-md border-b border-[#D7D7D7]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FE724C] flex items-center justify-center text-white">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-black text-[#272D2F] text-xl">
              EU <span className="text-[#FE724C]">Bite</span>
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-[#272D2F] hover:text-[#FE724C] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-14 flex-1 w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FE724C]">Live Status</span>
          <h1 className="text-3xl font-black text-[#272D2F]">Track Your Campus Meal</h1>
          <p className="text-[#272D2F]/65 text-xs">
            Enter your EU Bite order number to view real-time kitchen and courier status.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-[#272D2F]/40" />
            <input
              type="text"
              placeholder="e.g. EUB-202611-101"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full text-xs pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-[#D7D7D7] focus:outline-none focus:border-[#FE724C] font-semibold"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#FE724C] hover:bg-[#e55a35] text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Card */}
        {order && (
          <div className="bg-white rounded-3xl border border-[#D7D7D7] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D7D7D7]/60 gap-4">
              <div>
                <span className="text-[11px] text-[#272D2F]/50 font-bold uppercase tracking-wider">Order Number</span>
                <p className="text-xl font-black text-[#272D2F] mt-0.5">#{order.order_number}</p>
              </div>

              {/* Secure PIN reminder */}
              <div className="bg-[#272D2F] text-white rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFC529] text-[#272D2F] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#FFC529] uppercase">Delivery PIN</p>
                  <p className="text-base font-black text-white tracking-widest">{order.delivery_pin}</p>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="py-1">
              <p className="text-[11px] font-bold text-[#272D2F]/50 uppercase tracking-wider mb-4">Progress</p>
              <div className="space-y-3.5">
                {steps.map((st, idx) => {
                  const status = getStepStatus(st.key);
                  const isDone = status === 'completed';
                  return (
                    <div key={st.key} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isDone
                            ? 'bg-[#FE724C] text-white'
                            : 'bg-[#FAFAFA] text-[#272D2F]/40 border border-[#D7D7D7]'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-xs font-bold ${isDone ? 'text-[#272D2F]' : 'text-[#272D2F]/40'}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="pt-5 border-t border-[#D7D7D7]/60 grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-[#272D2F]/50 uppercase text-[10px]">Hostel Destination</p>
                <p className="font-bold text-[#272D2F] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FE724C]" />
                  {order.hostel}, {order.room}
                </p>
              </div>

              <div>
                <p className="font-bold text-[#272D2F]/50 uppercase text-[10px]">Kitchen</p>
                <p className="font-bold text-[#272D2F] mt-1">{order.restaurant_name}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#272D2F]/60">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
