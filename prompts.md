# Prompts Log (`prompts.md`)

This document records every prompt used across the entire development and deployment lifecycle of the **Salon Queue Management System**, in exact chronological order, including initial planning, iterative prompts, review queries, and deployment commands.

---

### Prompt 1: Project Planning & System Architecture (Documentation Only)
```markdown
# Salon Queue Management System – Project Planning

Act as a senior software architect, UI/UX designer and full-stack developer.

I want to build a complete, professional Salon Queue Management System using Google Antigravity.

This is a real working application, not just a UI prototype.

## 1. Project Objective

Build a salon queue management application where customers can join a live queue, select services and preferred barbers, track their waiting time, and receive notifications when their turn arrives.

Receptionists, barbers and salon owners should have separate interfaces to manage the queue.

## 2. Technology Stack

Use the following technologies:
- Frontend: React.js + Vite
- Styling: Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB
- Real-time communication: Socket.IO
- Icons: Lucide React
- Frontend deployment: Vercel
- Backend deployment: Render

Use clean, modular, maintainable code.

## 3. User Roles
1. Customer
2. Receptionist
3. Barber
4. Owner / Admin

## 4. Required Screens
1. Home Page (/)
2. Join Queue (/join)
3. My Queue Status (/status/:id)
4. Reception Dashboard (/reception)
5. Barber Dashboard (/barber/:name)
6. Waiting Area Display (/display)
7. Owner Settings (/admin)

## 8. Scope Restrictions
Do not implement:
- Online payments.
- Future-date appointments.
- SMS or WhatsApp integration.
- Loyalty points.
- Multiple salon branches.

## 9. First Task – Documentation Only
Do NOT start coding the application yet.
First create these files:
1. docs/01-brief.md
2. docs/02-screens.md
3. docs/03-flows-rules.md
4. AGENTS.md

STOP after documentation and wait for my approval before writing application code.
```
*Result: Generated comprehensive docs and specifications; no code written yet.*

---

