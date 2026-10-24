import { WhatsAppCloudApi } from './whatsappCloudApi.ts';
import { TelegramBotApi } from './telegramBotApi.ts';
import type { UserSession } from './conversationState.ts';

export interface InteractiveOption {
  id: string;
  title: string;
  description?: string;
}

export class ChannelService {
  /**
   * Dispatches text message through the user's active channel (WhatsApp or Telegram)
   */
  static async sendMessage(session: UserSession, message: string): Promise<boolean> {
    if (session.channel === 'telegram') {
      return TelegramBotApi.sendTextMessage(session.phone, message);
    }
    return WhatsAppCloudApi.sendTextMessage(session.phone, message);
  }

  /**
   * Dispatches quick options or interactive buttons across channels
   */
  static async sendQuickReplyButtons(
    session: UserSession,
    bodyText: string,
    buttons: Array<InteractiveOption>
  ): Promise<boolean> {
    if (session.channel === 'telegram') {
      // Create inline buttons: grid of 2 per row if more than 2 buttons
      const rows: Array<Array<{ text: string; callback_data: string }>> = [];
      let currentRow: Array<{ text: string; callback_data: string }> = [];

      for (const btn of buttons) {
        currentRow.push({ text: btn.title, callback_data: btn.id });
        if (currentRow.length >= 2) {
          rows.push(currentRow);
          currentRow = [];
        }
      }
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      return TelegramBotApi.sendInlineKeyboard(session.phone, bodyText, rows);
    }

    return WhatsAppCloudApi.sendQuickReplyButtons(session.phone, bodyText, buttons);
  }

  /**
   * Dispatches an interactive list on WhatsApp, or inline keyboard on Telegram
   */
  static async sendInteractiveList(
    session: UserSession,
    bodyText: string,
    buttonLabel: string,
    options: Array<InteractiveOption>,
    headerText?: string
  ): Promise<boolean> {
    if (session.channel === 'telegram') {
      return this.sendQuickReplyButtons(session, bodyText, options);
    }
    return WhatsAppCloudApi.sendInteractiveList(session.phone, bodyText, buttonLabel, options, headerText);
  }
}
