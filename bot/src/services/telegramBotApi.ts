/**
 * Telegram Bot API Service
 * Handles outbound messaging and interactions with Telegram's Bot API
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export class TelegramBotApi {
  /**
   * Registers default slash commands in the native Telegram Bot Menu
   */
  static async setMyCommands(): Promise<boolean> {
    if (
      process.env.NODE_ENV === 'test' ||
      !TELEGRAM_BOT_TOKEN ||
      TELEGRAM_BOT_TOKEN.startsWith('your_') ||
      TELEGRAM_BOT_TOKEN === 'mock_token'
    ) {
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`;
      const commands = [
        { command: 'start', description: '🚀 Start / Welcome Menu' },
        { command: 'menu', description: '🍽️ Browse Campus Restaurants' },
        { command: 'cart', description: '🛒 View & Edit Tray' },
        { command: 'track', description: '📍 Track Active Order & PIN' },
        { command: 'profile', description: '👤 My Room & Contact Info' },
        { command: 'help', description: '📞 Campus Hotline & Support' },
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });

      const data: any = await res.json();
      if (data.ok) {
        console.log('✅ Telegram Default Bot Commands Menu registered successfully!');
      } else {
        console.warn('⚠️ Could not set Telegram commands:', data);
      }
      return !!data.ok;
    } catch (err) {
      console.warn('⚠️ Failed to register Telegram bot commands:', err);
      return false;
    }
  }

  /**
   * Converts simple Markdown formatted text to Telegram-safe HTML
   */
  private static formatToSafeHtml(text: string): string {
    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    safe = safe.replace(/\*([^*]+)\*/g, '<b>$1</b>');
    safe = safe.replace(/_([^_]+)_/g, '<i>$1</i>');
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');

    return safe;
  }

  /**
   * Sends a standard text message to a Telegram chat with HTML formatting
   */
  static async sendTextMessage(
    chatId: string | number,
    message: string,
    replyMarkup?: any
  ): Promise<boolean> {
    console.log(`\n✈️ [TELEGRAM OUTBOUND -> ${chatId}]:\n${message}\n`);

    if (
      process.env.NODE_ENV === 'test' ||
      !TELEGRAM_BOT_TOKEN ||
      TELEGRAM_BOT_TOKEN.startsWith('your_') ||
      TELEGRAM_BOT_TOKEN === 'mock_token' ||
      String(chatId).startsWith('tg_')
    ) {
      return true;
    }

    const htmlMessage = this.formatToSafeHtml(message);

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const body: Record<string, any> = {
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };

      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[Telegram HTML Send failed, falling back to plain text]:', errorText);

        const retryRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
          }),
        });

        if (!retryRes.ok) {
          const finalErr = await retryRes.text();
          console.error('[Telegram Bot API Fatal Error]:', finalErr);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('[Telegram Network Error]:', err);
      return false;
    }
  }

  /**
   * Sends an interactive inline keyboard
   */
  static async sendInlineKeyboard(
    chatId: string | number,
    text: string,
    buttons: TelegramInlineButton[][]
  ): Promise<boolean> {
    const replyMarkup = {
      inline_keyboard: buttons,
    };
    return this.sendTextMessage(chatId, text, replyMarkup);
  }

  /**
   * Registers webhook with Telegram servers
   */
  static async setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.startsWith('your_')) {
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secretToken,
          allowed_updates: ['message', 'callback_query'],
        }),
      });
      const data: any = await res.json();
      return !!data.ok;
    } catch (err) {
      console.error('[Telegram SetWebhook Error]:', err);
      return false;
    }
  }
}
