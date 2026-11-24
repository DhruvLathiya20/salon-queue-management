# Salon Queue Management System

Live Demo : https://client-tan-seven-31.vercel.app/

## 📖 Project Description
A full‑stack, real‑time queue management application for salons. Customers can join a live queue, select services and a preferred barber, and receive real‑time notifications when it’s their turn. Receptionists, barbers, and owners have dedicated interfaces to manage the queue, view analytics, and control salon settings.

## 🛠️ Technology Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Socket.IO‑client |
| **Backend** | Node.js 20, Express 4, Socket.IO 4, Mongoose 8 |
| **Database** | MongoDB Atlas (cloud) |
| **Deployments** | Frontend – Vercel • Backend – Render |
| **Other** | Environment variables managed via `.env` files / platform UI |

## ✨ Features
- **Customer flow** – Join queue, see position & estimated wait, receive audio/visual notifications, cancel ticket.
- **Barber dashboard** – View current customer, start & finish service, toggle break status, call next customer.
- **Reception dashboard** – Tablet‑optimized view, walk‑in registration, call next, mark no‑show, cancel tickets.
- **Owner settings** – CRUD services, manage barbers, open/close online queue, configure salon hours, view daily analytics.
- **Real‑time sync** – Socket.IO rooms (`queue:global`, `customer:{id}`, `barber:{id}`) keep every view up‑to‑date.
- **Internationalization** – English & Gujarati language files (`locales/en.json`, `locales/gu.json`).
- **Responsive design** – Mobile‑first customer UI, tablet‑optimized reception, large‑screen TV display.
- **Security** – Role‑based access with admin PIN, CORS whitelist, secrets stored in environment variables.

## 🚀 Setup & Development
```bash
# Clone the repo
git clone <repo-url>
cd salon-queue-management

# Backend
cd server
cp .env.example .env   # edit with your local MongoDB URI & admin PIN
npm install
npm run dev   # runs on http://localhost:5000

# Frontend
cd ../client
cp .env.example .env   # set REACT_APP_API_URL=http://localhost:5000/api/v1
npm install
npm run dev   # runs on http://localhost:5173
```
The app uses the same codebase for development and production; only environment variables differ.

## ⚙️ Environment Variables
### Backend (`server/.env`)
| Variable | Description |
|----------|------------|
| `PORT` | Port the Express server listens on (default `5000`). |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `CLIENT_URL` | URL of the deployed front‑end (used for CORS). |
| `ADMIN_PIN` | Owner PIN for protected routes. |

### Frontend (`client/.env`)
| Variable | Description |
|----------|------------|
| `VITE_API_URL` | Base URL for the back‑end API (e.g., `https://<render-service>.onrender.com/api/v1`). |

> **Never commit real secrets** – keep the `.env` files out of version control (`.gitignore` already excludes them).

## 📦 Production Build
```bash
# From the client folder
npm run build   # creates ./dist ready for Vercel
```
The `dist` folder is what Vercel will serve.

## 🌐 Deployment Steps
### 1️⃣ Create a MongoDB Atlas Cluster
1. Sign in to <https://cloud.mongodb.com> and create a new free cluster.
2. Add a database user (username / password) with read/write access to a database named `salon_queue`.
3. Whitelist your Render IP ranges (or set *Allow access from anywhere* for quick start).
4. Copy the connection string (`mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/salon_queue?retryWrites=true&w=majority`).

### 2️⃣ Deploy the Backend on Render
1. Log in to <https://render.com> and click **New > Web Service**.
2. Connect your GitHub repository (or push the repo) and select the `server` directory as the **Root Directory**.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment:
   - `PORT` – `10000` (or leave default, Render provides `$PORT`).
   - `MONGODB_URI` – paste the Atlas connection string.
   - `CLIENT_URL` – the Vercel URL that will host the front‑end (e.g., `https://<your-vercel>.vercel.app`).
   - `ADMIN_PIN` – choose a secure PIN.
6. Set **Health Check Path** to `/api/health`.
7. Click **Create Web Service**. Render will build and expose the service at `https://<service-name>.onrender.com`.

### 3️⃣ Deploy the Frontend on Vercel
1. Sign in to <https://vercel.com> and import the same GitHub repository.
2. In **Project Settings → Build & Output Settings**:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables (Vercel UI):
   - `VITE_API_URL` – `https://<render-service>.onrender.com/api/v1`
4. Ensure **Framework Preset** is set to **Vite**.
5. Deploy. Vercel will provide a URL like `https://salon-queue-management.vercel.app`.

### 4️⃣ CORS Configuration
The backend already reads `CLIENT_URL` from env and uses it in the CORS whitelist:
```js
import cors from 'cors';
import { getSalonSettings } from './services/queueService.js';
const app = express();
const corsOptions = {
  origin: async (origin, callback) => {
    const settings = await getSalonSettings();
    const allowed = settings?.clientUrl || process.env.CLIENT_URL;
    callback(null, allowed ? origin === allowed : false);
  },
  credentials: true,
};
app.use(cors(corsOptions));
```
Make sure `CLIENT_URL` matches the Vercel deployment URL.

### 5️⃣ Socket.IO Production Connection
- The client uses the same `VITE_API_URL` for the Socket.IO connection:
```js
import { io } from 'socket.io-client';
export const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
```
- No hard‑coded `localhost` URLs exist; after setting the env variable the connection points to the Render service.

### 6️⃣ Frontend Routing & Refresh Behavior
Vite is configured for SPA routing. Ensure the `vite.config.js` contains:
```js
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  // needed for Vercel SSR fallback
  build: { rollupOptions: { input: 'index.html' } },
});
```
When deployed, Vercel automatically serves `index.html` for unknown paths, preserving client‑side routing. No additional server‑side rewrites are required.

### 7️⃣ Verify Production
1. Open the Vercel URL, join the queue, and ensure a ticket is created in MongoDB Atlas (check via Atlas UI).
2. Open the Render health check (`/api/health`) – should return `{ success: true }`.
3. Open multiple windows (customer, barber, reception, TV) and confirm real‑time updates flow without any `localhost` references in the network tab.
4. Test CORS by making a direct `curl` request to a protected route from another origin – it should be rejected.
5. Confirm the admin PIN works on Owner pages. 

## 📌 Important Notes
- **Never commit `.env` files** – they are listed in `.gitignore`.
- For production, consider hashing the admin PIN or moving to a more robust auth (JWT, OAuth) – the current PIN method is sufficient for a simple internal tool.
- Enable **Automatic Deployments** on both Render and Vercel so pushes to `main` update live instantly.
- Monitor Render logs for any reconnection attempts of Socket.IO; increase `pingTimeout`/`pingInterval` if needed.

---
*Happy coding and enjoy a smooth, modern queue experience!*
