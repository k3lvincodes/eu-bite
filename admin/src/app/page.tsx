'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BarChart3,
  ShoppingBag,
  Bike,
  Package,
  Settings,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  TrendingUp,
  UserCheck,
  Edit2,
  DollarSign,
  Plus,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('admin@eubite.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'riders' | 'packaging' | 'settings' | 'audit'>('metrics');

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<any[]>([]);
  const [packTransactions, setPackTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Pack Restock / Transaction Modal
  const [showPackModal, setShowPackModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [packTransType, setPackTransType] = useState('restocked');
  const [packQty, setPackQty] = useState('100');
  const [packNotes, setPackNotes] = useState('Procured new batch');

  // Handle Login
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
        throw new Error(data.error || 'Authentication failed');
      }
      setToken(data.token);
      loadAllAdminData(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAdminData = async (authToken: string) => {
    try {
      // 1. Metrics
      const mRes = await fetch(`${API_BASE}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const mData = await mRes.json();
      if (mData.success) setMetrics(mData.data);

      // 2. Orders
      const oRes = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const oData = await oRes.json();
      if (oData.success) setOrders(oData.data);

      // 3. Riders
      const rRes = await fetch(`${API_BASE}/api/admin/riders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const rData = await rRes.json();
      if (rData.success) setRiders(rData.data);

      // 4. Packaging
      const pRes = await fetch(`${API_BASE}/api/packaging/types`);
      const pData = await pRes.json();
      if (pData.success) {
        setPackagingTypes(pData.data);
        if (pData.data.length > 0 && !selectedPackId) {
          setSelectedPackId(pData.data[0].id);
        }
      }

      const ptRes = await fetch(`${API_BASE}/api/packaging/transactions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const ptData = await ptRes.json();
      if (ptData.success) setPackTransactions(ptData.data);

      // 5. Settings
      const sRes = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const sData = await sRes.json();
      if (sData.success) setSettings(sData.data);

      // 6. Audit Logs
      const aRes = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const aData = await aRes.json();
      if (aData.success) setAuditLogs(aData.data);
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  };

  const handleUpdateRiderStatus = async (riderId: string, status: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/riders/${riderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        loadAllAdminData(token);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: parseInt(value, 10) }),
      });
      const data = await res.json();
      if (data.success) {
        loadAllAdminData(token);
        alert(`Setting '${key}' updated!`);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPackTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/packaging/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pack_type_id: selectedPackId,
          transaction_type: packTransType,
          quantity: parseInt(packQty, 10),
          notes: packNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPackModal(false);
        loadAllAdminData(token);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">EU Bite Operations</h1>
              <p className="text-xs text-slate-400">Campus Administration Portal</p>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
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
              {loading ? 'Authenticating...' : 'Sign In to Operations Control'}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-center text-slate-400">
            System Administrator Account Pre-filled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Apple macOS Frosted Top Admin Control Header */}
      <header className="bg-slate-950/95 backdrop-blur-xl text-white border-b border-slate-800/90 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              EB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold leading-tight text-white">EU Bite Operations</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Control Center
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Platform Fleet, Packaging Ledger & Audits</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="http://localhost:3000"
              className="hidden sm:inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ← Campus Home
            </a>

            <button
              onClick={() => loadAllAdminData(token)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              title="Refresh Operations Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setToken(null)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Apple-Style Segmented Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-16 sm:top-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-2 overflow-x-auto text-xs font-semibold">
          {[
            { key: 'metrics', label: 'Platform Health', icon: BarChart3 },
            { key: 'orders', label: 'Campus Orders', icon: ShoppingBag },
            { key: 'riders', label: 'Rider Fleet', icon: Bike },
            { key: 'packaging', label: 'Packaging Ledger', icon: Package },
            { key: 'settings', label: 'Fee Settings', icon: Settings },
            { key: 'audit', label: 'Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* 1. METRICS TAB */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Gross Merchandise Value (GMV)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ₦{(metrics?.financials?.total_gmv_ngn || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Verified paid volume
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Total Campus Orders</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {metrics?.orders?.total_orders || 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {metrics?.orders?.delivered_orders || 0} Delivered with PIN
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Active Riders Online</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {metrics?.riders?.active_online || 0} / {metrics?.riders?.total_registered || 0}
                </p>
                <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                  {metrics?.riders?.pending_approvals || 0} Pending approvals
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Packaging In Circulation</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {packagingTypes.reduce((a, b) => a + b.stock_count, 0)} units
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Reusable & School packs in stock</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Packaging Stock Allocation</h3>
                <div className="space-y-3">
                  {packagingTypes.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500">Fee: ₦{(p.fee_kobo / 100).toLocaleString()}</p>
                      </div>
                      <span className="font-mono text-sm font-black text-emerald-600">{p.stock_count} in stock</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Campus Order Pipeline</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <p className="font-semibold text-emerald-700">Delivered Meals</p>
                    <p className="text-xl font-black mt-1">{metrics?.orders?.delivered_orders || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <p className="font-semibold text-amber-700">In Preparation / Transit</p>
                    <p className="text-xl font-black mt-1">{metrics?.orders?.in_progress_orders || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Campus Orders Control Center</h3>
                <p className="text-xs text-slate-500">All student orders placed across WhatsApp and web.</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{orders.length} Total orders</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Restaurant</th>
                    <th className="pb-3">Hostel Drop</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Delivery PIN</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-900">{o.order_number}</td>
                      <td className="py-3 text-slate-800">{o.restaurant_name}</td>
                      <td className="py-3 text-slate-600">{o.hostel}, {o.room}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-black text-emerald-600">{o.delivery_pin}</td>
                      <td className="py-3 font-bold text-slate-900">₦{(o.total_amount_kobo / 100).toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.payment_status === 'successful'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. RIDERS TAB */}
        {activeTab === 'riders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rider Fleet Operations & Approvals</h3>
                <p className="text-xs text-slate-500">Vet student courier applications and manage active riders.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{r.full_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        r.approval_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.approval_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.approval_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Phone: {r.phone}</p>
                    <p>Vehicle: {r.vehicle_type} ({r.plate_number})</p>
                    <p>Status: <strong className={r.is_online ? 'text-emerald-600' : 'text-slate-400'}>{r.is_online ? 'ONLINE' : 'OFFLINE'}</strong></p>
                    <p>Deliveries: {r.total_deliveries} drops • Wallet: ₦{r.total_earnings_ngn.toLocaleString()}</p>
                  </div>

                  {/* Admin Approval Controls */}
                  <div className="pt-2 border-t border-slate-200 flex gap-2">
                    {r.approval_status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateRiderStatus(r.id, 'approved')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs"
                      >
                        Approve Rider
                      </button>
                    )}
                    {r.approval_status === 'approved' && (
                      <button
                        onClick={() => handleUpdateRiderStatus(r.id, 'suspended')}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 rounded-lg text-xs"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PACKAGING TAB */}
        {activeTab === 'packaging' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Food Packaging Inventory</h3>
                  <p className="text-xs text-slate-500">Track reusable eco-packs and school cafeteria containers.</p>
                </div>
                <button
                  onClick={() => setShowPackModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Record Pack Restock / Return
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {packagingTypes.map((pt) => (
                  <div key={pt.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {pt.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{pt.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Charge: ₦{(pt.fee_kobo / 100).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{pt.stock_count}</p>
                      <p className="text-[11px] text-slate-400">Available Stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pack Transactions History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Physical Pack Ledger & Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Quantity</th>
                      <th className="pb-2">Notes</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {packTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 font-bold uppercase text-slate-800">{tx.transaction_type}</td>
                        <td className="py-2.5 font-mono">{tx.quantity} units</td>
                        <td className="py-2.5 text-slate-600">{tx.notes || '—'}</td>
                        <td className="py-2.5 text-slate-400">{new Date(tx.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Configurable Campus Commercial Settings</h3>
              <p className="text-xs text-slate-500">Changes immediately apply across all future student orders.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {settings.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <p className="text-xs font-bold text-slate-900">{s.description || s.key}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      defaultValue={s.value_json}
                      id={`input-${s.key}`}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-300 w-full font-mono"
                    />
                    <button
                      onClick={() => {
                        const val = (document.getElementById(`input-${s.key}`) as HTMLInputElement)?.value;
                        handleUpdateSetting(s.key, val);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Stored in integer kobo (e.g. 150000 = ₦1,500)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Immutable Audit Logs Trail</h3>
              <p className="text-xs text-slate-500">Security event logging for all critical platform workflows.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Entity</th>
                    <th className="pb-2">Actor Role</th>
                    <th className="pb-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-emerald-800">{log.action}</td>
                      <td className="py-2.5 text-slate-700">{log.entity_type} ({log.entity_id?.slice(0, 8) || 'N/A'})</td>
                      <td className="py-2.5 text-slate-500">{log.actor_role || 'system'}</td>
                      <td className="py-2.5 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Packaging Transaction Modal */}
      {showPackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Record Packaging Event</h3>
            <form onSubmit={handleRecordPackTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Type</label>
                <select
                  value={selectedPackId}
                  onChange={(e) => setSelectedPackId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                >
                  {packagingTypes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_count})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={packTransType}
                  onChange={(e) => setPackTransType(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                >
                  <option value="restocked">Restocked / Procured (+ Stock)</option>
                  <option value="returned">Student Returned (+ Stock)</option>
                  <option value="damaged">Damaged Container (- Stock)</option>
                  <option value="lost">Lost / Unreturned (- Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={packQty}
                  onChange={(e) => setPackQty(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={packNotes}
                  onChange={(e) => setPackNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPackModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
