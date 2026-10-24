'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  MessageSquare,
  ShieldCheck,
  Bike,
  Sparkles,
  ArrowRight,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Phone,
  Search,
  ExternalLink,
  ChevronDown,
  Star,
  Flame,
  Leaf,
  Layers,
  AlertCircle,
  HelpCircle,
  X,
  CreditCard,
  Send,
  Zap,
  RotateCcw,
  ChefHat,
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
  reviewCount: number;
  deliveryTime: string;
  tagline: string;
  isOpen: boolean;
  dishes: Dish[];
}

const campusRestaurants: Restaurant[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Campus Bites & Grill',
    category: 'Jollof, Shawarma & Fast Food',
    tagline: 'Campus favorite for fiery party jollof, juicy chicken & wraps',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    reviewCount: 342,
    deliveryTime: '15-22 mins',
    isOpen: true,
    dishes: [
      {
        id: 'd1',
        name: 'Smoky Party Jollof & Grilled Quarter Chicken',
        category: 'Rice & Pastas',
        priceNgn: 2200,
        prepTime: '15 mins',
        description: 'Authentic firewood-style jollof rice served with golden spiced quarter chicken, sweet fried plantains (dodo), and spicy coleslaw.',
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
        description: 'Warm pita wrap packed with shaved tender spiced beef, two grilled frankfurters, cabbage slaw, and creamy house chili garlic sauce.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=700&q=80',
        tag: 'Late Night Favorite',
      },
      {
        id: 'd3',
        name: 'Special Fried Rice & Crispy Peppered Turkey',
        category: 'Rice & Pastas',
        priceNgn: 2600,
        prepTime: '18 mins',
        description: 'Wok-tossed basmati fried rice with liver cubes, sweet corn, carrots, peas, and a deeply marinated peppered turkey wing.',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80',
        tag: 'Chef Special',
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Mama T’s Bukka Delight',
    category: 'Authentic Nigerian & Swallows',
    tagline: 'Generous traditional bukka bowls, pounded yam & rich egusi soup',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    reviewCount: 289,
    deliveryTime: '20-28 mins',
    isOpen: true,
    dishes: [
      {
        id: 'd4',
        name: 'Pounded Yam & Assorted Meat Egusi Soup',
        category: 'Swallows & Soups',
        priceNgn: 2400,
        prepTime: '20 mins',
        description: 'Silky smooth pounded yam served with melon seed soup loaded with spinach, stockfish flakes, cow tripe (shaki), and beef brisket.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
        tag: 'Comfort Food',
      },
      {
        id: 'd5',
        name: 'Amala Dudu with Gbegiri, Ewedu & Goat Meat',
        category: 'Swallows & Soups',
        priceNgn: 2500,
        prepTime: '20 mins',
        description: 'Authentic Oyo-style fluffy amala paired with yellow bean gbegiri, fresh green ewedu, and peppery tender goat meat.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80',
        tag: 'Traditional',
      },
      {
        id: 'd6',
        name: 'Hot Catfish Pepper Soup with Boiled Yam',
        category: 'Swallows & Soups',
        priceNgn: 2800,
        prepTime: '22 mins',
        description: 'Aromatic spicy broth brewed with calabash nutmeg, scent leaves, fresh catfish fillet, and tender white yam slices.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
        tag: 'Hostel Reviver',
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Student Chops & Grills Hub',
    category: 'Asun, Suya, Small Chops & Drinks',
    tagline: 'Charcoal grills, peppered small chops, mocktails & chilled hibiscus zobo',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    reviewCount: 415,
    deliveryTime: '12-18 mins',
    isOpen: true,
    dishes: [
      {
        id: 'd7',
        name: 'Peppered Goat Meat (Asun) Platter',
        category: 'Grills & Shawarma',
        priceNgn: 2000,
        prepTime: '12 mins',
        description: 'Smoky charcoal-grilled goat meat cuts tossed with habanero peppers, sweet onions, and bell pepper relish.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=700&q=80',
        tag: 'Spicy Favorite',
      },
      {
        id: 'd8',
        name: 'Campus Small Chops Box (12 Pieces)',
        category: 'Grills & Shawarma',
        priceNgn: 1600,
        prepTime: '10 mins',
        description: 'Fluffy golden puff-puffs, crispy samosas, spring rolls, and peppered gizzard skewer with dipping sauce.',
        popular: false,
        image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=700&q=80',
        tag: 'Study Snack',
      },
      {
        id: 'd9',
        name: 'Chilled Spiced Hibiscus Zobo (1 Litre Bottle)',
        category: 'Cold Drinks',
        priceNgn: 700,
        prepTime: '2 mins',
        description: 'Freshly brewed hibiscus tea infused with pineapple juice, crushed cloves, ginger, and citrus mint.',
        popular: true,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80',
        tag: 'Organic Drink',
      },
    ],
  },
];

const campusHostels = [
  { name: 'Hostel Block C (Female)', code: 'H-BLKC', eta: '14-18 mins', distance: '0.6 km' },
  { name: 'Hostel Block A (Male)', code: 'H-BLKA', eta: '12-16 mins', distance: '0.4 km' },
  { name: 'Hostel Block B (Male)', code: 'H-BLKB', eta: '13-17 mins', distance: '0.5 km' },
  { name: 'Hostel Block D (Female)', code: 'H-BLKD', eta: '15-19 mins', distance: '0.7 km' },
  { name: 'Postgraduate Hall (PG)', code: 'H-PG', eta: '17-22 mins', distance: '1.1 km' },
  { name: 'Medical Hostel Complex', code: 'H-MED', eta: '18-24 mins', distance: '1.4 km' },
  { name: 'New Campus Hall 2', code: 'H-HALL2', eta: '15-20 mins', distance: '0.8 km' },
];

const faqItems = [
  {
    question: 'How do I place an order without installing an app?',
    answer: 'Just click any "Order on WhatsApp" button or message +234 800 382 4837. Our verified bot will greet you, present today’s live menus, let you choose your hostel drop point, and guide you through a 60-second checkout.',
  },
  {
    question: 'How does the 4-digit Security PIN handoff work?',
    answer: 'When your payment is verified on Flutterwave, you receive a secret 4-digit delivery PIN in your WhatsApp chat. When the dispatch rider arrives at your hostel door or porter’s lodge, you share this PIN. The rider enters it on their terminal to unlock and complete the handoff. This eliminates wrong drops and disputes.',
  },
  {
    question: 'What is the circular Reusable Eco-Pack (₦250) vs Cafeteria Pack (₦500)?',
    answer: 'The Reusable Eco-Pack is our flagship initiative to eradicate single-use packaging from campus grounds. It’s an insulated, microwave-safe container that you can drop off at designated hostel bins when done. Dropping it off credits your student account with eco-points for discounted future deliveries.',
  },
  {
    question: 'What payment methods are supported on Flutterwave?',
    answer: 'We accept debit cards (Verve, Mastercard, Visa), instant bank transfers (with dedicated virtual accounts), and USSD. Payments are verified automatically and trigger kitchen order printing in under 2 seconds.',
  },
  {
    question: 'What happens if my hostel gate is locked after hours?',
    answer: 'Our campus dispatch team operates in partnership with campus security and hostel porters. Couriers are permitted entry until 10:30 PM. For late orders, riders call upon arrival at the hall porter lodge for a smooth handoff.',
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedHostel, setSelectedHostel] = useState(campusHostels[0]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [packagingChoice, setPackagingChoice] = useState<'reusable' | 'school'>('reusable');

  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  // Quick Tracking Search State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // WhatsApp Interactive Phone Simulator State
  const [simulatorStep, setSimulatorStep] = useState<1 | 2 | 3 | 4>(1);

  const categories = ['All', 'Rice & Pastas', 'Swallows & Soups', 'Grills & Shawarma', 'Cold Drinks'];

  // Filtered dishes across restaurants
  const allDishes = campusRestaurants.flatMap((r) =>
    r.dishes.map((d) => ({ ...d, restaurantName: r.name, restaurantId: r.id }))
  );

  const filteredDishes =
    selectedCategory === 'All'
      ? allDishes
      : allDishes.filter((d) => d.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  // Handle Quick Order Tracking
  const handleQuickTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingModalOpen(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/orders`);
      const data = await res.json();
      if (!data.success) throw new Error('Could not fetch active campus orders.');

      const cleanQuery = trackingInput.trim().toLowerCase();
      const match = data.data?.find(
        (o: any) =>
          o.order_number?.toLowerCase() === cleanQuery ||
          o.id?.toLowerCase() === cleanQuery ||
          o.delivery_pin === cleanQuery
      );

      if (!match) {
        throw new Error(`Order #${trackingInput.trim()} not found. Check your order number or 4-digit PIN.`);
      }
      setTrackedOrder(match);
    } catch (err: any) {
      setTrackingError(err.message || 'Unable to track order right now.');
      setTrackedOrder(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-emerald-500 selection:text-white relative flex flex-col">
      {/* 1. Global Campus Live Operations Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800 w-full">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-emerald-400 tracking-wide uppercase text-[11px]">
                Campus Dispatch Active
              </span>
              <span className="text-slate-600 hidden md:inline">•</span>
              <span className="text-slate-400 hidden md:inline">
                Hostel deliveries open daily 8:00 AM – 10:30 PM
              </span>
              <span className="text-slate-400">
                Avg Hand-off: <strong className="text-white">16 mins</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="hidden sm:inline">Flat Hostel Drop: <strong className="text-emerald-400">₦320</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>4-Digit Security PIN Handoffs</span>
              <span className="hidden lg:inline">•</span>
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setPortalMenuOpen(!portalMenuOpen)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Portals <ChevronDown className="w-3 h-3" />
                </button>
                {portalMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                    <a
                      href="http://localhost:3003"
                      className="block px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                    >
                      Vendor Kitchen Portal
                    </a>
                    <a
                      href="http://localhost:3001"
                      className="block px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                    >
                      Rider Courier Portal
                    </a>
                    <a
                      href="http://localhost:3002"
                      className="block px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                    >
                      Admin Operations Portal
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Apple Minimalist Frosted Header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
            {/* Minimalist Logo Mark */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  EU <span className="text-emerald-600">Bite</span>
                </span>
              </div>
            </Link>

            {/* Apple Centered Clean Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-semibold text-slate-600">
              <a href="#restaurants" className="hover:text-emerald-600 transition-colors">Kitchens</a>
              <a href="#menu-catalog" className="hover:text-emerald-600 transition-colors">Popular Menu</a>
              <a href="#15m-dispatch" className="hover:text-emerald-600 transition-colors">15m Dispatch</a>
              <a href="#packaging" className="hover:text-emerald-600 transition-colors">Eco-Packaging</a>
              <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
              <a href="#faq" className="hover:text-emerald-600 transition-colors">FAQ</a>
            </nav>

            {/* Right Tools: Search, WhatsApp Pill, Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setTrackingModalOpen(true)}
                className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Track Active Order or PIN"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Track</span>
              </button>

              <a
                href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xs hover:shadow-md transition-all duration-200"
                title="Order on WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp</span>
              </a>

              <a
                href="https://t.me/eubite_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xs hover:shadow-md transition-all duration-200"
                title="Order on Telegram"
              >
                <Send className="w-3 h-3 fill-current" />
                <span>Telegram</span>
              </a>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 rounded-full lg:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 text-sm font-semibold text-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
              <a
                href="#restaurants"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 hover:text-emerald-600"
              >
                Campus Kitchens
              </a>
              <a
                href="#menu-catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 hover:text-emerald-600"
              >
                Explore Menu
              </a>
              <a
                href="#15m-dispatch"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 hover:text-emerald-600"
              >
                15m Dispatch Radar
              </a>
              <a
                href="#packaging"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 hover:text-emerald-600"
              >
                Circular Eco-Packaging
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 hover:text-emerald-600"
              >
                How It Works
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 hover:text-emerald-600"
              >
                FAQ
              </a>
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <a
                  href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
                  className="flex-1 text-center py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://t.me/eubite_bot"
                  className="flex-1 text-center py-2.5 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          )}
        </header>
      {/* 3. Apple Keynote Modular Banners Hero Flow */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* ========================================================
              CARD 1: Apple "iPhone 17" Soft Light Keynote Banner
              ======================================================== */}
          <div className="rounded-[28px] sm:rounded-[36px] bg-[#f5f5f7] border border-slate-200/70 p-6 sm:p-10 lg:p-12 relative overflow-hidden">
            {/* Subtle frosted ambient glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column: Heading, Subtitle, Hostel ETA Selector & Pill Buttons */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    EU Bite 2.0 • Campus Dining
                  </span>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.06]">
                    Power in the Palm of your Hand.
                  </h1>
                  <p className="text-sm sm:text-lg text-slate-600 font-medium mt-3 max-w-lg leading-relaxed">
                    Hot meals prepared by verified campus kitchens, delivered straight to your hostel room via WhatsApp & Telegram. Zero app downloads needed.
                  </p>
                </div>

                {/* Apple Segmented Pill Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02]"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>WhatsApp Bot</span>
                  </a>

                  <a
                    href="https://t.me/eubite_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02]"
                  >
                    <Send className="w-4 h-4 fill-current" />
                    <span>Telegram Bot</span>
                  </a>

                  <a
                    href="#menu-catalog"
                    className="inline-flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-slate-800 font-semibold px-5 py-3 rounded-full text-xs sm:text-sm border border-slate-300/80 shadow-xs transition-all hover:border-slate-400"
                  >
                    <span>Discover Kitchens</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Campus Hostel Block ETA Selector Widget */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs max-w-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Hostel Dispatch Estimator
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      Active Fleet: 6 Couriers
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Your Hostel Block</label>
                      <select
                        value={selectedHostel.name}
                        onChange={(e) => {
                          const h = campusHostels.find((item) => item.name === e.target.value);
                          if (h) setSelectedHostel(h);
                        }}
                        className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {campusHostels.map((h) => (
                          <option key={h.code} value={h.name}>
                            {h.name} ({h.distance})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 bg-emerald-50/80 border border-emerald-100 rounded-xl p-2 flex flex-col justify-center text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Estimated Drop</span>
                      <span className="text-sm font-black text-emerald-950 mt-0.5">{selectedHostel.eta}</span>
                      <span className="text-[10px] text-emerald-700 font-medium">Flat ₦320 Delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sleek iPhone Simulator Canvas */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[340px]">
                  {/* iPhone Shell */}
                  <div className="relative bg-slate-950 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800/80 border border-slate-700/60">
                    {/* Dynamic Island */}
                    <div className="flex justify-center mb-2">
                      <div className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 border border-slate-800">
                        <Bike className="w-3 h-3 text-emerald-400" />
                        <span>Courier Musa • 4m away</span>
                      </div>
                    </div>

                    {/* Chat Canvas */}
                    <div className="bg-[#efeae2] rounded-[34px] overflow-hidden border border-slate-300 text-xs shadow-inner flex flex-col h-[460px]">
                      {/* WhatsApp Bar */}
                      <div className="bg-[#005d4b] text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs">
                            EB
                          </div>
                          <div>
                            <p className="font-bold text-xs leading-tight">EU Bite Bot 🍔</p>
                            <p className="text-[9px] text-emerald-200">Campus Food Service</p>
                          </div>
                        </div>
                        <Phone className="w-3.5 h-3.5 text-emerald-200" />
                      </div>

                      {/* Messages Feed */}
                      <div className="p-3 space-y-2 flex-1 overflow-y-auto font-sans">
                        <div className="bg-white rounded-2xl rounded-tl-sm p-2.5 shadow-xs max-w-[90%] text-slate-800 space-y-1">
                          <p className="font-bold text-emerald-800 text-[11px]">Welcome to EU Bite!</p>
                          <p className="text-[10px] text-slate-600">Which campus cafeteria would you like to order from?</p>
                          <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] font-mono space-y-0.5 text-slate-700">
                            <p>1. Campus Bites & Grill</p>
                            <p>2. Mama T’s Bukka Delight</p>
                            <p>3. Student Chops & Grills</p>
                          </div>
                        </div>

                        {simulatorStep >= 2 && (
                          <div className="bg-[#d9fdd3] ml-auto rounded-2xl rounded-tr-sm p-2 shadow-xs max-w-[50%] text-right text-slate-800 font-semibold text-[10px]">
                            1 (Campus Bites)
                          </div>
                        )}

                        {simulatorStep >= 2 && (
                          <div className="bg-white rounded-2xl rounded-tl-sm p-2.5 shadow-xs max-w-[90%] text-slate-800 space-y-1">
                            <p className="font-bold text-slate-900 text-[10px]">📋 Campus Bites & Grill:</p>
                            <p className="text-[10px]">1. Smoky Party Jollof & Chicken — ₦2,200</p>
                            <p className="text-[10px]">2. Jumbo Beef Shawarma — ₦1,800</p>
                            <p className="text-[9px] text-slate-500">Reply with meal number.</p>
                          </div>
                        )}

                        {simulatorStep >= 3 && (
                          <>
                            <div className="bg-[#d9fdd3] ml-auto rounded-2xl rounded-tr-sm p-2 shadow-xs max-w-[55%] text-right text-slate-800 font-semibold text-[10px]">
                              1 x1 + Reusable Pack
                            </div>

                            <div className="bg-white rounded-2xl rounded-tl-sm p-2.5 shadow-xs max-w-[95%] text-slate-800 border-l-4 border-emerald-500 space-y-1">
                              <p className="font-bold text-emerald-800 text-[10px]">Order Summary:</p>
                              <div className="text-[9px] space-y-0.5 text-slate-600">
                                <p className="flex justify-between"><span>🍲 Party Jollof & Chicken:</span> <strong>₦2,200</strong></p>
                                <p className="flex justify-between"><span>📦 Reusable Eco-Pack:</span> <strong>₦250</strong></p>
                                <p className="flex justify-between"><span>🛵 Hostel Drop ({selectedHostel.name.split(' ')[0]}):</span> <strong>₦320</strong></p>
                                <p className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                                  <span>Total:</span> <span className="text-emerald-700">₦2,770</span>
                                </p>
                              </div>

                              <div className="mt-1 bg-amber-50 border border-amber-200 p-1.5 rounded-xl text-[9px] text-amber-900">
                                <strong>Delivery PIN: 4819</strong>
                                <p className="text-amber-700 text-[8px]">Provide to courier at door.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Interactive Step Switcher */}
                      <div className="p-2 bg-white border-t border-slate-200 flex-shrink-0">
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => setSimulatorStep(1)}
                            className={`py-1 rounded-lg text-[9px] font-semibold transition-colors ${
                              simulatorStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            1. Select
                          </button>
                          <button
                            onClick={() => setSimulatorStep(2)}
                            className={`py-1 rounded-lg text-[9px] font-semibold transition-colors ${
                              simulatorStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            2. Menu
                          </button>
                          <button
                            onClick={() => setSimulatorStep(3)}
                            className={`py-1 rounded-lg text-[9px] font-semibold transition-colors ${
                              simulatorStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            3. Checkout
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 2: Apple "Watch Ultra 3" Sleek Dark Keynote Banner
              ======================================================== */}
          <div id="15m-dispatch" className="rounded-[28px] sm:rounded-[36px] bg-[#121614] border border-emerald-950 p-6 sm:p-10 lg:p-12 text-white relative overflow-hidden shadow-2xl">
            {/* Ambient Dark Emerald Backlight */}
            <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Atomic Delivery Engine</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                  Atomic 15-Minute Dispatch. <br />
                  <span className="text-emerald-400">It’s Never Been Better.</span>
                </h2>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                  Couriers are stationed directly on campus grounds. Deliveries are locked until your secret 4-digit PIN is entered into the rider’s terminal, eliminating misdeliveries and disputes completely.
                </p>

                {/* Apple Watch Ultra Style Specs Row */}
                <div className="pt-2 flex flex-wrap gap-4 text-xs">
                  <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Fee</span>
                    <strong className="text-emerald-400 text-base">₦320</strong>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Avg Hand-Off</span>
                    <strong className="text-white text-base">16 mins</strong>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification</span>
                    <strong className="text-emerald-400 text-base">4-Digit PIN</strong>
                  </div>
                </div>
              </div>

              {/* Center / Right: Live Dispatch Terminal Display & Pill CTA */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
                <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-5 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-white">Live Courier Radar</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px]">ACTIVE #EB-8492</span>
                  </div>

                  <div className="bg-black/60 rounded-2xl p-3 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Drop Destination</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{selectedHostel.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">ETA</p>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">{selectedHostel.eta}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-emerald-300 font-medium">Handoff Security PIN</p>
                    <p className="text-2xl font-mono font-black text-emerald-400 tracking-widest mt-0.5">8 • 4 • 9 • 2</p>
                    <p className="text-[9px] text-slate-400 mt-1">Unlock with courier upon physical delivery</p>
                  </div>
                </div>

                {/* Pill Button CTA */}
                <button
                  onClick={() => setTrackingModalOpen(true)}
                  className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-8 py-3 rounded-full text-xs sm:text-sm shadow-lg shadow-white/10 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Live Dispatch Radar
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 3: Cinematic Circular Eco-Packaging & Refundable Deposit
              (User explicitly requested Card 3)
              ======================================================== */}
          <div id="packaging" className="rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-emerald-950 via-[#0a1e16] to-slate-950 border border-emerald-500/25 p-6 sm:p-10 lg:p-12 text-white relative overflow-hidden shadow-2xl">
            {/* Cinematic Leaf & Glow Accent */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Circular Campus Mission</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white">
                  Circular Eco-Packaging. <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Zero Styrofoam. 100% Accountable.
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
                  We replaced harmful single-use styrofoam with durable, insulated polypropylene containers. Drop off your container at any designated hostel collection bin to receive your instant ₦250 deposit cashback credit.
                </p>

                {/* Value Highlights */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-emerald-500/30">
                    <span className="text-xs text-slate-400 block font-medium">Refundable Deposit</span>
                    <strong className="text-emerald-400 text-base font-black">₦250 / meal drop</strong>
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-medium">Hostel Drop Bins</span>
                    <strong className="text-white text-base font-bold">All 8 Blocks Covered</strong>
                  </div>
                </div>

                {/* Pill Action Buttons */}
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <a
                    href="#packaging-details"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3 rounded-full text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02]"
                  >
                    <Package className="w-4 h-4" />
                    <span>Eco Return Program</span>
                  </a>

                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-full text-xs sm:text-sm border border-white/20 transition-colors"
                  >
                    <span>Deposit Breakdown</span>
                  </a>
                </div>
              </div>

              {/* Right: Circular Bowl Visual Feature */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Flagship Container</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      BPA-Free
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Microwave & refrigerator safe with airtight locking seal</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Return at designated hall porter drop bins</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Instant ₦250 eco-points credited to student phone #</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-center">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Deposit Return Rate</span>
                    <p className="text-2xl font-black text-emerald-400 mt-0.5">96.4%</p>
                    <span className="text-[10px] text-slate-400">Keeps campus hostel blocks clean</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Verified Campus Kitchens Section (Apple TV Originals Style) */}
        <section id="restaurants" className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-emerald-600 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                <ChefHat className="w-4 h-4" />
                Verified Campus Vendors
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1.5 tracking-tight">
                Authorized Kitchens On Campus
              </h2>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Hygiene certified by student affairs. Every kitchen prepares food in real time with high standards and clean water.
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Kitchens Open: <strong>3 / 3</strong></span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {campusRestaurants.map((vendor) => (
              <div
                key={vendor.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 flex flex-col"
              >
                {/* Vendor Cover Image */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Status Overlay */}
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Open Now
                  </div>

                  <div className="absolute top-3.5 right-3.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {vendor.rating}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {vendor.deliveryTime}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {vendor.name}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">{vendor.category}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{vendor.tagline}</p>

                    {/* Featured Dish Box */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Student Favorite</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{vendor.dishes[0].name}</p>
                      <p className="text-xs font-black text-emerald-700 mt-0.5">₦{vendor.dishes[0].priceNgn.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setSelectedDish(vendor.dishes[0])}
                      className="flex-1 text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    >
                      View Details
                    </button>
                    <a
                      href={`https://wa.me/2348003824837?text=Hi%20EU%20Bite%2C%20I%20want%20to%20order%20from%20${encodeURIComponent(vendor.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Interactive Live Menu Catalog Explorer (Google Material & Apple UI) */}
      <section id="menu-catalog" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-10">
            <span className="text-emerald-600 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Hot Food Catalog
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Explore Today’s Campus Menu
            </h2>
            <p className="text-slate-500 text-sm">
              All dishes strictly meet our campus freshness standard. Click any dish to view ingredients or order instantly on WhatsApp.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dishes Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Dish Image */}
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-3 bg-slate-100">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      {dish.tag}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-800">
                      ⏱ {dish.prepTime}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-emerald-700">{dish.restaurantName}</span>
                    <span>{dish.category}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {dish.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Portion Price</span>
                    <span className="text-lg font-black text-slate-950">₦{dish.priceNgn.toLocaleString()}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-3 py-1.5 rounded-xl transition-colors">
                    Order <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Apple-Grade Sustainable Packaging Section */}
      <section id="packaging-details" className="py-24 bg-slate-950 text-white relative overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Circular Campus Mission
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Zero Styrofoam. 100% Accountable.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We eliminated toxic single-use styrofoam packs from university hostels. Choose durable circular containers or official cafeteria sanitary packs with full inventory reconciliation.
            </p>
          </div>

          {/* Side by Side Comparative Architecture */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Reusable Eco-Pack */}
            <div className="bg-slate-900/90 rounded-3xl p-8 border border-emerald-500/30 shadow-2xl flex flex-col justify-between hover:border-emerald-400 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Recommended Choice
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold">EU Bite Circular Eco-Pack</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Insulated, heavy-duty BPA-free polypropylene designed for circular hostel dining.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Packaging Deposit</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-emerald-400">₦250</span>
                    <span className="text-xs text-slate-400">/ meal drop</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-1">
                    Earns eco-credits when deposited at any hostel drop bin.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Return at designated hostel porter collection boxes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Microwave & refrigerator safe with leak-proof seal</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Keeps hostel gutters, corridors, and rooms clean</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Hostel Return Bins:</span>
                  <span className="text-emerald-400 font-bold">All 8 Hostels Covered</span>
                </div>
              </div>
            </div>

            {/* School Cafeteria Pack */}
            <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                    Standard Pack
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold">Official Cafeteria Pack</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Institutional takeaway container certified for food handler hygiene protocols.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Packaging Fee</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-white">₦500</span>
                    <span className="text-xs text-slate-400">/ takeaway pack</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tamper-evident physical container for single-use cafeteria pickup.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Tamper-proof heat-sealed meal containment</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Approved for university canteen takeout protocols</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Reconciled on central administrative inventory ledger</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Inventory Accounting:</span>
                  <span className="text-slate-300 font-bold">Tracked by Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How EU Bite Works (4 Steps) */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-600 text-xs font-bold tracking-wider uppercase">Frictionless Dining</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              How EU Bite Works in 4 Steps
            </h2>
            <p className="text-slate-500 text-sm mt-1">No complicated apps. Your hostel food arrives with zero hassle.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 hover:shadow-lg transition-all relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Chat on WhatsApp</h4>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Send &quot;Hi&quot; to our WhatsApp bot. Pick a restaurant and customize your items. Min food subtotal is ₦1,500.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 hover:shadow-lg transition-all relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Select Pack & Pay</h4>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Choose Reusable (₦250) or Cafeteria Pack (₦500). Pay instantly via Flutterwave card or bank transfer.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 hover:shadow-lg transition-all relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Get 4-Digit PIN</h4>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Payment generates a secret PIN in your WhatsApp chat. The kitchen prepares your food while a courier claims the order.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 hover:shadow-lg transition-all relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-lg mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">Hostel Drop & Unlock</h4>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                The courier arrives at your hostel door, enters your 4-digit PIN to verify the drop, and hands you your hot meal!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-emerald-600 text-xs font-bold tracking-wider uppercase">Answers</span>
            <h2 className="text-3xl font-extrabold text-slate-950 mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      activeFaq === index ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Apple Multi-Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-16 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-900">EU Bite</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              Official campus food ordering, delivery, and sustainable circular packaging network for campus residential hostels.
            </p>
            <p className="text-[11px] text-slate-400">Licensed Campus Operator • Nigeria</p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3 text-sm">Platform Applications</h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#restaurants" className="hover:text-emerald-600 transition-colors">
                  Student Campus Menu
                </a>
              </li>
              <li>
                <Link href="/track" className="hover:text-emerald-600 transition-colors">
                  Live Order Tracker
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:3003"
                  className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-semibold text-emerald-700"
                >
                  Vendor Kitchen Portal (Port 3003) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:3001"
                  className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  Rider Dispatch Portal (Port 3001) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:3002"
                  className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                >
                  Administrative Center (Port 3002) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3 text-sm">Campus Business Rules</h5>
            <ul className="space-y-2 text-slate-500 text-xs">
              <li>Minimum food subtotal: <strong>₦1,500</strong></li>
              <li>Flat hostel courier fee: <strong>₦320</strong></li>
              <li>Reusable eco-pack fee: <strong>₦250</strong></li>
              <li>Official cafeteria pack: <strong>₦500</strong></li>
              <li>Courier base payout: <strong>₦250 / drop</strong></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3 text-sm">Campus Support Desk</h5>
            <p className="text-slate-500 text-xs">Hostel Help Desk: 8:00 AM - 10:30 PM</p>
            <p className="text-slate-800 font-bold mt-2 text-xs">support@eubite.com</p>
            <p className="text-slate-800 font-bold text-xs">+234 800 382 4837 (EU-BITE)</p>
            <div className="mt-4">
              <a
                href="https://wa.me/2348003824837?text=Hi%20EU%20Bite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-emerald-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat with Support</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
          <p>© {new Date().getFullYear()} EU Bite Technologies. All rights reserved.</p>
          <p>Designed with Apple & Google grade design system standards for campus delivery.</p>
        </div>
      </footer>

      {/* Dish Detail Bottom Sheet / Modal */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-60 w-full bg-slate-100">
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedDish(null)}
                className="absolute top-3.5 right-3.5 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800">
                ⏱ {selectedDish.prepTime} average prep
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{selectedDish.category}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedDish.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedDish.description}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Price</span>
                  <p className="text-2xl font-black text-slate-950">₦{selectedDish.priceNgn.toLocaleString()}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p>Includes standard portion</p>
                  <p className="text-emerald-700 font-semibold">+ ₦250 Reusable Eco-Pack</p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setSelectedDish(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-xs transition-colors"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/2348003824837?text=Hi%20EU%20Bite%2C%20I%20want%20to%20order%20${encodeURIComponent(selectedDish.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Order Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Campus Order Tracker</h3>
                  <p className="text-[11px] text-slate-500">Real-time status, courier dispatch & security PIN</p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickTrack} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Order # (e.g. EB-84920) or PIN..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {trackingLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {trackingError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}

            {trackedOrder && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">#{trackedOrder.order_number}</span>
                    <p className="text-[11px] text-slate-500">
                      Drop-off: <strong>{trackedOrder.hostel || 'Hostel Block C'}</strong> (Room {trackedOrder.room || '214'})
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    {trackedOrder.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                  <p className="font-semibold text-slate-800">Order Items:</p>
                  <p className="text-slate-600">
                    {trackedOrder.items?.map((it: any) => `${it.quantity}x ${it.item_name}`).join(', ') || 'Campus Meal Set'}
                  </p>
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Total Paid: <strong>₦{((trackedOrder.total_amount_kobo || 277000) / 100).toLocaleString()}</strong></span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      PIN: {trackedOrder.delivery_pin || '****'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <Link
                    href={`/track?orderNumber=${trackedOrder.order_number}`}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                  >
                    Open Full Tracking Screen →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
