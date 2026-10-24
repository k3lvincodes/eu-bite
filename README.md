# EU Bite — Campus Food Ordering & Delivery Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Render](https://img.shields.io/badge/Deploy%20on-Render-46E3B7?logo=render&logoColor=black)](https://render.com/)
[![Tests](https://img.shields.io/badge/Tests-34%20Passed-brightgreen)](https://github.com/k3lvincodes/eu-bite)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)

**EU Bite** is a production-grade, WhatsApp- and Telegram-first campus food ordering and delivery ecosystem built specifically for university campuses. It brings cafeteria meals directly to student hostel rooms, featuring atomic delivery dispatch, secure 4-digit delivery PIN handoff verification, sustainable circular food packaging, and instant Flutterwave payments.

---

## 1. System Architecture

The system strictly adheres to a centralized single-source-of-truth backend architecture:

```
               ┌─────────────────────────────┐        ┌──────────────────────────────┐
               │   Meta WhatsApp Cloud API   │        │     Telegram Bot API         │
               └──────────────┬──────────────┘        └───────────────┬──────────────┘
                              │ Webhook                               │ Webhook / Polling
                              ▼                                       ▼
┌──────────────────┐          ┌──────────────────────────────────────────────┐          ┌──────────────────┐
│   Landing Page   │          │         Omnichannel Bot Microservice         │          │   Rider Portal   │
│ (Web / Vendor)   │          │          (WhatsApp & Telegram Engine)        │          │  (PWA / Mobile)  │
│   (Port 3000)    │          │                  (Port 4001)                 │          │   (Port 3001)    │
└────────┬─────────┘          └───────────────────────┬──────────────────────┘          └────────┬─────────┘
         │                                            │                                          │
         │ Authenticated REST                         │ Service-Token Bridge                     │ Authenticated REST
         └────────────────────────────────────────────┼──────────────────────────────────────────┘
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

The repository contains six isolated application folders, each with its own package configuration and dependencies:

| Folder | Application Description | Tech Stack | Port |
|---|---|---|---|
| [`/server`](file:///server) | Central Node.js, Express, TypeScript API and core business logic | Node.js, Express, TypeScript, Supabase PostgreSQL, Zod | `4000` |
| [`/bot`](file:///bot) | Omnichannel WhatsApp Cloud API & Telegram bot state machine | Node.js, Express, TypeScript, Meta Graph API, Telegram API | `4001` |
| [`/landing-page`](file:///landing-page) | Public campus landing page, menu viewer, and live tracking | Next.js 14, React 18, Tailwind CSS, Inter Font | `3000` |
| [`/vendor`](file:///vendor) | Dedicated kitchen operations portal, live order queue & stock | Next.js 14, React 18, Tailwind CSS, Inter Font | `3003` |
| [`/rider`](file:///rider) | Mobile-first rider dispatch portal, atomic claiming & PIN verification | Next.js 14, React 18, Tailwind CSS, Inter Font | `3001` |
| [`/admin`](file:///admin) | Administrative control center, fleet approvals, packaging ledger | Next.js 14, React 18, Tailwind CSS, Inter Font | `3002` |

---

## 3. Production Deployment on Render

This repository includes a native [render.yaml](render.yaml) Blueprint for 1-click deployment to [Render](https://render.com/).

### Deployment Steps:
1. Fork or push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** > **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml` and provision:
   - **`eu-bite-server`**: Central API Web Service (`server/`)
   - **`eu-bite-bot`**: Omnichannel Bot Web Service (`bot/`)
4. Populate your secret environment variables in the Render Dashboard (`DATABASE_URL`, `FLUTTERWAVE_SECRET_KEY`, `WHATSAPP_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`).

---

## 4. Render Cold-Start Mitigation (Uptime Keep-Alive)

Render's free tier automatically suspends web services after **15 minutes of inactivity**, causing 30–50 second cold-start boot delays.

Both the Central Server and the Bot service expose an active, lightweight health check endpoint at `/health` and `/api/health` designed for keep-alive pingers such as [UptimeRobot](https://uptimerobot.com/).

### Uptime Monitoring Setup:
1. Create a free monitor at [UptimeRobot](https://uptimerobot.com/):
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `EU Bite Server Health`
   - **URL**: `https://<your-render-app>.onrender.com/health`
   - **Monitoring Interval**: `5 minutes`
2. **Result**: Render receives an incoming keep-alive ping every 5 minutes, ensuring the instance **never sleeps** and eliminating cold starts.

#### Health Endpoint Response:
```json
{
  "status": "healthy",
  "platform": "EU Bite Central API",
  "version": "1.0.0",
  "uptime": 720,
  "timestamp": "2026-10-24T18:41:57.581Z",
  "db": {
    "status": "connected",
    "latencyMs": 14,
    "mode": "postgres"
  },
  "memory": {
    "rssMb": 77,
    "heapUsedMb": 14
  }
}
```

---

## 5. Security & Business Logic Invariants

1. **Single Source of Truth**: Clients never calculate prices, totals, or modify order statuses directly. The central server calculates all subtotal and grand total figures in integer kobo.
2. **Payment Verification Gate**: Vendors only receive orders marked `paid`. An order cannot transition to `vendor_accepted` or `preparing` until its payment status is verified via Flutterwave.
3. **Atomic Rider Claiming**: Concurrency-safe lock ensures exactly one approved online rider can claim an order marked `ready_for_pickup`. Duplicate claims are rejected with HTTP 409.
4. **4-Digit Delivery PIN Verification**: Deliveries cannot be marked `delivered` without the server validating the 4-digit numeric PIN handed from the student to the rider. The system enforces a maximum of 5 PIN attempts before security lockout.
5. **Payment Webhook Idempotency**: Duplicate Flutterwave webhook triggers are tracked and safely replayed without duplicate status changes, inventory deductions, or double charging.
6. **Circular Food Packaging Ledger**: Packaging inventory is allocated, tracked, and decremented upon payment, with physical transactions recorded for issuance, returns, damages, and restocks.
7. **Protected Local Docs**: Private infrastructure notes, credentials, and sensitive deployment guides are kept in the `docs/` directory (ignored by `.gitignore`) to protect production specifics on public repositories.

---

## 6. Local Development Setup

### Prerequisites
- Node.js v18+ (tested on Node v22 and v24)
- npm v10+

### 1. Central Server Setup
```bash
cd server
cp .env.example .env
npm install
npm test            # Runs acceptance test suite (10/10 passing)
npm run dev         # Starts API on http://localhost:4000
```

### 2. Bot Service Setup
```bash
cd bot
cp .env.example .env
npm install
npm test            # Runs bot conversational flow tests (24/24 passing)
npm run dev         # Starts Bot service on http://localhost:4001
```

### 3. Frontend Web Applications
```bash
# Landing Page & Student Tracker (Port 3000)
cd landing-page && npm install && npm run dev

# Rider Dispatch Portal (Port 3001)
cd rider && npm install && npm run dev

# Admin Operations Dashboard (Port 3002)
cd admin && npm install && npm run dev

# Vendor Kitchen Dashboard (Port 3003)
cd vendor && npm install && npm run dev
```

---

## 7. Default Seed Credentials (Local Development)

All seed accounts use the password: `Password123!`

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
- Schema: [`server/src/db/schema.sql`](server/src/db/schema.sql)
- Seed Data: [`server/src/db/seed.sql`](server/src/db/seed.sql)

To initialize your Supabase PostgreSQL project:
1. Copy the contents of `schema.sql` into the Supabase SQL Editor and execute.
2. Copy the contents of `seed.sql` and execute.
3. Configure `DATABASE_URL` in `server/.env`.

---

## 9. License

Proprietary — EU Bite Technologies. All rights reserved.
