import { BotEngine } from './botEngine.ts';

let isPolling = false;
let pollingAbortController: AbortController | null = null;

export class TelegramPollingService {
  /**
   * Starts long-polling Telegram for updates.
   * Useful for local development without needing ngrok/public domain.
   */
  static async startPolling(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.startsWith('your_') || token === 'mock_token') {
      console.log('ℹ️ Telegram Polling skipped (no valid TELEGRAM_BOT_TOKEN provided)');
      return;
    }

    if (isPolling) {
      console.log('⚠️ Telegram Polling is already running');
      return;
    }

    isPolling = true;
    pollingAbortController = new AbortController();

    console.log('🚀 Starting Telegram Long Polling for @' + (process.env.TELEGRAM_BOT_USERNAME || 'bot') + '...');

    // 1. Delete any existing webhook to enable getUpdates
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
      console.log('✅ Webhook cleared: Telegram Long Polling active! Send /start to @' + (process.env.TELEGRAM_BOT_USERNAME || 'bot') + ' in Telegram.');
    } catch (err) {
      console.warn('Could not clear webhook before polling:', err);
    }

    let offset = 0;

    // 2. Continuous polling loop
    (async () => {
      while (isPolling) {
        try {
          const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20&allowed_updates=["message","callback_query"]`;
          const res = await fetch(url, { signal: pollingAbortController?.signal });

          if (!res.ok) {
            console.warn(`[Telegram Polling Error]: HTTP ${res.status}`);
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }

          const data = (await res.json()) as { ok: boolean; result: any[] };

          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              offset = update.update_id + 1;

              // Handle incoming message
              if (update.message && update.message.text) {
                const chatId = String(update.message.chat.id);
                const text = update.message.text;
                console.log(`📥 [Telegram Incoming from ${update.message.from?.first_name || chatId}]: "${text}"`);

                try {
                  await BotEngine.handleIncomingMessage(chatId, text, 'telegram');
                } catch (handleErr) {
                  console.error('[Error handling Telegram message]:', handleErr);
                }
              }

              // Handle callback query (inline button clicks)
              if (update.callback_query) {
                const chatId = String(update.callback_query.message.chat.id);
                const data = update.callback_query.data;
                console.log(`📥 [Telegram Button Click from ${chatId}]: "${data}"`);

                try {
                  // Acknowledge button click in Telegram UI
                  fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: update.callback_query.id }),
                  }).catch(() => {});

                  await BotEngine.handleIncomingMessage(chatId, data, 'telegram');
                } catch (handleErr) {
                  console.error('[Error handling Telegram callback]:', handleErr);
                }
              }
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            break;
          }
          console.warn('[Telegram Polling network glitch, retrying in 3s...]:', err.message || err);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    })();
  }

  static stopPolling(): void {
    if (isPolling) {
      isPolling = false;
      if (pollingAbortController) {
        pollingAbortController.abort();
        pollingAbortController = null;
      }
      console.log('🛑 Telegram Polling stopped.');
    }
  }
}
