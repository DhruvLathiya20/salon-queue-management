# AGENTS.md — Developer & AI Agent Implementation Guide

This document acts as the single source of architectural truth for any AI agent or human software engineer building, testing, or maintaining the **Salon Queue Management System**.

---

## 1. Architectural Principles & Code Conventions

1. **Server-Authoritative Queue State**:
   - The frontend never decides queue positions, estimated wait times, or next-customer eligibility.
   - All state transitions (`WAITING` ➔ `CALLED` ➔ `IN_CHAIR` ➔ `DONE`) are validated and executed by backend services in atomic MongoDB operations.
2. **Centralized Business Logic**:
   - Queue rules (FIFO, barber affinity, chair singularity, SLA 60-min flags, cut-off rules) must reside exclusively in `server/services/queueService.js`.
   - Never duplicate queue rules or calculate wait times across separate controller endpoints.
3. **Pure Internationalization (i18n)**:
   - Zero hardcoded English strings in components.
   - All UI text, badges, placeholders, and error messages must be referenced via language dictionaries (`client/src/locales/{en,gu}.json`).
4. **Resilient Real-Time WebSocket Channel**:
   - Socket.IO carries notifications and invalidation signals.
   - If a client misses a socket event or reconnects, it must reconcile by refetching the latest snapshot via REST.

---

## 2. Proposed Project Folder Structure

The repository uses a clean, decoupled monorepo structure with distinct `client` and `server` folders:

```
salon-queue-management/
├── client/                           # React.js + Vite Frontend
│   ├── public/                       # Static assets, sounds, favicon
│   │   ├── chimes/
│   │   │   └── turn-alert.mp3        # Audio chime for turn paged
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/                   # Images, logos, branding assets
│   │   ├── components/               # Modular reusable UI components
│   │   │   ├── common/               # Generic UI atoms & primitives
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── LanguageSwitcher.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   ├── customer/             # Customer-specific components
│   │   │   │   ├── BarberSelector.jsx
│   │   │   │   ├── ServiceSelector.jsx
│   │   │   │   ├── TokenCard.jsx
│   │   │   │   └── WaitTimeEstimator.jsx
│   │   │   ├── reception/            # Receptionist-specific components
│   │   │   │   ├── BarberStatusStrip.jsx
│   │   │   │   ├── DelayedCustomerAlert.jsx
│   │   │   │   ├── QueueTable.jsx
│   │   │   │   └── WalkInForm.jsx
│   │   │   ├── barber/               # Barber station components
│   │   │   │   ├── ActiveCustomerChair.jsx
│   │   │   │   ├── BreakToggle.jsx
│   │   │   │   └── NextCustomerCard.jsx
│   │   │   └── display/              # TV Display-specific components
│   │   │       ├── BarberStationGrid.jsx
│   │   │       ├── PagingBanner.jsx
│   │   │       └── UpcomingTokensTicker.jsx
│   │   ├── context/                  # React Context providers
│   │   │   ├── AuthContext.jsx       # Staff/Admin credentials state
│   │   │   ├── LanguageContext.jsx   # Bilingual EN/GU translation provider
│   │   │   └── SocketContext.jsx     # Global Socket.IO client instance
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAudioAlert.js      # Paging chime trigger hook
│   │   │   ├── useQueue.js           # Live queue subscription hook
│   │   │   └── useTranslation.js     # Translation helper hook
│   │   ├── locales/                  # Bilingual localization dictionaries
│   │   │   ├── en.json               # English translations
│   │   │   └── gu.json               # Gujarati translations
│   │   ├── pages/                    # The 7 required screen components
│   │   │   ├── HomePage.jsx          # /
│   │   │   ├── JoinQueuePage.jsx     # /join
│   │   │   ├── MyStatusPage.jsx      # /status/:id
│   │   │   ├── ReceptionPage.jsx     # /reception
│   │   │   ├── BarberPage.jsx        # /barber/:name
│   │   │   ├── DisplayPage.jsx       # /display
│   │   │   └── AdminPage.jsx         # /admin
│   │   ├── services/                 # API client utilities
│   │   │   ├── api.js                # Axios/Fetch base instance
│   │   │   ├── queueApi.js
│   │   │   ├── barberApi.js
│   │   │   └── serviceApi.js
│   │   ├── App.jsx                   # React Router route configuration
│   │   ├── index.css                 # Tailwind CSS directives & theme variables
│   │   └── main.jsx                  # React DOM root entry
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js            # Custom colors (#1F2937, #D4A017)
│   └── vite.config.js
│
├── server/                           # Node.js + Express.js Backend
│   ├── src/
│   │   ├── config/                   # Configuration & environment setup
│   │   │   ├── db.js                 # MongoDB connection logic
│   │   │   └── socket.js             # Socket.IO initialization & room handlers
│   │   ├── controllers/              # HTTP request / response handlers
│   │   │   ├── adminController.js
│   │   │   ├── barberController.js
│   │   │   ├── queueController.js
│   │   │   └── serviceController.js
│   │   ├── middleware/               # Express middleware
│   │   │   ├── authMiddleware.js     # Staff/Admin PIN/Token protection
│   │   │   ├── errorHandler.js       # Centralized JSON error handler
│   │   │   └── validateMiddleware.js # Joi/Zod request payload validation
│   │   ├── models/                   # Mongoose Schema definitions
│   │   │   ├── Barber.js
│   │   │   ├── DailyStats.js
│   │   │   ├── Queue.js
│   │   │   ├── Service.js
│   │   │   └── Settings.js
│   │   ├── routes/                   # RESTful API route definitions
│   │   │   ├── adminRoutes.js
│   │   │   ├── barberRoutes.js
│   │   │   ├── queueRoutes.js
│   │   │   └── serviceRoutes.js
│   │   ├── services/                 # Domain business logic
│   │   │   ├── analyticsService.js   # Daily metrics & aggregation
│   │   │   ├── estimatedWaitService.js# Wait time formula calculations
│   │   │   └── queueService.js       # FIFO, Dispatch, Transitions
│   │   ├── utils/                    # Helper utilities
│   │   │   └── tokenGenerator.js     # Daily token sequence generator
│   │   └── server.js                 # Express app + HTTP server + Socket setup
│   ├── package.json
│   └── .env.example
│
├── docs/                             # System Documentation
│   ├── 01-brief.md
│   ├── 02-screens.md
│   └── 03-flows-rules.md
│
├── AGENTS.md                         # Developer & Agent instructions
└── README.md                         # Project setup & run guide
```

