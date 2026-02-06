import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import ipRoutes from './routes/ips';
import attackRoutes from './routes/attacks';
import geoBlockRoutes from './routes/geoblocks';
import firewallRoutes from './routes/firewall';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ips', ipRoutes);
app.use('/api/attacks', attackRoutes);
app.use('/api/geoblocks', geoBlockRoutes);
app.use('/api/firewall', firewallRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe:ip', (ipId: string) => {
    socket.join(`ip:${ipId}`);
    console.log(`Client ${socket.id} subscribed to IP ${ipId}`);
  });

  socket.on('unsubscribe:ip', (ipId: string) => {
    socket.leave(`ip:${ipId}`);
    console.log(`Client ${socket.id} unsubscribed from IP ${ipId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
export { io };

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔌 WebSocket server ready`);
});

export default app;
