import { createRouter as Router } from '../utils/expressCompat.ts';
import { BotEngine } from '../services/botEngine.ts';

const router = Router();
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

// GET /webhook/telegram (Health & Diagnostic)
router.get('/', (req: any, res: any): void => {
  res.json({
    status: 'healthy',
    channel: 'telegram',
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    timestamp: new Date().toISOString(),
  });
});

// POST /webhook/telegram (Inbound Telegram Webhook Receiver)
router.post('/', async (req: any, res: any): Promise<void> => {
  try {
    // Verify optional secret token header from Telegram
    if (TELEGRAM_WEBHOOK_SECRET) {
      const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (headerSecret !== TELEGRAM_WEBHOOK_SECRET) {
        console.warn('[TELEGRAM WEBHOOK]: Unauthorized secret token');
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    const update = req.body;

    if (!update) {
      res.status(400).json({ success: false, error: 'No update payload' });
      return;
    }

    let chatId: string | number | undefined;
    let text = '';
    let senderName = '';

    // Handle standard message
    if (update.message) {
      chatId = update.message.chat?.id;
      text = update.message.text || '';
      senderName = update.message.from?.first_name || 'Student';
    }
    // Handle inline button callback query
    else if (update.callback_query) {
      chatId = update.callback_query.message?.chat?.id;
      text = update.callback_query.data || '';
      senderName = update.callback_query.from?.first_name || 'Student';
    }

    if (chatId && text) {
      console.log(`[TELEGRAM INBOUND <- ${chatId} (${senderName})]: "${text}"`);
      await BotEngine.handleIncomingMessage(chatId.toString(), text, 'telegram');
    }

    // Acknowledge Telegram update with 200 OK
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[TELEGRAM WEBHOOK ERROR]:', err);
    res.status(200).json({ ok: true, handled_error: true });
  }
});

// POST /webhook/telegram/simulate (Test/Dev Simulator for Telegram)
router.post('/simulate', async (req: any, res: any): Promise<void> => {
  const { chatId, message, name } = req.body;
  const targetId = chatId || 'tg_test_student_9021';
  const targetMsg = message || 'Hi';

  try {
    const result = await BotEngine.handleIncomingMessage(targetId.toString(), targetMsg, 'telegram');
    res.json({ success: true, channel: 'telegram', chatId: targetId, handled: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
