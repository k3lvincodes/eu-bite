import 'dotenv/config';
import { createExpressApp } from './utils/expressCompat.ts';
import webhookRouter from './routes/webhook.ts';
import telegramRouter from './routes/telegramWebhook.ts';
import { TelegramPollingService } from './services/telegramPolling.ts';
import { BotEngine } from './services/botEngine.ts';

const app = createExpressApp();
const PORT = process.env.PORT || 4001;

// Comprehensive Health Check Endpoint for Render & Uptime Monitors
const botHealthHandler = (req: any, res: any) => {
  const memory = process.memoryUsage();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'healthy',
    service: 'EU Bite Omnichannel Bot Service (WhatsApp & Telegram)',
    uptime: Math.floor(process.uptime()),
    channels: {
      whatsapp: {
        configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
        webhook: '/webhook or /webhook/whatsapp',
      },
      telegram: {
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        webhook: '/webhook/telegram or /telegram',
        pollingEnabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      },
    },
    memory: {
      rssMb: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
    },
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', botHealthHandler);
app.get('/api/health', botHealthHandler);

// Proactive Payment Confirmation Webhook
app.post('/webhook/payment-notify', async (req: any, res: any) => {
  try {
    const { orderNumber, phone, deliveryPin, restaurantName, totalNgn } = req.body;
    if (!orderNumber || !phone) {
      res.status(400).json({ success: false, error: 'orderNumber and phone are required' });
      return;
    }
    await BotEngine.notifyPaymentConfirmed({
      orderNumber,
      phone,
      deliveryPin: deliveryPin || '8850',
      restaurantName: restaurantName || 'Campus Bites & Grill',
      totalNgn: totalNgn || 0,
    });
    res.json({ success: true, message: 'Payment notification dispatched' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// WhatsApp Webhook routes
app.use('/webhook/whatsapp', webhookRouter);
app.use('/webhook', webhookRouter);

// Telegram Webhook routes
app.use('/webhook/telegram', telegramRouter);
app.use('/telegram', telegramRouter);


import { TelegramBotApi } from './services/telegramBotApi.ts';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`💬 EU Bite Omnichannel Bot Service running on http://localhost:${PORT}`);
    console.log(`🟢 WhatsApp Webhook at http://localhost:${PORT}/webhook (Simulator: POST /webhook/simulate)`);
    console.log(`✈️ Telegram Webhook at http://localhost:${PORT}/webhook/telegram (Simulator: POST /webhook/telegram/simulate)`);

    // Auto-start Telegram Polling and register bot commands menu if configured
    if (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.startsWith('your_')) {
      TelegramBotApi.setMyCommands().catch(() => {});
      TelegramPollingService.startPolling();
    }
  });
}


export default app;

