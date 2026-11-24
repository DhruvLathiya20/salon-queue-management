# Salon Queue Management System — Screen Specifications

This document provides complete, implementation-ready specifications for all seven required screens in the system.

---

## Screen 1: Home Page (`/`)

### 1.1 Purpose & Role
The public entry point for salon visitors. It allows customers to quickly assess the live salon queue status, understand current wait times, join the queue, or resume tracking an existing token.

### 1.2 Layout & Component Structure
- **Navigation Bar**:
  - Salon Brand Logo with Gold Accent (`#D4A017`)
  - Language Selector toggle: `English` | `ગુજરાતી`
  - Staff / Admin Login quick link (locks to modal or redirects)
- **Salon Status Hero Banner**:
  - Dynamic status badge:
    - `🟢 Salon Open & Accepting Queue Entries`
    - `🟡 Online Queue Closed (Walk-ins Only at Reception)`
    - `🔴 Salon Closed`
  - Current Operating Hours (e.g., 09:00 AM – 09:00 PM)
- **Live Queue Snapshot Cards (Grid of 3)**:
  - Card 1: **Currently Waiting** (Count of active `WAITING` customers)
  - Card 2: **Barbers Working Today** (Count of active on-duty barbers)
  - Card 3: **Estimated Wait Time** (Current rolling average for new joins)
- **Primary Call to Action (CTA)**:
  - Big prominent button: **"Join Live Queue"** (disabled with explanation if online queue is closed)
  - Secondary button / input: **"Track Existing Token"** (Phone number / Token code input with quick "Find My Turn" button)
- **Services Preview Carousel / Grid**:
  - Highlights top salon services with base duration and price.

### 1.3 UI States & Error Handling
- **Loading State**: Skeleton loaders for metric cards.
- **Empty State**: "No one is waiting! Join now to be served immediately."
- **Cut-off State**: If current time is within 30 minutes of closing, button shows "Online Queue Closed for Today — Please visit reception for walk-in availability."

---

## Screen 2: Join Queue (`/join`)

### 2.1 Purpose & Role
Customer onboarding wizard where visitors configure their services, select their barber preference, provide contact information, and enter the active queue.

### 2.2 Layout & Component Structure
- **Step 1: Customer Contact Details**:
  - Full Name Input (Text, Required, 2-50 chars)
  - Phone Number Input (Tel, Required, strict 10-digit validation: `^[6-9]\d{9}$`)
  - Duplicate check: In-line feedback if this phone already has an active ticket.
- **Step 2: Service Selection (Max 3)**:
  - Filter by Category: Haircut, Beard & Shave, Hair Spa & Treatments, Facials
  - Multi-select service cards displaying:
    - Service Name (Bilingual: EN / GU)
    - Duration badge (e.g., `30 mins`)
    - Price badge (e.g., `₹350`)
    - Checkbox / highlight border on selection
  - Selection Limit Safeguard: If 3 services are checked, remaining cards are visually disabled with a tooltip *"Maximum 3 services permitted per session"*.
- **Step 3: Preferred Barber Selection**:
  - Option A: **"Any Available Barber" (Fastest Turnaround)** — highlighted with recommended badge.
  - Option B: Specific working barbers list:
    - Barber photo / avatar
    - Barber Name
    - Live Status badge (`Available` or `On Break - Next slot after 20 mins`)
    - Warning alert if selecting a barber on break: *"Note: [Barber Name] is currently on break. Your wait time will be longer."*
- **Step 4: Live Summary Sticky Footer / Drawer**:
  - Selected Services count (e.g., `2 services selected`)
  - Total Estimated Duration (`45 mins`)
  - Total Estimated Price (`₹550`)
  - Assigned Barber (`Any Barber` or `Rajesh`)
  - Submit Button: **"Confirm & Get Queue Token"** (shows loading spinner during submission)

### 2.3 Form Validation & Business Logic
- Prevent submission if Name is empty or Phone is not valid 10 digits.
- Prevent submission if 0 services are selected.
- Server returns HTTP 409 Conflict if phone number already has an active queue entry with message: *"You already have an active token: [TOKEN]. Tap here to view status."*
- If online queue was closed while user was filling the form, server rejects with code `ONLINE_QUEUE_CLOSED`.

---

## Screen 3: My Queue Status (`/status/:id`)

### 3.1 Purpose & Role
Real-time customer status screen. This is saved to `localStorage` on the customer's phone and accessible via permanent URL bookmark.

### 3.2 Layout & Component Structure
- **Header**:
  - Live Connection Indicator (`Connected 🟢` / `Reconnecting 🟡`)
  - Language Switcher (EN / GU)
  - Salon Name & Emergency Contact
- **Central Token Pass Card**:
  - **Queue Token Identifier**: Extra-large display (e.g., **`A-104`**)
  - Customer Name & Phone (masked: `******4821`)
  - Chosen Services List with individual durations and total price
  - Assigned Barber Preference (`Any Barber` or Barber Name)