---

## 3. Recommended Database Design (MongoDB)

### 3.1 Collections & Schema Specifications

#### 1. `queues` Collection (Live & Historical Queue Records)
```javascript
{
  _id: ObjectId,
  tokenNumber: String,          // e.g. "A-101" (Online) or "W-101" (Walk-in)
  tokenSequence: Number,        // Daily counter: 1, 2, 3...
  customerName: String,         // Required (2-50 chars)
  customerPhone: String,        // Required, 10-digit normalized (e.g. "9876543210")
  entryType: String,            // "ONLINE" | "WALK_IN"
  
  services: [                   // Array of selected services (1 to 3 items)
    {
      serviceId: { type: ObjectId, ref: 'Service' },
      name: { en: String, gu: String },
      duration: Number,         // in minutes
      price: Number             // in INR
    }
  ],
  totalDuration: Number,        // Sum of service durations (minutes)
  totalPrice: Number,           // Sum of service prices (INR)
  
  preferredBarberId: {          // Null = Any Barber
    type: ObjectId, 
    ref: 'Barber', 
    default: null 
  },
  assignedBarberId: {           // Populated when status becomes CALLED or IN_CHAIR
    type: ObjectId, 
    ref: 'Barber', 
    default: null 
  },
  
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'CANCELLED', 'NO_SHOW'],
    default: 'WAITING',
    index: true
  },
  
  // Timestamps for audit & SLA tracking
  createdAt: { type: Date, default: Date.now, index: true },
  calledAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  noShowAt: { type: Date, default: null },
  
  dateString: { type: String, index: true } // "YYYY-MM-DD" for daily scoping
}
```
**Key Indexes:**
- `{ customerPhone: 1, status: 1 }`: Quick validation for active ticket uniqueness.
- `{ status: 1, preferredBarberId: 1, createdAt: 1 }`: Fast FIFO lookup for "Call Next".
- `{ dateString: 1, tokenSequence: 1 }`: Unique daily token sequencing.

---

#### 2. `services` Collection (Salon Service Catalog)
```javascript
{
  _id: ObjectId,
  name: {
    en: { type: String, required: true },
    gu: { type: String, required: true }
  },
  category: {
    type: String,
    enum: ['HAIR', 'BEARD', 'FACIAL', 'SPA'],
    required: true
  },
  duration: { type: Number, required: true }, // Minutes (15, 30, 45, 60)
  price: { type: Number, required: true },    // Price in INR (e.g. 350)
  isActive: { type: Boolean, default: true }, // When false, hidden from /join
  displayOrder: { type: Number, default: 0 }
}
```

