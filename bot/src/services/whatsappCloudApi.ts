

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export class WhatsAppCloudApi {
  /**
   * Sends a standard text message
   */
  static async sendTextMessage(to: string, message: string): Promise<boolean> {
    console.log(`\n💬 [WHATSAPP OUTBOUND -> ${to}]:\n${message}\n`);

    if (!ACCESS_TOKEN || ACCESS_TOKEN.startsWith('EAAB...')) {
      // Running in simulation/dev mode
      return true;
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: true, body: message },
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('[WhatsApp Cloud API Error]:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[WhatsApp Network Error]:', err);
      return false;
    }
  }

  /**
   * Sends an interactive button menu
   */
  static async sendQuickReplyButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<boolean> {
    console.log(`\n🔘 [WHATSAPP BUTTONS -> ${to}]: ${bodyText} [${buttons.map((b) => b.title).join(' | ')}]`);

    if (!ACCESS_TOKEN || ACCESS_TOKEN.startsWith('EAAB...')) {
      // In dev simulation, append textual choices
      const choices = buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
      return this.sendTextMessage(to, `${bodyText}\n\n${choices}\n*(Reply with the number or title)*`);
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttons.slice(0, 3).map((b) => ({
                type: 'reply',
                reply: { id: b.id, title: b.title.slice(0, 20) },
              })),
            },
          },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[WhatsApp Cloud API Button Error]:', err);
      return false;
    }
  }
}
