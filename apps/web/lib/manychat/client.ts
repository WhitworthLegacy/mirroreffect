import { MANYCHAT_CONFIG } from "./config";

interface ManyChatContact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface ManyChatMessagePayload {
  subscriber_id: string;
  data: {
    version: "v2";
    content: {
      messages: Array<{
        type: "text" | "buttons";
        text?: string;
        buttons?: Array<{
          type: "url" | "flow";
          caption: string;
          url?: string;
          flow_ns?: string;
        }>;
      }>;
    };
  };
}

export class ManyChatClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MANYCHAT_CONFIG.apiKey;
    this.baseUrl = MANYCHAT_CONFIG.apiBaseUrl;
  }

  /**
   * Envoyer un message à un utilisateur
   */
  async sendMessage(payload: ManyChatMessagePayload): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/sending/sendContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ManyChat API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Récupérer les infos d'un contact
   */
  async getContact(subscriberId: string): Promise<ManyChatContact> {
    const response = await fetch(
      `${this.baseUrl}/subscriber/getInfo?subscriber_id=${subscriberId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ManyChat get contact error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Mettre à jour un custom field
   */
  async setCustomField(
    subscriberId: string,
    fieldName: string,
    value: string | number
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/subscriber/setCustomField`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        [fieldName]: value,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ManyChat set field error: ${response.status} - ${errorText}`);
    }
  }
}

export const manychatClient = new ManyChatClient();
