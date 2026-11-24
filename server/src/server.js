import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Initialize WebSockets
const io = initSocket(server, CLIENT_URL);

// Health & Info Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Salon Queue Management Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    socketConnectedClients: io.engine.clientsCount,
  });
});

// Seed/Placeholder route for live queue check
app.get('/api/v1/queue/live', (req, res) => {
  res.json({
    success: true,
    data: {
      waiting: [],
      called: [],
      inChair: [],
      stats: {
        totalWaiting: 0,
        workingBarbers: 3,
        estimatedWaitMinutes: 0,
      },
    },
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start HTTP & WebSocket Server immediately, then connect to MongoDB
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Salon Queue Management Server running on port ${PORT}`);
  console.log(` WebSocket ready for connections at ws://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
  
  // Connect to DB asynchronously
  connectDB();
});

export { app, server, io };