- **Dynamic Status Progression Bar**:
  - Multi-step visual tracker: `[ Waiting ]` ➔ `[ Called ]` ➔ `[ In Chair ]` ➔ `[ Completed ]`
- **Contextual Status Panels**:
  - **State A: `WAITING`**:
    - **Your Position in Queue**: e.g., `#3 in line`
    - **Estimated Wait Time**: e.g., `~25 minutes`
    - Long wait warning (if waiting > 60m): *"We apologize for the wait. Our team is working to attend to you shortly."*
    - **"You are Next!" Notice**: Highlights in amber when position reaches `#1`.
  - **State B: `CALLED` (High Urgency State)**:
    - Pulsing Gold/Amber full-card glow.
    - Large text: **"IT'S YOUR TURN! PLEASE PROCEED TO CHAIR"**
    - Designated Barber Name & Station Number (e.g., **"Station 2 — Barber Ramesh"**).
    - Audio chime / browser vibration notification trigger.
  - **State C: `IN_CHAIR`**:
    - Green active status card: **"Service in Progress"**.
    - Live service timer showing elapsed time.
  - **State D: `DONE`**:
    - Thank you card: *"Thank you for visiting! Total: ₹550. Hope to see you again soon."*
  - **State E: `NO_SHOW`**:
    - Red alert card: *"Your token was marked as No-Show because you did not arrive when called. Please speak to reception or rejoin the queue."*
    - Action button: **"Rejoin Queue"** (starts new registration).
  - **State F: `CANCELLED`**:
    - Grey card: *"This queue token has been cancelled."*
- **Cancellation Action**:
  - Button: **"Cancel My Queue Entry"** (only visible when in `WAITING` status).
  - Triggers confirmation modal: *"Are you sure you want to give up your spot in line?"*

---

## Screen 4: Reception Dashboard (`/reception`)

### 4.1 Purpose & Role
Front-desk command center. Designed for a **10-inch Android/iOS tablet in landscape mode (1280×800)**. Handles walk-in customer creation, monitors line depth, manages barber chairs, and handles no-shows.

### 4.2 Layout & Component Structure
- **Top Utility Header**:
  - Salon Time & Current Date
  - Online Queue Status Switch: **Online Queue [ OPEN | CLOSED ]**
  - Live Metrics: Total Waiting | In Service | Completed Today | Average Wait Time
  - Fullscreen toggle & Sound toggle
- **Left Column (35% Width): Quick Walk-In Registration**:
  - Compact, high-speed entry form:
    - Name field
    - Phone number field (auto-focus)
    - Quick-select service pills with prices
    - Barber selector dropdown (Any Barber or specific)
    - Prominent **"Add Walk-in Token"** button (adds to database instantly, prints or displays token modal)
- **Right Column (65% Width): Active Queue Grid & Board**:
  - Segmented Tabs / Split View:
    1. **Waiting Queue (FIFO Order)**:
       - Card / Row per customer:
         - Token # (e.g. `W-105`), Customer Name, Phone
         - Services requested and total minutes
         - Barber preference tag (`Any` or specific barber name)
         - Elapsed waiting timer (shows exact minutes since join)
         - **SLA Breach Highlight**: If wait duration > 60 minutes, background flashes with **Crimson Alert badge (`60m+ DELAY`)**.
         - Action buttons:
           - **"Call for Barber..."** dropdown / button
           - **"Cancel Entry"**
    2. **Called Customers (Paging Stage)**:
       - Displays customers currently paged with assigned barber.
       - Elapsed call timer (e.g., `Called 3 mins ago`).
       - Action buttons:
         - **"Seat Customer (In Chair)"**
         - **"Mark No-Show"** (frees the barber to call someone else)
    3. **In-Chair Customers**:
       - Displays each active barber station, current customer, time elapsed vs estimated duration.
       - Quick action: **"Mark Done"**.
- **Bottom Barber Station Strip**:
  - Mini card for each barber:
    - Barber Name & Station Number
    - Status pill (`In Service`, `Available`, `On Break`)
    - Toggle button for **Break Status** (`Take Break` / `End Break`).

---

## Screen 5: Barber Dashboard (`/barber/:name`)

### 5.1 Purpose & Role
Individual station interface used by barbers on their mobile phones (or dedicated small station tablets). Designed for extreme simplicity and one-handed operation.

### 5.2 Layout & Component Structure
- **Station Header**:
  - Barber Name & Photo
  - Quick Availability Toggle:
    - `🟢 Available` vs `🟡 On Break`