---

#### 3. `barbers` Collection (Staff Profiles & Working Status)
```javascript
{
  _id: ObjectId,
  name: { type: String, required: true },
  slug: { type: String, unique: true },        // e.g., "rajesh" for /barber/rajesh
  avatarUrl: { type: String, default: "" },
  chairNumber: { type: Number, required: true },// Station 1, 2, 3...
  isWorkingToday: { type: Boolean, default: true }, // On/off duty today
  isOnBreak: { type: Boolean, default: false },     // Active break toggle
  currentQueueId: {                                 // Active customer in chair
    type: ObjectId, 
    ref: 'Queue', 
    default: null 
  }
}
```

---

#### 4. `settings` Collection (Global Operational Settings)
```javascript
{
  _id: ObjectId,
  salonName: { type: String, default: "Elite Salon" },
  isOnlineQueueOpen: { type: Boolean, default: true },
  openingTime: { type: String, default: "09:00" }, // 24-hr format "HH:mm"
  closingTime: { type: String, default: "21:00" },
  onlineCutoffMinutes: { type: Number, default: 30 }, // Minutes before close
  adminPin: { type: String, default: "1234" }, // Secure staff access
  updatedAt: { type: Date, default: Date.now }
}
```

---

#### 5. `daily_stats` Collection (Aggregated End-of-Day Metrics)
```javascript
{
  _id: ObjectId,
  dateString: { type: String, unique: true }, // "YYYY-MM-DD"
  totalJoined: { type: Number, default: 0 },
  totalServed: { type: Number, default: 0 },
  totalNoShow: { type: Number, default: 0 },
  totalCancelled: { type: Number, default: 0 },
  averageWaitMinutes: { type: Number, default: 0 },
  averageServiceMinutes: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}
```

---

## 4. Proposed REST API Endpoints

### 4.1 Queue Endpoints (`/api/v1/queue`)
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/queue/join` | Customer submits online queue entry (validates phone, services, cut-off). | Public |
| `POST` | `/api/v1/queue/walkin` | Receptionist registers walk-in customer (bypasses online cut-off). | Receptionist / Admin |
| `GET` | `/api/v1/queue/status/:id` | Fetch live personal token status, position, and EWT. | Public |
| `GET` | `/api/v1/queue/live` | Fetch all active tickets (`WAITING`, `CALLED`, `IN_CHAIR`) for boards. | Public / Display |
| `PATCH` | `/api/v1/queue/:id/cancel` | Cancel a waiting token. | Public (Own) / Reception |
| `PATCH` | `/api/v1/queue/:id/call` | Manually call a customer for a barber. | Receptionist / Admin |
| `PATCH` | `/api/v1/queue/:id/start` | Mark customer as seated (`IN_CHAIR`). | Barber / Receptionist |
| `PATCH` | `/api/v1/queue/:id/done` | Mark service completed (`DONE`). | Barber / Receptionist |
| `PATCH` | `/api/v1/queue/:id/no-show`| Mark customer as `NO_SHOW`. | Receptionist / Barber |

### 4.2 Barber Endpoints (`/api/v1/barbers`)
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/barbers` | List all barbers with today's status & current chair info. | Public |
| `GET` | `/api/v1/barbers/:slug` | Get specific barber station status and active queue item. | Staff |
| `POST` | `/api/v1/barbers/:id/call-next` | Algorithmically fetch & call next eligible customer for barber. | Barber / Receptionist |
| `PATCH` | `/api/v1/barbers/:id/break` | Toggle barber on/off break. | Barber / Receptionist / Admin |

### 4.3 Service Endpoints (`/api/v1/services`)
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/services` | List active salon services (supports bilingual fields). | Public |
| `POST` | `/api/v1/services` | Create new service (duration, price, EN/GU name). | Admin |
| `PUT` | `/api/v1/services/:id` | Update existing service details. | Admin |
| `PATCH` | `/api/v1/services/:id/toggle` | Enable / Disable service. | Admin |

### 4.4 Admin & Operations Endpoints (`/api/v1/admin`)
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/settings` | Get salon operational settings and online queue status. | Staff / Admin |
| `PATCH` | `/api/v1/admin/settings` | Update hours, cut-off minutes, or online queue toggle. | Admin |
| `GET` | `/api/v1/admin/analytics/today` | Fetch live analytics (served, waiting, revenue, avg wait). | Admin |
| `PATCH` | `/api/v1/admin/barbers/:id/roster` | Toggle barber "Working Today" status. | Admin |

