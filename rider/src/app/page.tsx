'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  Power,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  Wallet,
  AlertCircle,
  RefreshCw,
  LogOut,
  Navigation,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RiderDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('rider.musa@eubite.com');
  const [password, setPassword] = useState('Password123!');
  const [rider, setRider] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery PIN modal state
  const [pinInput, setPinInput] = useState('');
  const [pinVerifying, setPinVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // Sign in
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      loadRiderData(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRiderData = async (authToken: string) => {
    try {
      // 1. Get stats & active order
      const statsRes = await fetch(`${API_BASE}/api/dispatch/rider-stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setRider(statsData.data.rider);
        setActiveOrder(statsData.data.activeOrder);
      }

      // 2. If online and no active order, get available drops
      if (statsData.data?.rider?.is_online && !statsData.data?.activeOrder) {
        const availRes = await fetch(`${API_BASE}/api/dispatch/available`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const availData = await availRes.json();
        if (availData.success) {
          setAvailableOrders(availData.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching rider state:', err);
    }
  };

  const toggleOnline = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/dispatch/toggle-online`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_online: !rider?.is_online }),
      });
      const data = await res.json();
      if (data.success) {
        setRider({ ...rider, is_online: data.is_online });
        if (data.is_online) {
          loadRiderData(token);
        } else {
          setAvailableOrders([]);
        }
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClaimOrder = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/dispatch/${orderId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setActiveOrder(data.data);
        setAvailableOrders([]);
      } else {
        alert(data.error);
        loadRiderData(token);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkPickup = async () => {
    if (!token || !activeOrder) return;
    try {
      const res = await fetch(`${API_BASE}/api/dispatch/${activeOrder.id}/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setActiveOrder({ ...activeOrder, status: 'in_transit' });
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyPinAndDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeOrder) return;
    setPinVerifying(true);
    setPinError(null);

    try {
      const res = await fetch(`${API_BASE}/api/dispatch/${activeOrder.id}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Invalid PIN entered');
      }

      // Success
      alert('🎉 Delivery verified and completed! ₦250 credited to your wallet.');
      setShowPinModal(false);
      setPinInput('');
      setActiveOrder(null);
      loadRiderData(token);
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinVerifying(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">EU Bite Rider</h1>
              <p className="text-xs text-slate-400">Campus Dispatch & Payouts</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rider Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60"
            >
              {loading ? 'Connecting...' : 'Sign In as Rider'}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-center text-slate-400">
            Approved Campus Fleet Member Pre-filled
          </p>
        </div>
      </div>
    );
  }

  // If rider is pending approval
  if (rider?.approval_status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-sm w-full bg-slate-800 rounded-3xl p-6 text-center space-y-4 border border-slate-700">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Application Pending Review</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your rider application ({rider?.vehicle_type || 'Vehicle'}) is currently being vetted by Campus Admin.
            Once approved, you will be able to turn on your availability and claim delivery drops.
          </p>
          <button
            onClick={() => setToken(null)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800">
      {/* Apple iOS / Watch Ultra Dark Header */}
      <header className="p-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/90 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-extrabold text-white leading-tight">EU Bite Courier</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Dispatch Unit #{rider?.plate_number || '09'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Apple Pill Online Toggle */}
          <button
            onClick={toggleOnline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              rider?.is_online
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-xs'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${rider?.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{rider?.is_online ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          <button
            onClick={() => loadRiderData(token)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Refresh Deliveries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setToken(null)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-full transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Wallet / Earnings Summary */}
      <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-850 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Wallet Balance</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              ₦{((rider?.total_earnings_kobo || 0) / 100).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400">Completed Drops</p>
            <p className="text-lg font-bold text-white mt-0.5">{rider?.total_deliveries || 0} meals</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-4 flex-1 space-y-4 overflow-y-auto">
        {/* ACTIVE DELIVERY (IF CLAIMED) */}
        {activeOrder ? (
          <div className="bg-slate-900 rounded-2xl p-5 border-2 border-emerald-500/50 space-y-4 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                Active Delivery
              </span>
              <span className="font-mono text-xs font-bold text-slate-300">#{activeOrder.order_number}</span>
            </div>

            {/* Restaurant Pickup Details */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">1. Pickup Restaurant</p>
              <h3 className="text-sm font-bold text-white">{activeOrder.restaurant_name}</h3>
              <p className="text-xs text-slate-400">Meal: {activeOrder.items?.map((i: any) => `${i.quantity}x ${i.item_name}`).join(', ')}</p>
              {activeOrder.restaurant_phone && (
                <a
                  href={`tel:${activeOrder.restaurant_phone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Kitchen: {activeOrder.restaurant_phone}
                </a>
              )}
            </div>

            {/* Student Drop-off Details */}
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">2. Student Hostel Drop-off</p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{activeOrder.hostel}, {activeOrder.room}</span>
              </div>
              <p className="text-xs text-slate-400">Payout for this drop: <span className="text-emerald-400 font-bold">₦250</span></p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {activeOrder.status === 'rider_assigned' && (
                <button
                  onClick={handleMarkPickup}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Meal Picked Up from Kitchen</span>
                </button>
              )}

              {activeOrder.status === 'in_transit' && (
                <button
                  onClick={() => setShowPinModal(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Student 4-Digit PIN to Complete Drop</span>
                </button>
              )}
            </div>
          </div>
        ) : !rider?.is_online ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-600">
              <Power className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-300">You are Currently Offline</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Switch your status to ONLINE at the top right to receive ready-to-pickup meal orders.
            </p>
          </div>
        ) : availableOrders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <Bike className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Searching for Ready Campus Meals...</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Kitchens are currently preparing orders. New delivery opportunities will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Delivery Drops ({availableOrders.length})
              </h2>
              <span className="text-[10px] text-emerald-400 font-bold">₦250 / drop</span>
            </div>

            {availableOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{order.restaurant_name}</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">+₦250</span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Deliver to: <strong className="text-slate-200">{order.hostel}, {order.room}</strong></span>
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Food Subtotal: ₦{order.food_subtotal_ngn.toLocaleString()}</span>
                  <span>{order.packaging_type}</span>
                </div>

                {/* Atomic Claim Action */}
                <button
                  onClick={() => handleClaimOrder(order.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/20"
                >
                  Claim Delivery Now
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Secure PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Enter Student Delivery PIN</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ask the student for their 4-digit code to complete handoff and unlock your ₦250 earnings.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs text-left">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyPinAndDeliver} className="space-y-4">
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-2xl font-mono tracking-widest font-black py-3 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinVerifying || pinInput.length !== 4}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs disabled:opacity-50"
                >
                  {pinVerifying ? 'Verifying...' : 'Verify PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
