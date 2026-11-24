# Salon Queue Management System — Project Brief & Architecture

## 1. Executive Summary

The **Salon Queue Management System** is a real-time, multi-role web platform designed to streamline salon operations, eliminate physical waiting lines, and optimize chair utilization. Customers can join a virtual queue online or as walk-ins at the reception desk, choose their desired services (up to 3) and preferred barber (or any available barber), and track their live queue status with estimated waiting times on their mobile phones.

Simultaneously, the platform provides dedicated role-specific operational interfaces:
- **Receptionist Dashboard**: For front-desk intake, queue monitoring, walk-in registration, and manual queue interventions.
- **Barber Dashboard**: For mobile station management, calling the next customer, tracking active services, and managing breaks.
- **Waiting Area TV Display**: A high-visibility, large-screen interface readable from 5+ meters showing current chair occupants and upcoming queue tokens.
- **Owner / Admin Portal**: For managing services, barber rosters, business hours, queue cut-offs, and daily analytics.

The system is architected around a **centralized, server-authoritative queue engine** backed by MongoDB and synchronized across all active browser windows in real time via Socket.IO WebSockets.

---

## 2. Technology Stack & Technical Rationale

| Layer | Technology | Version / Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js + Vite | React 18 for performant reactive UI; Vite for ultra-fast bundling and HMR. |
| **Styling & Design System** | Tailwind CSS | Utility-first CSS providing custom dark luxury styling (`#1F2937` dark charcoal with `#D4A017` gold accents). |
| **Icons** | Lucide React | Lightweight, consistent SVG iconography for all status, navigation, and service indicators. |
| **State & Localization** | React Context + i18n Dictionary | Lightweight bilingual state management (English & Gujarati) loaded from structured JSON bundles. |
| **Backend Runtime** | Node.js + Express.js | Event-driven, asynchronous REST API runtime running business validation and queue mutations. |
| **Real-Time Layer** | Socket.IO | Bi-directional WebSocket communication enabling sub-second synchronization across all clients with automatic reconnection. |
| **Database & ODM** | MongoDB + Mongoose | Document-oriented persistence suitable for queue state machines, daily logs, and flexible configuration schemas. |
| **Client Deployment** | Vercel | Global CDN deployment for static SPA frontend with client-side routing. |
| **Server Deployment** | Render | Managed Web Service hosting Express + Socket.IO with WebSocket support. |

---

## 3. User Roles & Permissions Matrix

The system enforces strict Role-Based Access Control (RBAC):

| Feature / Action | Customer (Public) | Receptionist (Staff) | Barber (Staff) | Owner / Admin |
| :--- | :---: | :---: | :---: | :---: |
| View Home & Join Virtual Queue | ✅ | ✅ | ❌ | ❌ |
| Check Personal Queue Status (`/status/:id`) | ✅ | ✅ | ❌ | ❌ |
| Cancel Own Queue Entry | ✅ | ✅ | ❌ | ✅ |
| Register Walk-in Customer | ❌ | ✅ | ❌ | ✅ |
| View Entire Queue with Customer Details | ❌ | ✅ | Limited (Next Only) | ✅ |
| Call Next Customer (Assigned or Any) | ❌ | ✅ (Per barber) | ✅ (Own chair) | ✅ |
| Mark Customer as In Chair / Start Service | ❌ | ✅ | ✅ | ✅ |
| Mark Service Done / Complete Chair Session | ❌ | ✅ | ✅ | ✅ |
| Mark Customer as No-Show | ❌ | ✅ | ❌ | ✅ |
| Toggle Barber Break Status | ❌ | ✅ | ✅ (Self) | ✅ |
| Open / Close Online Queue Joining | ❌ | ✅ | ❌ | ✅ |
| Manage Services (Pricing, Durations) | ❌ | ❌ | ❌ | ✅ |
| Manage Barber Profiles & Daily Roster | ❌ | ❌ | ❌ | ✅ |
| View Daily Statistics & Financial Summary | ❌ | ❌ | ❌ | ✅ |

---

## 4. Design System & UI/UX Guidelines

### 4.1 Theme & Color Palette
The interface reflects a premium, modern barbershop and salon aesthetic:
- **Primary Background**: `#1F2937` (Tailwind `gray-800` deep slate)
- **Secondary Card Background**: `#111827` (Tailwind `gray-900` midnight black)
- **Card Surface & Modals**: `#374151` (Tailwind `gray-700` charcoal)
- **Primary Accent / Brand**: `#D4A017` (Metallic Salon Gold)
- **Accent Hover / Active**: `#B8860B` (Dark Goldenrod)
- **Text Primary**: `#FFFFFF` (Crisp White)
- **Text Secondary / Muted**: `#E5E7EB` (Tailwind `gray-200` light grey) & `#9CA3AF` (Tailwind `gray-400` muted)
- **Status Accents**:
  - **Waiting**: `#3B82F6` (Electric Blue)
  - **Called**: `#F59E0B` (Vibrant Amber / Pulsing Gold)
  - **In Chair**: `#10B981` (Emerald Green)
  - **Done**: `#6B7280` (Muted Steel)
  - **Long Wait (>60m Alert)**: `#EF4444` (Crimson Red with pulsing glow)

### 4.2 Typography & Elevation
- **Font Family**: Inter or Plus Jakarta Sans with fallbacks to system sans-serif.
- **Card Elevation**: Subtle golden border highlights (`border border-amber-500/20`), soft dark drop shadows (`shadow-xl shadow-black/40`), and rounded card radii (`rounded-2xl`).
- **Interactive Feedback**: Smooth transitions (200ms ease-in-out), tactile active press scaling (`active:scale-95`), and accessible focus states.

