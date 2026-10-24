import { createRouter as Router } from '../utils/expressCompat.ts';
import { BotEngine } from '../services/botEngine.ts';

const router = Router();
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'eu_bite_meta_webhook_verify_token_2026';

// GET /webhook
router.get('/', (req: any, res: any): void => {
  const mode = req.query?.['hub.mode'];
  const token = req.query?.['hub.verify_token'];
  const challenge = req.query?.['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WHATSAPP WEBHOOK] Verified successfully with Meta!');
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json({ success: false, error: 'Forbidden: Invalid verification token' });
});

// POST /webhook
router.post('/', async (req: any, res: any): Promise<void> => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from;
        let text = '';

        if (message.type === 'text') {
          text = message.text.body;
        } else if (message.type === 'interactive') {
          if (message.interactive.type === 'button_reply') {
            text = message.interactive.button_reply.id || message.interactive.button_reply.title;
          } else if (message.interactive.type === 'list_reply') {
            text = message.interactive.list_reply.id || message.interactive.list_reply.title;
          }
        }

        if (text) {
          console.log(`[WHATSAPP INBOUND <- ${from}]: "${text}"`);
          await BotEngine.handleIncomingMessage(from, text);
        }
      }

      res.status(200).send('EVENT_RECEIVED');
      return;
    }

    res.status(404).send('Not Found');
  } catch (err: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]:', err);
    res.status(200).send('ERROR_HANDLED');
  }
});

// POST /simulate
router.post('/simulate', async (req: any, res: any): Promise<void> => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    res.status(400).json({ success: false, error: 'phone and message are required' });
    return;
  }

  const result = await BotEngine.handleIncomingMessage(phone, message);
  res.json({ success: true, handled: result });
});

export default router;