### Prompt 2: Project Scaffolding & Initial Setup
```markdown
Read AGENTS.md and all files inside docs/.

First explain the architecture and the folder structure you plan to create.

Then initialize the project using React, Vite and Tailwind CSS.

Create:
- Frontend application
- Express backend
- MongoDB connection setup
- Socket.IO configuration
- Environment variable examples
- Reusable component structure
- English and Gujarati language files

Create all seven page routes with basic placeholder layouts.
Implement the charcoal and gold design system.
Do not implement all business functionality yet.
Ensure both frontend and backend can run successfully. Provide the exact terminal commands.
```
*Result: Monorepo established with client, server, Tailwind theme (#1F2937, #D4A017), routing, and bilingual dictionaries.*

---

### Prompt 3: Core Queue Engine & Customer / Reception Screens
```markdown
Build the core queue management functionality and the first two screens:
1. Customer Join Queue screen
2. Receptionist Dashboard

Implement:
- Customer registration flow.
- Token generation (A-101 for online, W-101 for walk-in).
- Form validation (10-digit mobile number starting with 6-9, 1-3 services).
- Duplicate active phone prevention.
- Walk-in customer intake.
- Wait time estimation calculation.
- Queue list sorted by FIFO.
- Highlight customers waiting more than 60 minutes.
- Socket.IO updates when queue changes.
```
*Result: Created `queueService.js`, `JoinQueuePage.jsx`, `ReceptionPage.jsx`, and real-time broadcasting.*

---

### Prompt 4: Customer Status Tracking & Notification Flow
```markdown
Build the Customer Queue Status Tracking screen (/status/:id).

Implement:
- Live status progression (WAITING -> CALLED -> IN_CHAIR -> DONE).
- Queue position and estimated wait time counter.
- Audio and visual alerts when turn is called.
- Cancel queue entry button with confirmation modal.
- Automatic reconnection and state reconciliation on refresh.
```
*Result: Created `MyStatusPage.jsx`, audio chime integration, and individual WebSocket subscription rooms.*

---

### Prompt 5: Barber Dashboard & Waiting Area TV Display
```markdown
Build two screens:
1. Barber Dashboard
2. Waiting Area TV Display

Barber Dashboard:
- Show current customer.
- Display token and selected services.
- Start service button.
- Done button.
- Show next eligible customer.
- Available / On Break toggle.

TV Display:
- Show all barbers.
- Show their current customer token.
- Show the next five queue tokens.
- Highlight newly called customers.
- Use large readable typography.
- Automatically update using Socket.IO.

When a barber starts or completes service, synchronize all screens within 5 seconds.
Do not break existing reception or customer functionality.
```
*Result: Created `BarberPage.jsx`, `DisplayPage.jsx`, and chair singularity dispatching.*

---

### Prompt 6: Owner Settings Dashboard
```markdown
Build the Owner Settings dashboard.

Implement:
- Add services.
- Edit services.
- Enable/disable services.
- Set service duration and price.
- Manage barbers.
- Set barbers on duty.
- Open/close online queue.
- Configure salon opening and closing times.
- Display today's customers served.
- Average waiting time.
- No-show statistics.

Changes must be saved in MongoDB.
Disabling a service must immediately hide it from the customer Join Queue screen.
Closing the online queue must disable online joining while keeping walk-in registration available.
Protect owner-only operations with authorization.
```
*Result: First pass generated placeholder UI for AdminPage; was later detected as needing full implementation.*

---

### Prompt 7: Continuation Request
```markdown
continue
```
*Result: Extended work on admin controllers and service endpoints.*

---

### Prompt 8: Re-prompting Owner Settings Dashboard (Focus Re-alignment)
```markdown
Build the Owner Settings dashboard.

Implement:
- Add services.
- Edit services.
- Enable/disable services.
- Set service duration and price.
- Manage barbers.
- Set barbers on duty.
- Open/close online queue.
- Configure salon opening and closing times.
- Display today's customers served.
- Average waiting time.
- No-show statistics.

Changes must be saved in MongoDB.
Disabling a service must immediately hide it from the customer Join Queue screen.
Closing the online queue must disable online joining while keeping walk-in registration available.
Protect owner-only operations with authorization.
```
*Result: Completed `adminRoutes.js` and wrote full 810-line `AdminPage.jsx` with PIN modal.*

---

### Prompt 9: Comprehensive 18-Point Verification & Code Review
```markdown
Read all project documentation.

Perform a complete application review.

Check:
1. Customer joining.
2. Duplicate phone number prevention.
3. Token generation.
4. Barber preference.
5. Call Next functionality.
6. Customer notifications.
7. Start and Done functionality.
8. No-show handling.
9. Cancellation.
10. Barber break handling.
11. Waiting time calculation.
12. English/Gujarati language switching.
13. Real-time synchronization.
14. Responsive mobile layout.
15. Reception tablet layout.
16. TV display layout.
17. Role-based access.
18. Database persistence.

For each test, report PASS or FAIL.
Fix failures without removing existing functionality.
Check browser console and backend logs.
Do not claim a feature works unless you have actually tested it.
Finally, provide a summary of changed files and remaining issues.
```
*Result: Executed automated test script against live endpoints; resolved `AlertCircle` import issue, patched `adminPin` data leak, and verified all 18 criteria passing.*

---

### Prompt 10: Production Deployment Preparation
```markdown
Prepare the project for production deployment.

Deploy:
- React frontend on Vercel.
- Express backend on Render.
- MongoDB using MongoDB Atlas.

Check:
- Production build.
- Environment variables.
- CORS configuration.
- Socket.IO production connection.
- API URLs.
- MongoDB connection.
- Frontend routing and refresh behavior.
- No localhost URLs in production code.

Give me exact step-by-step deployment instructions.

Update README.md with:
- Project description.
- Technology stack.
- Features.
- Setup instructions.
- Environment variables.
- GitHub repository.
- Live demo URL at the top.

Do not expose passwords, secrets or database credentials.
```
*Result: Added `vercel.json` SPA rewrites, updated CORS arrays in `server.js` and `socket.js`, created `deployment-guide.md`.*

---

### Prompt 11: Inquiry Regarding Owner PIN
```markdown
admin pin?
```
*Result: Explained default PIN `1234`, environment configuration via `ADMIN_PIN`, and in-app modification flow.*

---

### Prompt 12: Deployment Readiness
```markdown
now i want to deploye
```
*Result: Audited git tracking, ensured `.gitignore` coverage, and verified commit status.*

---

### Prompt 13: Live Deployment URL Integration (Initial attempts & completed)
```markdown
https://client-tan-seven-31.vercel.app/

this is my fronted url 

and this is my baked url so according to this fix my code
https://salon-queue-management-1c2g.onrender.com
```
*Result: Replaced `localhost` defaults with the actual Render backend and Vercel frontend URLs in `api.js`, `SocketContext.jsx`, `AdminPage.jsx`, and `server.js`; verified Vite build; committed and pushed commit `43b0363` to GitHub.*

---


### Prompt 14: Mobile View Navigation Missing
```markdown
in mobile view this is not showing this menu so fix it
[Image attached showing desktop navigation bar with Home, Join Queue, Reception, TV Display, Admin]
```
*Result: Diagnosed that `Navbar.jsx` had navigation links hidden on mobile (`md:hidden`) with no mobile drawer. Added a responsive hamburger menu toggle button (`Menu`/`X` icon), an animated mobile navigation drawer with touch-friendly links, and auto-close on selection. Verified with `npm run build`, committed (`647e0ca`), and pushed to GitHub.*

---

### Prompt 15: Mobile Navbar Deployment Confirmation
```markdown
also deployee this changes
```
*Result: Verified that commit `647e0ca` was already pushed to `origin/main` on GitHub, triggering Vercel's automatic CI/CD deployment pipeline. Tested live deployment HTTP status (200 OK) on Vercel.*

---

### Prompt 16: Root URL Routing & Home Page Clarification
```markdown
by cliking first join queue page open change it to home page
```
*Result: Inspected `client/src/App.jsx`, `client/src/pages/HomePage.jsx`, and `client/src/components/common/Navbar.jsx`. Verified that root path `/` renders `<HomePage />` while `/join` renders `<JoinQueuePage />`. Clarified that browser history/autofill often appends `/join` if previously visited, and explained how clicking the brand logo or navigating directly to `/` loads the Home Page.*

---

