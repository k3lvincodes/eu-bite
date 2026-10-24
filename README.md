# EU Bite — Campus Food Ordering & Delivery Platform

**EU Bite** is a production-grade, WhatsApp-first campus food ordering and delivery ecosystem built specifically for Nigerian university campuses. It brings canteen takeouts directly to student hostel rooms, featuring atomic delivery dispatch, secure 4-digit delivery PIN handoff verification, sustainable circular food packaging, and instant Flutterwave payments.

---

## 1. Architecture Overview

The system strictly adheres to a centralized single-source-of-truth backend architecture:

```
                  ┌────────────────────────────────────────┐
                  │        Meta WhatsApp Cloud API         │
                  └──────────────────┬─────────────────────┘
                                     │ Webhook Inbound / Outbound
                                     ▼
┌──────────────────┐          ┌──────────────┐          ┌──────────────────┐
│   Landing Page   │          │ WhatsApp Bot │          │   Rider Portal   │
│ (Web / Vendor)   │          │   Service    │          │  (PWA / Mobile)  │
│   (Port 3000)    │          │ (Port 4001)  │          │   (Port 3001)    │
└────────┬─────────┘          └──────┬───────┘          └────────┬─────────┘
         │                           │                           │
         │ Authenticated REST        │ Service-Token Bridge      │ Authenticated REST
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                  ┌──────────────────────────────────────┐
                  │        EU Bite Central Server        │
                  │        (Node.js / Express / TS)      │
                  │             (Port 4000)              │
                  └──────────────────┬───────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │   Supabase PostgreSQL   │             │  Flutterwave Gateway    │
    │   Database with RLS     │             │  Payments & Webhooks    │
    └─────────────────────────┘             └─────────────────────────┘
```

---

## 2. Directory Structure

The repository contains six isolated application folders, each with its own package configuration, dependencies, and environment setup:

