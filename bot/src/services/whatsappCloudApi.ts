

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
   * Sends an interactive list message (supports up to 10 items with descriptions)
   */
  static async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonLabel: string,
    rows: Array<{ id: string; title: string; description?: string }>,
    headerText?: string
  ): Promise<boolean> {
    console.log(`\n📋 [WHATSAPP LIST -> ${to}]: ${bodyText} [${rows.map((r) => r.title).join(' | ')}]`);

    if (!ACCESS_TOKEN || ACCESS_TOKEN.startsWith('EAAB...')) {
      // In dev simulation, append textual choices
      const choices = rows
        .map((r, i) => `${i + 1}. ${r.title}${r.description ? ` (${r.description})` : ''}`)
        .join('\n');
      return this.sendTextMessage(to, `${bodyText}\n\n${choices}\n*(Reply with the number or title)*`);
    }

    try {
      const sanitizedButton = (buttonLabel || 'Select Option').slice(0, 20);
      const sanitizedRows = rows.slice(0, 10).map((r) => ({
        id: r.id.slice(0, 200),
        title: r.title.slice(0, 24),
        description: r.description ? r.description.slice(0, 72) : undefined,
      }));

      const interactivePayload: Record<string, any> = {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: sanitizedButton,
          sections: [
            {
              title: (headerText || 'Options').slice(0, 24),
              rows: sanitizedRows,
            },
          ],
        },
      };

      if (headerText) {
        interactivePayload.header = { type: 'text', text: headerText.slice(0, 60) };
      }

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
          interactive: interactivePayload,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('[WhatsApp Cloud API List Error]:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[WhatsApp Network Error]:', err);
      return false;
    }
  }

  /**
   * Sends quick reply buttons (up to 3) or auto-converts to an interactive list when > 3
   */
  static async sendQuickReplyButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string; description?: string }>
  ): Promise<boolean> {
    if (buttons.length > 3) {
      return this.sendInteractiveList(to, bodyText, 'View Options', buttons);
    }

    console.log(`\n🔘 [WHATSAPP BUTTONS -> ${to}]: ${bodyText} [${buttons.map((b) => b.title).join(' | ')}]`);

    if (!ACCESS_TOKEN || ACCESS_TOKEN.startsWith('EAAB...')) {
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
                reply: { id: b.id.slice(0, 200), title: b.title.slice(0, 20) },
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
