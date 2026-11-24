import { Server } from 'socket.io';

let ioInstance = null;

/**
 * Initialize Socket.IO with CORS settings and standard salon rooms.
 */
export const initSocket = (server, clientUrl) => {
  const io = new Server(server, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join Global Queue Room (TV display & Reception)
    socket.on('join:global', () => {
      socket.join('queue:global');
      console.log(`[Socket.IO] ${socket.id} joined room: queue:global`);
    });

    // Join Customer Personal Tracker Room
    socket.on('join:customer', (queueId) => {
      if (queueId) {
        const room = `customer:${queueId}`;
        socket.join(room);
        console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
      }
    });

    // Join Barber Station Room
    socket.on('join:barber', (barberId) => {
      if (barberId) {
        const room = `barber:${barberId}`;
        socket.join(room);
        console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected (${socket.id}): ${reason}`);
    });
  });

  ioInstance = io;
  return io;
};

/**
 * Export socket instance for emitting events from controllers and services
 */
export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return ioInstance;
};
