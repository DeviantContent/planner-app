import crypto from 'crypto';

const SURGE_ACCOUNT_ID = process.env.SURGE_ACCOUNT_ID!;
const SURGE_API_KEY = process.env.SURGE_API_KEY!;
const SURGE_WEBHOOK_SECRET = process.env.SURGE_WEBHOOK_SECRET || '';

export interface SendSmsOptions {
  to: string;
  body: string;
}

export interface SmsMessage {
  id: string;
  body: string;
  from: string;
  to: string;
  created_at: string;
}

export async function sendSms({ to, body }: SendSmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://api.surge.app/accounts/${SURGE_ACCOUNT_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SURGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: {
            contact: {
              phone_number: to.startsWith('+') ? to : `+1${to}`,
            },
          },
          body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Surge SMS error:', error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Surge SMS error:', error);
    return { success: false, error: String(error) };
  }
}

export function validateWebhook(payload: string, signature: string): boolean {
  if (!SURGE_WEBHOOK_SECRET) {
    console.warn('SURGE_WEBHOOK_SECRET not set, skipping validation');
    return true;
  }

  const signatureParts = signature?.split(',') ?? [];
  let signatureTimestamp = '';
  const signatureValues: string[] = [];

  for (const part of signatureParts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      signatureTimestamp = value;
    } else if (key === 'v1') {
      signatureValues.push(value);
    }
  }

  const signaturePayload = `${signatureTimestamp}.${payload}`;

  for (const value of signatureValues) {
    const expectedSignature = crypto
      .createHmac('sha256', SURGE_WEBHOOK_SECRET)
      .update(signaturePayload)
      .digest('hex');
    if (value === expectedSignature) {
      return true;
    }
  }

  return false;
}