| Folder | Application Description | Tech Stack | Port |
|---|---|---|---|
| [`/server`](file:///server) | Central Node.js, Express, TypeScript API and core business logic | Node.js, Express, TypeScript, Supabase PostgreSQL, Zod | `4000` |
| [`/bot`](file:///bot) | WhatsApp Cloud API webhook receiver and conversational ordering state machine | Node.js, Express, TypeScript, Meta Graph API | `4001` |
| [`/landing-page`](file:///landing-page) | Public campus landing page and live order tracking | Next.js 14, React 18, Tailwind CSS, Inter Font | `3000` |
| [`/vendor`](file:///vendor) | Dedicated kitchen operations portal, live order queue, menu catalog & stock controls | Next.js 14, React 18, Tailwind CSS, Inter Font | `3003` |
| [`/rider`](file:///rider) | Mobile-first rider dispatch portal, atomic order claiming, and PIN verification | Next.js 14, React 18, Tailwind CSS, Inter Font | `3001` |
| [`/admin`](file:///admin) | Administrative control center, fleet approvals, packaging ledger, and settings | Next.js 14, React 18, Tailwind CSS, Inter Font | `3002` |

---

## 3. Technology Stack & Key Decisions

- **Typography**: Strictly configured with **Inter** as the only font family across all four frontend applications (`landing-page`, `vendor`, `rider`, `admin`), enforced in CSS and Tailwind configs.
- **Frontend**: React 18, Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Node.js, Express 4, TypeScript, Helmet, CORS, Zod validation, JWT authentication, Bcrypt.
- **Database**: Supabase PostgreSQL with comprehensive schema, indexes, constraints, and Row Level Security (RLS) policies. Includes zero-dependency in-memory failover for instant local testing.
- **Payments**: Flutterwave hosted checkout with secret hash webhook verification (`verif-hash`) and idempotent event handling.
- **Messaging**: Meta WhatsApp Cloud API with interactive reply lists, buttons, and webhook signature validation.

---

## 4. Campus Commercial Rules & Monetary Standards

All monetary amounts are strictly maintained as **integer kobo** internally (`100 kobo = ₦1.00`) to completely eliminate floating-point rounding errors:

- **Minimum Food Subtotal**: ₦1,500 (150,000 kobo), excluding fees.
- **Hostel Delivery Fee**: ₦320 (32,000 kobo), configurable by campus admin.
- **EU Bite Platform Service Fee**: ₦100 (10,000 kobo).
- **EU Bite Reusable Eco-Pack**: ₦250 (25,000 kobo), reusable and sanitized.
- **School Cafeteria Pack**: ₦500 (50,000 kobo), standard approved packaging.
- **Rider Base Drop Payout**: ₦250 (25,000 kobo) per verified completed delivery.

---

## 5. Security & Business Logic Invariants

1. **Single Source of Truth**: Clients never calculate prices, totals, or modify order statuses directly. The central server calculates all subtotal and grand total figures.
2. **Payment Verification Gate**: Vendors only receive orders marked `paid`. An order cannot transition to `vendor_accepted` or `preparing` until its payment status is verified via Flutterwave.
3. **Atomic Rider Claiming**: Concurrency-safe lock ensures exactly one approved online rider can claim an order marked `ready_for_pickup`. Duplicate claims are rejected with HTTP 409.
4. **4-Digit Delivery PIN Verification**: Deliveries cannot be marked `delivered` without the server validating the 4-digit numeric PIN handed from the student to the rider. The system enforces a maximum of 5 PIN attempts before security lockout.
5. **Payment Webhook Idempotency**: Duplicate Flutterwave webhook triggers are tracked and safely replayed without duplicate status changes, inventory deductions, or double charging.
6. **Circular Food Packaging Ledger**: Packaging inventory is allocated, tracked, and decremented upon payment, with physical transactions recorded for issuance, returns, damages, and restocks.

---

## 6. Getting Started & Development Setup

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v10+

### Step 1: Central Server Setup
```bash
cd server
copy .env.example .env
npm install
npm test            # Runs the full automated acceptance test suite
npm run dev         # Starts API on http://localhost:4000
```

### Step 2: WhatsApp Bot Service
```bash
cd bot
copy .env.example .env
npm install
npm run dev         # Starts Bot service on http://localhost:4001
```
*Note: For local testing without Meta credentials, you can simulate WhatsApp messages via `POST http://localhost:4001/webhook/simulate` with `{ "phone": "+2348066778899", "message": "Hi" }`.*

### Step 3: Landing Page & Student Tracking
```bash
cd landing-page
copy .env.example .env.local
npm install
npm run dev         # Runs on http://localhost:3000
```
- Student Landing Page: `http://localhost:3000`
- Live Order Tracker: `http://localhost:3000/track`

### Step 4: Vendor Kitchen Portal
```bash
cd vendor
copy .env.example .env.local
npm install
npm run dev         # Runs on http://localhost:3003
```
- Vendor Kitchen Dashboard: `http://localhost:3003`

### Step 5: Rider Application
```bash
cd rider
copy .env.example .env.local
npm install
npm run dev         # Runs on http://localhost:3001
```
- Rider Dispatch Portal: `http://localhost:3001`

### Step 6: Admin Operations Dashboard
```bash
cd admin
copy .env.example .env.local
npm install
npm run dev         # Runs on http://localhost:3002
```
- Admin Control Center: `http://localhost:3002`

---

## 7. Default Seed Credentials (Pilot Testing)

All seed user accounts use the password: `Password123!`

| Role | Email | Description |
|---|---|---|
| **Campus Admin** | `admin@eubite.com` | Platform Director with full operations control |
| **Vendor 1** | `vendor.bites@eubite.com` | Campus Bites & Grill Kitchen |
| **Vendor 2** | `vendor.bukka@eubite.com` | Mama T’s Bukka Delight |
| **Rider 1** | `rider.musa@eubite.com` | Musa Bello (Approved, Bike #CAMPUS-BIKE-09) |
| **Rider 2** | `rider.emeka@eubite.com` | Emeka Okafor (Approved, Motorbike) |
| **Student** | `student.tunde@eubite.com` | Tunde Adeleke (Hostel Block C, Room 214) |

---

## 8. Database Schema & Supabase Setup

The complete SQL schema and initial seed data are located in:
- Schema: [`server/src/db/schema.sql`](file:///server/src/db/schema.sql)
- Seed Data: [`server/src/db/seed.sql`](file:///server/src/db/seed.sql)

To initialize your Supabase PostgreSQL project:
1. Copy the contents of `schema.sql` into the Supabase SQL Editor and execute.
2. Copy the contents of `seed.sql` and execute.
3. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`.

---

## 9. License

Proprietary — EU Bite Technologies. All rights reserved.
