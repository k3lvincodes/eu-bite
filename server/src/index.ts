import { createExpressApp } from './utils/expressCompat.ts';

import authRoutes from './routes/auth.routes.ts';
import restaurantRoutes from './routes/restaurants.routes.ts';
import packagingRoutes from './routes/packaging.routes.ts';
import orderRoutes from './routes/orders.routes.ts';
import dispatchRoutes from './routes/dispatch.routes.ts';
import paymentRoutes from './routes/payments.routes.ts';
import adminRoutes from './routes/admin.routes.ts';
import whatsappBridgeRoutes from './routes/whatsapp-bridge.routes.ts';
import { checkDbHealth } from './db/index.ts';

const app = createExpressApp();
const PORT = process.env.PORT || 4000;

// Comprehensive Health Check Endpoint for Render & Uptime Monitors (UptimeRobot / BetterStack)
const healthHandler = async (req: any, res: any) => {
  const dbHealth = await checkDbHealth();
  const memory = process.memoryUsage();

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'healthy',
    platform: 'EU Bite Central API',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db: dbHealth,
    memory: {
      rssMb: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
    },
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/system/health', healthHandler);

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bot-bridge', whatsappBridgeRoutes);

const isMain = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMain && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 EU Bite Central API running on http://localhost:${PORT}`);
    console.log(`🔒 WhatsApp Bot Bridge enabled on /api/bot-bridge`);
  });
}

export default app;
