'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  UtensilsCrossed,
  Search,
  CheckCircle2,
  Clock,
  Bike,
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
      // Find order by order number or id
      const res = await fetch(`${API_BASE}/api/orders`);
      const data = await res.json();
      if (!data.success) {
        throw new Error('Could not fetch orders.');
      }
      const matched = data.data?.find(
        (o: any) =>
          o.order_number?.toLowerCase() === searchNum.trim().toLowerCase() ||
          o.id === searchNum.trim()
      );
      if (!matched) {
        throw new Error(`Order #${searchNum} not found. Please double check the order number.`);
      }
      setOrder(matched);
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

  // Steps definition
  const steps = [
    { key: 'paid', label: 'Payment Confirmed' },
    { key: 'vendor_accepted', label: 'Kitchen Preparing' },
    { key: 'ready_for_pickup', label: 'Ready for Rider' },
    { key: 'in_transit', label: 'Rider on the Way' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'upcoming';
    const hierarchy = ['pending_payment', 'paid', 'vendor_accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'in_transit', 'delivered'];
    const currentIndex = hierarchy.indexOf(order.status);
    const stepIndex = hierarchy.indexOf(stepKey);

    if (currentIndex >= stepIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-lg">EU Bite</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-emerald-600">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Track Your Campus Meal</h1>
          <p className="text-slate-500 text-sm">Enter your EU Bite order number to view real-time delivery status.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. EUB-202610-101"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Card */}
        {order && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs text-slate-400 font-medium">Order Number</span>
                <p className="text-xl font-black text-slate-900">#{order.order_number}</p>
              </div>

              {/* Secure PIN reminder */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Your Delivery PIN</p>
                  <p className="text-base font-black text-emerald-950 font-mono tracking-wider">{order.delivery_pin}</p>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="py-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Progress Tracker</p>
              <div className="space-y-4">
                {steps.map((st, idx) => {
                  const status = getStepStatus(st.key);
                  const isDone = status === 'completed';
                  return (
                    <div key={st.key} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-xs font-semibold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="pt-4 border-t border-slate-100 grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-slate-500">Hostel Destination</p>
                <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {order.hostel}, {order.room}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-500">Restaurant</p>
                <p className="font-bold text-slate-900 mt-0.5">{order.restaurant_name}</p>
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