- **Main Action Stage (Dynamic based on state)**:
  - **Scenario 1: Barber is Free / Available**:
    - No active customer in chair.
    - Large Primary Button: **"CALL NEXT CUSTOMER"**
    - Subtext preview: Shows next eligible customer in line (Token #, Services, Total Duration).
  - **Scenario 2: Customer is Called (Paging)**:
    - Customer Token, Name, Services.
    - Timer: `Paging since 01:45`.
    - Primary Button: **"Start Service (Customer Arrived)"** (transitions to `IN_CHAIR`).
    - Secondary Button: **"Mark as No-Show"** (if customer fails to appear after multiple calls).
  - **Scenario 3: Service In Progress (`IN_CHAIR`)**:
    - Active Customer Token & Name.
    - Detailed Service Breakdown (e.g., Beard Trim + Haircut).
    - Service Duration Progress Bar & Running Stopwatch (`18 / 35 mins`).
    - Primary Button: **"COMPLETE SERVICE (MARK DONE)"** (clears chair, records finish timestamp, prompts to call next).
- **Upcoming Queue Preview Drawer**:
  - Expandable drawer showing the next 3 waiting customers assigned specifically to this barber or in the "Any Barber" pool.

---

## Screen 6: Waiting Area Display (`/display`)

### 6.1 Purpose & Role
Public TV / Monitor dashboard mounted on the salon wall. Designed to be viewed effortlessly from **5+ meters distance** across the waiting lounge.

### 6.2 Layout & Visual Hierarchy
- **Header Bar (10% Height)**:
  - Salon Name with Gold Emblem
  - Current Digital Clock (12-hour format with AM/PM)
  - Salon Status Banner (e.g., "Welcome to Luxury Salon — Please watch for your token")
- **Main Split Screen (90% Height)**:
  - **Left Section (60% Width) — "BARBER CHAIRS & NOW SERVING"**:
    - Multi-station grid (e.g., 2×2 or 3×2 grid depending on active barbers):
    - Each Barber Station Tile includes:
      - Station Number & Barber Name (Font size: 28px bold)
      - Current Token Number (Font size: **56px–72px bold Gold `#D4A017`**)
      - Customer First Name
      - Status Indicator:
        - `🟢 In Chair` (with elapsed duration)
        - `🟡 Calling Now...` (with flashing border)
        - `☕ On Break`
        - `⚪ Ready for Next`
  - **Right Section (40% Width) — "UPCOMING IN QUEUE"**:
    - Dark slate panel (`#111827`) with golden border.
    - Displays the **Next 5 Queue Tokens**:
      - Token Number (e.g., `A-105`, `W-106`)
      - Barber Preference (`Any Barber` or `Rajesh`)
      - Estimated wait (e.g., `~10 mins`)
    - Smooth animated transitions as tickets advance or drop off.
- **Audio-Visual Paging Alert Overlay**:
  - When any barber clicks "Call Next", the TV screen triggers a temporary 5-second animated banner modal:
    - Sound chime (pleasant salon audio ding).
    - Bold text: **"TOKEN A-105 — PLEASE PROCEED TO CHAIR 2 (RAJESH)"**.

---

## Screen 7: Owner Settings (`/admin`)

### 7.1 Purpose & Role
Administrative management portal for salon owners to configure business parameters, staff, catalog, and review performance metrics.

### 7.2 Layout & Component Structure
- **Protected Header & Navigation**:
  - Admin Profile & Logout
  - Navigation Tabs:
    1. **Overview & Analytics**
    2. **Service Management**
    3. **Barber Management**
    4. **Salon Operations & Hours**
- **Tab 1: Overview & Daily Analytics**:
  - Summary Metric Cards:
    - Total Customers Served Today
    - Average Wait Time (Minutes)
    - Average Service Duration (Minutes)
    - Total No-Shows / Cancellations
    - Estimated Gross Service Volume (₹)
  - Hourly Queue Depth chart (Graph showing peak waiting hours).
- **Tab 2: Service Catalog Management**:
  - Table of all salon services with CRUD operations:
    - Service Name in English & Gujarati
    - Category (Hair, Beard, Spa, Skin)
    - Duration (15, 30, 45, 60 minutes)
    - Price (INR)
    - Active toggle switch (Enable / Disable service from appearing in `/join`).
  - "Add New Service" modal form.
- **Tab 3: Barber & Staff Management**:
  - Barber roster list:
    - Name, Photo URL, Contact
    - Daily toggle: **"Working Today"** (defines whether barber is part of today's queue pool).
    - Emergency Break override switch.
    - Add/Edit barber profiles.
- **Tab 4: Salon Operations & Queue Controls**:
  - Master Queue Switch: `[ Open Online Queue ]` / `[ Close Online Queue ]`
  - Salon Operating Schedule: Opening Time (e.g., `09:00`) and Closing Time (e.g., `21:00`).
  - Online Cut-Off Offset: Configurable duration before closing when online queue stops accepting entries (Default: `30 minutes`).
  - Queue Reset Action: Emergency daily queue reset button with double confirmation.