### 4.3 Viewport Specializations
1. **Customer Interface (`/`, `/join`, `/status/:id`)**:
   - Mobile-first (360px–430px optimal, fully responsive on desktop).
   - Bottom floating action buttons, sticky progress indicators, large tap targets (minimum 48px).
2. **Receptionist Dashboard (`/reception`)**:
   - Optimized specifically for 10-inch tablets in **landscape orientation** (1280×800 viewport).
   - Multi-column layout: Fast walk-in intake on the left (35% width), live queue management on the right (65% width).
3. **Barber Interface (`/barber/:name`)**:
   - Mobile-first one-handed interface for barbers operating while standing at their styling station.
   - Massive single-tap buttons for "Call Next", "Start Service", and "Complete Service".
4. **Waiting Area Display (`/display`)**:
   - TV-optimized 16:9 1080p/4K interface with high contrast.
   - Legible from **at least 5 meters distance**: Token typography sized 48px–72px, bold status pill badges, and high-contrast color coding.

### 4.4 Internationalization (i18n)
- Complete dual-language support: **English (EN)** and **Gujarati (GU)**.
- Stored in clean JSON language files (`src/locales/en.json` and `src/locales/gu.json`).
- Language switcher accessible from header navigation across all user-facing and staff screens.
- Strict rule: **Zero hardcoded text strings** in components.

---

## 5. System Architecture & Real-Time Sync Strategy

```
  +--------------------------------------------------------------------------------+
  |                                CLIENT TIER                                     |
  |                                                                                |
  |  +--------------------+  +--------------------+  +--------------------------+  |
  |  | Customer Device    |  | Reception Tablet   |  | Barber Mobile Stations   |  |
  |  | (/join, /status)   |  | (/reception)       |  | (/barber/:name)          |  |
  |  +---------+----------+  +---------+----------+  +------------+-------------+  |
  |            |                       |                          |                |
  |            +-----------------------+--------------------------+                |
  |                                    |                                           |
  |                       +------------+-------------+                             |
  |                       | Waiting Area TV Display  |                             |
  |                       | (/display)               |                             |
  |                       +------------+-------------+                             |
  +------------------------------------|-------------------------------------------+
                                       | HTTPS (REST API) & WSS (Socket.IO)
  +------------------------------------v-------------------------------------------+
  |                           SERVER TIER (Node.js + Express)                      |
  |                                                                                |
  |   +------------------------------------------------------------------------+   |
  |   | HTTP REST API Endpoints (/api/v1/queue, /api/v1/barbers, /api/v1/...)  |   |
  |   +------------------------------------------------------------------------+   |
  |   | Centralized Queue Logic Service (QueueService.js)                     |   |
  |   |  - Token Generation (Prefix + Daily Sequence)                         |   |
  |   |  - FIFO + Barber Affinity Scheduling Engine                           |   |
  |   |  - Estimated Wait Time (EWT) Calculator                                |   |
  |   |  - Auto 60-min SLA Escalation Scanner                                  |   |
  |   +------------------------------------------------------------------------+   |
  |   | Socket.IO Real-Time Dispatcher & Room Manager                          |   |
  |   |  - Room: `queue:global` (TV Display, Reception)                        |   |
  |   |  - Room: `customer:{id}` (Individual Customer Live Tracker)            |   |
  |   |  - Room: `barber:{id}` (Barber-specific station updates)               |   |
  |   +------------------------------------------------------------------------+   |
  +------------------------------------|-------------------------------------------+
                                       | Mongoose Driver
  +------------------------------------v-------------------------------------------+
  |                          PERSISTENCE TIER (MongoDB)                            |
  |                                                                                |
  |  - `queues`: Real-time queue entries, statuses, timestamps, tokens.            |
  |  - `services`: Salon catalog with duration in minutes, prices, bilingual names.|
  |  - `barbers`: Barber roster, working today status, break toggles.              |
  |  - `settings`: Salon business hours, online cut-off rules, global toggles.     |
  |  - `daily_stats`: Aggregated snapshots of daily wait times, served counts.     |
  +--------------------------------------------------------------------------------+
```

### 5.1 Real-Time Synchronization Across Multiple Browser Windows
1. **Server-Authoritative State**: Every queue mutation (Join, Call, Start, Done, Cancel, No-Show) MUST pass through Express backend validation and persist to MongoDB before emitting socket events.
2. **Selective Room Broadcasts**:
   - `queue:global`: Broadcasts queue summary updates (active counts, current calls, wait times) to `/display` and `/reception`.
   - `customer:{queueId}`: Private room emitting personal token status changes, "You are next" alerts, and "It's your turn" call banners.
   - `barber:{barberId}`: Emits assignment updates when a customer is called or transitions into chair.
3. **Optimistic Updates & Fallback Polling**:
   - The frontend immediately reflects local user clicks with subtle loading indicators.
   - Upon WebSocket confirmation, state reconciles with the server payload.
   - In case of network interruption or WebSocket disconnection, clients automatically fall back to exponential backoff reconnection and poll `/api/v1/queue/status` every 15 seconds.

---

## 6. Scope Boundaries & Exclusions

To ensure rock-solid quality and zero bloat, the following items are **explicitly out of scope**:
- ❌ **No Online Payments**: All billing and payment settlements occur physically in-salon.
- ❌ **No Future-Date Appointments**: The system is exclusively a **same-day live queue engine**.
- ❌ **No SMS or WhatsApp Gateways**: Eliminates 3rd-party vendor costs; customers track status directly via their live web status URL.
- ❌ **No Loyalty or Reward Programs**: Focus remains purely on queue velocity and chair utilization.
- ❌ **No Multi-Branch Multi-Tenancy**: Engineered cleanly for a single dedicated salon location.
