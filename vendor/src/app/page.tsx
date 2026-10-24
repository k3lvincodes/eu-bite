'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle,
  Plus,
  Power,
  TrendingUp,
  Package,
  AlertCircle,
  ChefHat,
  Bell,
  RefreshCw,
  LogOut,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';

export default function VendorDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('vendor.bites@eubite.com');
  const [password, setPassword] = useState('Password123!');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Menu Item State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Rice & Pastas');
  const [newItemPriceNgn, setNewItemPriceNgn] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

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
        throw new Error(data.error || 'Failed to login');
      }
      setToken(data.token);
      setRestaurant(data.profile);
      fetchRestaurantData(data.token, data.profile?.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantData = async (authToken: string, restId?: string) => {
    try {
      // 1. Fetch restaurant & menu
      if (restId) {
        const restRes = await fetch(`${API_BASE}/api/restaurants/${restId}`);
        const restData = await restRes.json();
        if (restData.success) {
          setRestaurant(restData.data);
          setMenuItems(restData.data.menuItems || []);
        }
      }

      // 2. Fetch orders
      const ordersRes = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.data || []);
      }
    } catch (err) {
      console.error('Error refreshing vendor data:', err);
    }
  };

  const toggleAcceptingOrders = async () => {
    if (!token || !restaurant) return;
    try {
      const updatedStatus = !restaurant.is_accepting_orders;
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_accepting_orders: updatedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRestaurant({ ...restaurant, is_accepting_orders: updatedStatus });
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/vendor-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRestaurantData(token, restaurant?.id);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleItemAvailability = async (itemId: string, currentAvailable: boolean) => {
    if (!token || !restaurant) return;
    try {
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurant.id}/menu/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: !currentAvailable }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, is_available: !currentAvailable } : i))
        );
      }
    } catch (err) {
      console.error('Menu toggle error:', err);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !restaurant) return;
    const priceNgn = parseFloat(newItemPriceNgn);
    if (!newItemName || isNaN(priceNgn) || priceNgn <= 0) {
      alert('Please enter a valid item name and price.');
    }

    try {
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurant.id}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          price_kobo: Math.round(priceNgn * 100),
          description: newItemDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewItemName('');
        setNewItemPriceNgn('');
        setNewItemDesc('');
        fetchRestaurantData(token, restaurant.id);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Vendor Portal</h1>
              <p className="text-xs text-slate-500">Manage kitchen, live orders & menus</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : 'Sign In to Kitchen Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <a href={LANDING_URL} className="hover:text-emerald-600 font-medium">← Back to Campus Home</a>
            <span>Pilot Seed Account Pre-filled</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate live sales
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const todayRevenueKobo = completedOrders.reduce((acc, o) => acc + o.food_subtotal_kobo, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Apple Frosted Glass Top Navigation Bar */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  {restaurant?.name || 'Kitchen Dashboard'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Kitchen Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Daily Active Hours: {restaurant?.opening_time || '8:00 AM'} - {restaurant?.closing_time || '10:30 PM'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Apple Pill Status Toggle */}
            <button
              onClick={toggleAcceptingOrders}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                restaurant?.is_accepting_orders
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs hover:bg-emerald-600'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${restaurant?.is_accepting_orders ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              <span>{restaurant?.is_accepting_orders ? 'Kitchen Open' : 'Kitchen Closed'}</span>
            </button>

            {/* Back to Campus Home Pill */}
            <a
              href={LANDING_URL}
              className="hidden sm:inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              ← Campus Home
            </a>

            <button
              onClick={() => fetchRestaurantData(token, restaurant?.id)}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Refresh Live Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setToken(null)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Today Food Sales</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₦{(todayRevenueKobo / 100).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{completedOrders.length} Completed orders today</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Live Active Orders</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {orders.filter((o) => ['paid', 'vendor_accepted', 'preparing'].includes(o.status)).length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Orders in cooking & packing stage</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Active Menu Items</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {menuItems.filter((i) => i.is_available).length} / {menuItems.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Available to campus students</p>
          </div>
        </div>

        {/* Live Incoming Paid Orders Stream */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Live Kitchen Queue</h3>
              <p className="text-xs text-slate-500">Only verified paid orders are delivered to this queue.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Live Feed
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No orders received yet today. Make sure your kitchen is set to Open!
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">#{order.order_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {order.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">• Drop-off: {order.hostel}, {order.room}</span>
                    </div>

                    <div className="text-xs text-slate-700">
                      {order.items?.map((it: any) => `${it.quantity}x ${it.item_name}`).join(', ')}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Food Subtotal: ₦{(order.food_subtotal_kobo / 100).toLocaleString()} • Packaging: {order.packaging_type_name || 'Standard'}
                    </div>
                  </div>

                  {/* Vendor Action Buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === 'paid' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'vendor_accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.status === 'vendor_accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        Start Preparing 🍳
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        Mark Ready for Rider 🛵
                      </button>
                    )}

                    {order.status === 'ready_for_pickup' && (
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                        Waiting for Rider Claim
                      </span>
                    )}

                    {order.status === 'rider_assigned' && (
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                        Rider En Route to Pickup
                      </span>
                    )}

                    {order.status === 'in_transit' && (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                        In Transit to Student
                      </span>
                    )}

                    {order.status === 'delivered' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Delivered
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu Management Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Menu Catalog</h3>
              <p className="text-xs text-slate-500">Add dishes, set prices (in ₦), and toggle availability.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {item.category}
                    </span>
                    <button
                      onClick={() => toggleItemAvailability(item.id, item.is_available)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.is_available
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-red-100 border-red-300 text-red-800'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{item.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">
                    ₦{(item.price_kobo / 100).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400">{item.preparation_time_mins || 15} mins prep</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Dish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add New Menu Dish</h3>
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Asun Fried Rice & Peppered Chicken"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Rice & Pastas">Rice & Pastas</option>
                  <option value="Swallows">Swallows</option>
                  <option value="Grills & Fast Food">Grills & Fast Food</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price in Naira (₦)</label>
                <input
                  type="number"
                  placeholder="2500"
                  value={newItemPriceNgn}
                  onChange={(e) => setNewItemPriceNgn(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="Delicious description of ingredients and portion..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
