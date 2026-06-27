import { env } from '../../config/env';

export interface IWhatsAppProvider {
  sendMessage(to: string, message: string): Promise<boolean>;
}

/**
 * Meta WhatsApp Cloud API Provider
 */
export class MetaWhatsAppProvider implements IWhatsAppProvider {
  private token: string;
  private phoneNumberId: string;

  constructor() {
    this.token = env.WHATSAPP_CLOUD_API_TOKEN || '';
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  public async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.token || !this.phoneNumberId) {
      console.warn('⚠️ Meta WhatsApp Cloud API credentials missing. Skipping send.');
      return false;
    }

    const cleanPhone = to.replace(/\+/g, '').trim();
    const url = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('❌ Meta WhatsApp API error details:', JSON.stringify(data));
        return false;
      }

      console.log(`✅ Message successfully sent to ${to} via Meta WhatsApp API.`);
      return true;
    } catch (error) {
      console.error(`❌ Meta WhatsApp API network error for ${to}:`, error);
      return false;
    }
  }
}

/**
 * Twilio WhatsApp API Provider
 */
export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  private sid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.sid = env.TWILIO_SID || '';
    this.authToken = env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = env.TWILIO_WHATSAPP_NUMBER || '';
  }

  public async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.sid || !this.authToken) {
      console.warn('⚠️ Twilio WhatsApp API credentials missing. Skipping send.');
      return false;
    }

    const cleanTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const cleanFrom = this.fromNumber.startsWith('whatsapp:') ? this.fromNumber : `whatsapp:${this.fromNumber}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`;
    const basicAuth = Buffer.from(`${this.sid}:${this.authToken}`).toString('base64');

    const bodyParams = new URLSearchParams();
    bodyParams.append('To', cleanTo);
    bodyParams.append('From', cleanFrom);
    bodyParams.append('Body', message);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error('❌ Twilio WhatsApp API error details:', JSON.stringify(data));
        return false;
      }

      console.log(`✅ Message successfully sent to ${to} via Twilio WhatsApp API.`);
      return true;
    } catch (error) {
      console.error(`❌ Twilio WhatsApp API network error for ${to}:`, error);
      return false;
    }
  }
}

/**
 * Factory class for selecting and getting WhatsApp notification provider
 */
export class WhatsAppService {
  private static provider: IWhatsAppProvider | null = null;

  public static getProvider(): IWhatsAppProvider {
    if (this.provider) return this.provider;

    const providerType = env.WHATSAPP_PROVIDER;
    console.log(`🔧 Initializing WhatsApp Service using provider: ${providerType.toUpperCase()}`);

    if (providerType === 'twilio') {
      this.provider = new TwilioWhatsAppProvider();
    } else {
      this.provider = new MetaWhatsAppProvider();
    }

    return this.provider;
  }

  /**
   * Compiles the emergency template message
   */
  public static compileMessage(params: {
    patientName: string;
    trigger: string;
    timestamp: string;
    location: string;
  }): string {
    return `🚨 EMERGENCY ALERT\n\nSmart Maternal Belt has detected a medical emergency.\n\nPatient: ${params.patientName}\n\nReason:\n${params.trigger}\n\nTime:\n${params.timestamp}\n\nLocation:\n${params.location}\n\nPlease contact the patient immediately.`;
  }

  /**
   * Sends alert messages to all provided contacts in parallel
   */
  public static async sendAlertToContacts(
    contacts: Array<{ name: string; whatsapp: string }>,
    message: string
  ): Promise<boolean> {
    if (contacts.length === 0) {
      console.warn('⚠️ No contacts configured to send alerts to.');
      return false;
    }

    const provider = this.getProvider();
    const sendPromises = contacts.map(async (contact) => {
      try {
        console.log(`📨 Attempting to notify ${contact.name} (${contact.whatsapp})...`);
        return await provider.sendMessage(contact.whatsapp, message);
      } catch (err) {
        console.error(`❌ Failed to send alert to ${contact.name}:`, err);
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    const successfullySent = results.filter(Boolean).length;
    console.log(`📊 WhatsApp Alert Summary: ${successfullySent}/${contacts.length} successfully notified.`);

    return successfullySent > 0;
  }
}
