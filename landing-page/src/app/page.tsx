'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  MessageSquare,
  ShieldCheck,
  Bike,
  ArrowRight,
  Package,
  Clock,
  MapPin,
  ChevronRight,
  Search,
  ExternalLink,
  ChevronDown,
  Star,
  Leaf,
  AlertCircle,
  X,
  Send,
  Menu,
} from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  category: string;
  priceNgn: number;
  prepTime: string;
  description: string;
  popular?: boolean;
  image: string;
  tag: string;
}

interface Restaurant {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  deliveryTime: string;
  tagline: string;
  dishes: Dish[];
}

const campusRestaurants: Restaurant[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Campus Bites & Grill',
    category: 'Jollof, Shawarma & Fast Food',
    tagline: 'Smoky party jollof, juicy quarter chicken & late-night wraps.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    deliveryTime: '15–20 mins',
    dishes: [
      {
        id: 'd1',
        name: 'Smoky Party Jollof & Grilled Chicken',
        category: 'Rice & Pastas',
        priceNgn: 2200,
        prepTime: '15 mins',
        description: 'Firewood-style jollof rice served with golden spiced quarter chicken, fried plantains, and coleslaw.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=700&q=80',
        tag: 'Bestseller',
      },
      {
        id: 'd2',
        name: 'Double-Sausage Jumbo Beef Shawarma',
        category: 'Grills & Shawarma',
        priceNgn: 1800,
        prepTime: '10 mins',
        description: 'Warm pita wrap packed with spiced beef strips, two grilled sausages, cabbage slaw, and house garlic sauce.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=700&q=80',
        tag: 'Student Pick',
      },
      {
        id: 'd3',
        name: 'Special Fried Rice & Peppered Turkey',
        category: 'Rice & Pastas',
        priceNgn: 2600,
        prepTime: '18 mins',
        description: 'Wok-tossed basmati fried rice with sweet corn, carrots, and a deeply marinated peppered turkey wing.',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80',
        tag: 'Chef Special',
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Mama T’s Bukka Delight',
    category: 'Traditional Swallows & Soups',
    tagline: 'Generous traditional bowls, pounded yam & rich egusi soup.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    deliveryTime: '18–25 mins',
    dishes: [
      {
        id: 'd4',
        name: 'Pounded Yam & Assorted Egusi Soup',
        category: 'Swallows & Soups',
        priceNgn: 2400,
        prepTime: '20 mins',
        description: 'Smooth pounded yam served with rich melon seed soup loaded with spinach, stockfish, and beef.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
        tag: 'Comfort Bowl',
      },
      {
        id: 'd5',
        name: 'Amala Dudu, Gbegiri, Ewedu & Goat Meat',
        category: 'Swallows & Soups',
        priceNgn: 2500,
        prepTime: '20 mins',
        description: 'Fluffy Oyo-style amala paired with gbegiri, ewedu, and peppery tender goat meat.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80',
        tag: 'Traditional',
      },
      {
        id: 'd6',
        name: 'Catfish Pepper Soup & Boiled Yam',
        category: 'Swallows & Soups',
        priceNgn: 2800,
        prepTime: '22 mins',
        description: 'Aromatic spicy broth brewed with scent leaves, fresh catfish steak, and tender white yam.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
        tag: 'Evening Special',
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Student Chops & Grills Hub',
    category: 'Asun, Small Chops & Drinks',
    tagline: 'Charcoal grills, peppered small chops & chilled hibiscus zobo.',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    deliveryTime: '12–18 mins',
    dishes: [
      {
        id: 'd7',
        name: 'Peppered Goat Meat (Asun) Platter',
        category: 'Grills & Shawarma',
        priceNgn: 2000,
        prepTime: '12 mins',
        description: 'Smoky charcoal-grilled goat meat cuts tossed with habanero peppers and sweet onions.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=700&q=80',
        tag: 'Spicy Grill',
      },
      {
        id: 'd8',
        name: 'Campus Small Chops Box (12 Pcs)',
        category: 'Grills & Shawarma',
        priceNgn: 1600,
        prepTime: '10 mins',
        description: 'Golden puff-puffs, crispy samosas, spring rolls, and peppered gizzard skewer.',
        image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=700&q=80',
        tag: 'Study Snack',
      },
      {
        id: 'd9',
        name: 'Chilled Pineapple Hibiscus Zobo (1L)',
        category: 'Cold Drinks',
        priceNgn: 700,
        prepTime: '2 mins',
        description: 'Freshly brewed hibiscus drink infused with sweet pineapple, ginger, and mint.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80',
        tag: 'Chilled',
      },
    ],
  },
];

const faqItems = [
  {
    question: 'How do I order without downloading an app?',
    answer:
      'Tap "Order on WhatsApp" or "Order on Telegram". Our campus bot displays live kitchen menus, lets you pick your hostel block, and shows your Wema Bank (ALATPay) transfer details directly inside the chat.',
  },
  {
    question: 'How does in-chat payment & the 4-digit PIN work?',
    answer:
      'At checkout, the bot displays a dedicated Wema Bank (ALATPay) account number right in your chat. Once you transfer and tap "I Have Paid", your 4-digit Delivery PIN is unlocked immediately. Share this PIN with the rider at your hostel door to complete delivery.',
  },
  {
    question: 'How does the Reusable Eco-Pack (₦250) work?',
    answer:
      'Choose the Reusable Eco-Pack (₦250) instead of a single-use pack (₦500). After your meal, drop the container at your hostel porter bin to keep campus clean and earn eco-credits.',
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedDish, setSelectedDish] = useState<(Dish & { restaurantName?: string }) | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Order Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const categories = ['All', 'Rice & Pastas', 'Swallows & Soups', 'Grills & Shawarma', 'Cold Drinks'];

  const allDishes = campusRestaurants.flatMap((r) =>
    r.dishes.map((d) => ({ ...d, restaurantName: r.name, restaurantId: r.id }))
  );

  const filteredDishes =
    selectedCategory === 'All'
      ? allDishes
      : allDishes.filter((d) => d.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const handleQuickTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const cleanQuery = trackingInput.trim();
      const res = await fetch(`${apiBase}/api/orders/track/${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || `Order #${cleanQuery} not found.`);
      }
      setTrackedOrder(data.data);
    } catch (err: any) {
      setTrackingError(err.message || 'Unable to track order right now.');
      setTrackedOrder(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#272D2F] flex flex-col">
      {/* Minimal Sticky Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#D7D7D7]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FE724C] flex items-center justify-center text-white shadow-sm">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#272D2F]">
              EU <span className="text-[#FE724C]">Bite</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#272D2F]/80">
            <a href="#how-it-works" className="hover:text-[#FE724C] transition-colors">How It Works</a>
            <a href="#kitchens" className="hover:text-[#FE724C] transition-colors">Kitchens</a>
            <a href="#menu" className="hover:text-[#FE724C] transition-colors">Menu</a>
            <a href="#faq" className="hover:text-[#FE724C] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTrackingModalOpen(true)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-[#272D2F] bg-[#FAFAFA] hover:bg-[#D7D7D7]/40 border border-[#D7D7D7] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#FE724C]" />
              <span>Track Order</span>
            </button>

            <a
              href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-[#FE724C] hover:bg-[#e55a35] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>Order Now</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#272D2F] rounded-xl md:hidden"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#D7D7D7] px-6 py-5 space-y-3 text-sm font-bold">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1">How It Works</a>
            <a href="#kitchens" onClick={() => setMobileMenuOpen(false)} className="block py-1">Campus Kitchens</a>
            <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="block py-1">Popular Menu</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1">FAQ</a>
            <div className="pt-3 flex gap-2">
              <a
                href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
                className="flex-1 text-center py-2.5 rounded-full bg-[#FE724C] text-white text-xs font-bold"
              >
                WhatsApp Bot
              </a>
              <a
                href="https://t.me/eubite_bot"
                className="flex-1 text-center py-2.5 rounded-full bg-[#FFC529] text-[#272D2F] text-xs font-bold"
              >
                Telegram Bot
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Clean Focused Hero Section */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-6xl font-black text-[#272D2F] tracking-tight leading-[1.08]">
              Hot campus meals, straight to your <span className="text-[#FE724C]">hostel door.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#272D2F]/70 max-w-xl leading-relaxed font-normal">
              Order from verified campus kitchens directly inside WhatsApp or Telegram. Pay via instant in-chat ALATPay transfer and unlock your delivery with a 4-digit security PIN.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#FE724C] hover:bg-[#e55a35] text-white font-bold px-7 py-4 rounded-full text-sm shadow-lg shadow-[#FE724C]/25 transition-all hover:-translate-y-0.5"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Order on WhatsApp</span>
              </a>

              <a
                href="https://t.me/eubite_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#272D2F] hover:bg-[#FE724C] text-white font-bold px-7 py-4 rounded-full text-sm transition-all hover:-translate-y-0.5"
              >
                <Send className="w-4 h-4 fill-current text-[#FFC529]" />
                <span>Order on Telegram</span>
              </a>
            </div>

            {/* Clean Key Metrics Strip */}
            <div className="pt-6 grid grid-cols-3 gap-4 max-w-md border-t border-[#D7D7D7]/70">
              <div>
                <p className="text-xl font-black text-[#272D2F]">16 mins</p>
                <p className="text-xs text-[#272D2F]/60">Avg. hostel drop</p>
              </div>
              <div>
                <p className="text-xl font-black text-[#FE724C]">₦320</p>
                <p className="text-xs text-[#272D2F]/60">Flat delivery fee</p>
              </div>
              <div>
                <p className="text-xl font-black text-[#272D2F]">4-Digit PIN</p>
                <p className="text-xs text-[#272D2F]/60">Verified handoff</p>
              </div>
            </div>
          </div>

          {/* Right Minimal Visual Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#272D2F] rounded-[32px] p-6 sm:p-8 text-white shadow-2xl border border-[#D7D7D7]/20 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFC529] text-[#272D2F] font-black flex items-center justify-center text-sm">
                    EB
                  </div>
                  <div>
                    <p className="font-bold text-sm">EU Bite Bot</p>
                    <p className="text-xs text-[#FFC529]">Instant In-Chat Checkout</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/10 text-[#FFC529]">
                  Live Bot
                </span>
              </div>

              {/* Clean 3-Bubble Chat Preview */}
              <div className="space-y-3 text-xs">
                <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3.5 text-white/90">
                  <p className="font-bold text-[#FFC529] mb-1">1. Pick Your Meal</p>
                  <p>Smoky Party Jollof & Grilled Chicken (₦2,200) + Reusable Eco-Pack (₦250)</p>
                </div>

                <div className="bg-white/10 rounded-2xl rounded-tl-sm p-3.5 text-white/90 border-l-4 border-[#FE724C]">
                  <p className="font-bold text-[#FE724C] mb-1">2. In-Chat Bank Transfer (ALATPay)</p>
                  <p className="text-white/80">Wema Bank • <strong className="text-white">7820114821</strong></p>
                  <p className="text-white/80 mt-0.5">Total: <strong className="text-[#FFC529]">₦2,870</strong> — Tap <em>&quot;I Have Paid&quot;</em> in chat</p>
                </div>

                <div className="bg-[#FFC529] text-[#272D2F] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">3. Delivery PIN Unlocked</p>
                    <p className="text-xs font-semibold mt-0.5">Give code to rider at Hostel Block C</p>
                  </div>
                  <span className="text-xl font-black tracking-widest bg-[#272D2F] text-[#FFC529] px-3 py-1.5 rounded-xl">
                    4819
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Streamlined 3-Pillar Value Bar */}
      <section id="how-it-works" className="bg-white border-y border-[#D7D7D7]/60 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FE724C]">Simple & Accountable</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#272D2F] mt-1">
              Designed for Campus Life
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#FAFAFA] border border-[#D7D7D7]/70 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FE724C]/15 text-[#FE724C] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#272D2F]">1. Order & Pay in Chat</h3>
              <p className="text-xs text-[#272D2F]/70 leading-relaxed">
                Browse menus on WhatsApp or Telegram. Receive your Wema Bank (ALATPay) transfer details right inside the chat and tap <strong>I Have Paid</strong>.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFAFA] border border-[#D7D7D7]/70 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFC529]/30 text-[#272D2F] flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#272D2F]">2. Circular Eco-Packaging</h3>
              <p className="text-xs text-[#272D2F]/70 leading-relaxed">
                Choose a Reusable Eco-Pack (₦250) or Standard Pack (₦500). Return reusable containers at hostel bins for refundable deposit credits.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAFAFA] border border-[#D7D7D7]/70 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#272D2F] text-[#FFC529] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#272D2F]">3. 4-Digit PIN Handoff</h3>
              <p className="text-xs text-[#272D2F]/70 leading-relaxed">
                Every paid order generates a secret 4-digit PIN. The courier enters your PIN at your hostel door or porter’s lodge to complete delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Campus Kitchens */}
      <section id="kitchens" className="py-16 sm:py-20 max-w-6xl mx-auto w-full px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#FE724C]">Verified Vendors</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#272D2F] mt-1">
              Campus Kitchens Open Now
            </h2>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FFC529]/30 text-[#272D2F] w-fit">
            3 Kitchens Accepting Orders
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {campusRestaurants.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#D7D7D7] hover:border-[#FE724C] transition-all shadow-xs hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-[#272D2F]">
                  <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-[#272D2F]/90 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#FFC529]" />
                    <span>{vendor.deliveryTime}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-[#FFC529] text-[#272D2F] px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-[11px] font-bold text-[#FE724C] uppercase tracking-wider">{vendor.category}</p>
                  <h3 className="text-lg font-black text-[#272D2F] mt-1">{vendor.name}</h3>
                  <p className="text-xs text-[#272D2F]/70 mt-1.5 leading-relaxed">{vendor.tagline}</p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <a
                  href={`https://wa.me/2348003824837?text=Hi%20EU%20Bite%2C%20I%20want%20to%20order%20from%20${encodeURIComponent(vendor.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#272D2F] hover:bg-[#FE724C] text-white text-xs font-bold py-3 rounded-2xl transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Order from {vendor.name.split(' ')[0]}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Menu Explorer */}
      <section id="menu" className="py-16 sm:py-20 bg-white border-t border-[#D7D7D7]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FE724C]">Popular Dishes</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#272D2F] mt-1">
                Today’s Campus Menu
              </h2>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#FE724C] text-white shadow-xs'
                      : 'bg-[#FAFAFA] text-[#272D2F]/70 hover:bg-[#D7D7D7]/40 border border-[#D7D7D7]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group bg-[#FAFAFA] rounded-3xl p-4 border border-[#D7D7D7]/80 hover:border-[#FE724C] transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-[#272D2F] mb-3.5">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#272D2F]/90 text-[#FFC529] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      {dish.tag}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 bg-white/95 text-[#272D2F] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {dish.prepTime}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-[#FE724C]">{dish.restaurantName}</p>
                  <h4 className="text-base font-bold text-[#272D2F] mt-0.5 line-clamp-1">{dish.name}</h4>
                  <p className="text-xs text-[#272D2F]/70 mt-1 line-clamp-2 leading-relaxed">{dish.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#D7D7D7]/60 flex items-center justify-between">
                  <span className="text-lg font-black text-[#272D2F]">₦{dish.priceNgn.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FE724C] group-hover:translate-x-0.5 transition-transform">
                    Order <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Concise FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 max-w-3xl mx-auto w-full px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FE724C]">Quick Answers</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#272D2F] mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl border border-[#D7D7D7] overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full text-left px-6 py-4 flex items-center justify-between text-sm font-bold text-[#272D2F] cursor-pointer"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#FE724C] transition-transform ${
                    activeFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeFaq === index && (
                <div className="px-6 pb-4 text-xs text-[#272D2F]/75 leading-relaxed border-t border-[#D7D7D7]/50 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="bg-[#272D2F] text-white py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FE724C] flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-black">EU Bite</span>
            </div>
            <p className="text-xs text-[#D7D7D7]/80 max-w-sm">
              WhatsApp & Telegram campus food delivery with circular eco-packaging and 4-digit PIN handoffs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-bold">
            <a
              href="http://localhost:3003"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#FE724C] text-white transition-colors flex items-center gap-1.5"
            >
              <span>Vendor Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:3001"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#FE724C] text-white transition-colors flex items-center gap-1.5"
            >
              <span>Rider Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:3002"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-[#FE724C] text-white transition-colors flex items-center gap-1.5"
            >
              <span>Admin Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#D7D7D7]/60 gap-2">
          <p>© {new Date().getFullYear()} EU Bite Technologies. All rights reserved.</p>
          <p>Support: +234 800 382 4837 • 8:00 AM – 10:30 PM Daily</p>
        </div>
      </footer>

      {/* Dish Modal */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 bg-[#272D2F]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#D7D7D7]">
            <div className="relative h-56 bg-[#272D2F]">
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedDish(null)}
                className="absolute top-3 right-3 bg-[#272D2F]/80 text-white p-2 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#FE724C] uppercase">{selectedDish.restaurantName}</span>
                <h3 className="text-xl font-black text-[#272D2F] mt-0.5">{selectedDish.name}</h3>
                <p className="text-xs text-[#272D2F]/75 mt-2 leading-relaxed">{selectedDish.description}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#D7D7D7] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#272D2F]/60">Portion Price</span>
                  <p className="text-2xl font-black text-[#272D2F]">₦{selectedDish.priceNgn.toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold text-[#272D2F] bg-[#FFC529]/30 px-3 py-1 rounded-full">
                  ⏱ {selectedDish.prepTime}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  href={`https://wa.me/2348003824837?text=Hi%20EU%20Bite%2C%20I%20want%20to%20order%20${encodeURIComponent(selectedDish.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#FE724C] hover:bg-[#e55a35] text-white font-bold py-3 rounded-2xl text-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://t.me/eubite_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#272D2F] hover:bg-[#FE724C] text-white font-bold py-3 rounded-2xl text-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5 fill-current text-[#FFC529]" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#272D2F]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D7D7D7] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7D7D7]/60">
              <div>
                <h3 className="text-base font-black text-[#272D2F]">Track Campus Order</h3>
                <p className="text-xs text-[#272D2F]/60">Enter your order number or 4-digit PIN</p>
              </div>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="p-1.5 text-[#272D2F]/60 hover:text-[#272D2F] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickTrack} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. EUB-202611-1024"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="flex-1 text-xs px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#D7D7D7] focus:outline-none focus:border-[#FE724C] font-semibold"
                required
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="bg-[#FE724C] hover:bg-[#e55a35] text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer"
              >
                {trackingLoading ? '...' : 'Track'}
              </button>
            </form>

            {trackingError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}

            {trackedOrder && (
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#D7D7D7] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#272D2F] text-sm">#{trackedOrder.order_number}</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#FFC529] text-[#272D2F] uppercase text-[10px]">
                    {trackedOrder.status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[#272D2F]/75">
                  Drop-off: <strong>{trackedOrder.hostel}</strong>, {trackedOrder.room}
                </p>
                <div className="pt-2 border-t border-[#D7D7D7]/60 flex items-center justify-between">
                  <span>Total: <strong>₦{((trackedOrder.total_amount_kobo || 0) / 100).toLocaleString()}</strong></span>
                  <span className="font-black text-[#FE724C]">PIN: {trackedOrder.delivery_pin || '****'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