---

## 5. Socket.IO Real-Time Synchronization Protocol

### 5.1 Socket Rooms
- `queue:global`: Joined by `/display`, `/reception`, and `/admin`. Receives broad queue summaries and paging announcements.
- `customer:{queueId}`: Joined by customer visiting `/status/:id`. Receives private status changes, turn alerts, and cancellations.
- `barber:{barberId}`: Joined by `/barber/:name`. Receives station assignments and queue updates.

### 5.2 Real-Time Event Catalog
| Event Name | Direction | Room | Payload | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `queue:updated` | Server ➔ Client | `queue:global` | `{ waitingCount, activeCalls, inChairCount, lastAction }` | Signals display & reception to refresh queue state. |
| `customer:called` | Server ➔ Client | `customer:{id}` | `{ queueId, tokenNumber, barberName, chairNumber }` | Triggers customer audio chime and "It's your turn!" modal. |
| `display:paged` | Server ➔ Client | `queue:global` | `{ tokenNumber, barberName, chairNumber }` | Triggers TV display 5-second popup banner with chime. |
| `customer:status_changed` | Server ➔ Client | `customer:{id}` | `{ status, position, estimatedWaitMinutes }` | Updates live status progression card on customer device. |
| `barber:status_changed` | Server ➔ Client | `queue:global` | `{ barberId, isWorkingToday, isOnBreak, currentQueueId }` | Updates barber status badges on `/join` and `/display`. |

### 5.3 Multi-Window Synchronization Mechanism
1. When a user in Window A registers via `/join`, the backend saves the record to MongoDB.
2. Immediately inside the route handler, the server invokes `io.to('queue:global').emit('queue:updated', summaryPayload)`.
3. Window B (`/reception`) and Window C (`/display`) receive the event within <100ms and incrementally reconcile their state.
4. When a barber in Window D clicks "Call Next", the server updates the customer to `CALLED`, emits `customer:called` directly to Window E (`/status/:id`), and emits `display:paged` to Window C.
5. In case of network disconnection, Socket.IO's client heartbeat triggers reconnection. On reconnect, the client executes a fresh GET request to `/api/v1/queue/live` or `/api/v1/queue/status/:id` to ensure no state drift occurred while offline.

---

## 6. Implementation Roadmap (Post-Approval)

- **Phase 1: Project Setup & Core Configuration**
  - Initialize Vite React client with Tailwind CSS and Lucide React.
  - Setup Node.js Express server with Mongoose and Socket.IO.
  - Configure environment variables and seed initial services, barbers, and settings.
- **Phase 2: Backend Architecture & Centralized Queue Engine**
  - Implement Mongoose models (`Queue`, `Service`, `Barber`, `Settings`, `DailyStats`).
  - Implement `queueService.js` with strict FIFO, barber affinity, chair singularity, and EWT calculation.
  - Implement REST API routes with input validation and Socket.IO room broadcasters.
- **Phase 3: Internationalization & Shared Frontend Foundations**
  - Configure `en.json` and `gu.json` translation dictionaries.
  - Build base design system components (Gold/Dark theme, buttons, modals, cards, badges).
  - Configure Socket.IO client context and auto-reconnection hooks.
- **Phase 4: Customer Screens (`/`, `/join`, `/status/:id`)**
  - Home landing page with live queue statistics.
  - Multi-step queue join wizard with phone validation, service picker (max 3), and barber selector.
  - Real-time status tracker with position counter, EWT, audio turn alerts, and cancellation.
- **Phase 5: Staff & Operation Dashboards (`/reception`, `/barber/:name`)**
  - Receptionist 10-inch tablet landscape board with quick walk-in intake, >60m delay alert, and queue actions.
  - Mobile barber station view with one-click "Call Next", "Start Service", "Mark Done", and break toggle.
- **Phase 6: Waiting Area Display (`/display`) & Admin Portal (`/admin`)**
  - TV high-visibility layout with barber station grid and next 5 tokens ticker.
  - Admin settings for services CRUD, barber roster, operating hours, and daily analytics.
- **Phase 7: End-to-End Testing & Polish**
  - Verify all 10 business logic test cases and 5 multi-window sync test cases.
  - Validate responsive viewports across mobile, tablet landscape, and TV.
