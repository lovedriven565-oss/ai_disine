/**
 * Telegram Bot API client.
 *
 * Thin wrapper around the HTTPS Bot API. Lives strictly on the server so the
 * bot token never reaches the browser. Used by:
 *   - billing routes (createInvoiceLink for Stars)
 *   - future webhook handlers (answerPreCheckoutQuery, etc.)
 */

const BOT_API = 'https://api.telegram.org/bot';

const token = (): string => {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) {
    throw new Error(
      '[telegramBot] TELEGRAM_BOT_TOKEN is not set. Add it to .env to enable real billing.',
    );
  }
  return t;
};

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BOT_API}${token()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) {
    throw new Error(`[telegramBot] ${method} failed: ${data.description}`);
  }
  return data.result as T;
}

export interface InvoiceInput {
  title: string;
  description: string;
  /** Stable identifier embedded in the invoice; echoed back in successful_payment.invoice_payload */
  payload: string;
  /** Stars amount (single LabeledPrice). */
  stars: number;
  /** Optional photo URL for the invoice preview. */
  photoUrl?: string;
}

/**
 * Creates a Telegram Stars invoice link.
 * Pass `currency: 'XTR'` and a single `LabeledPrice` per the Bot API spec.
 * Provider token must be EMPTY for Stars payments.
 */
export const createInvoiceLink = async (input: InvoiceInput): Promise<string> => {
  return call<string>('createInvoiceLink', {
    title: input.title,
    description: input.description,
    payload: input.payload,
    provider_token: '', // MUST be empty for XTR (Stars)
    currency: 'XTR',
    prices: [{ label: input.title, amount: input.stars }],
    photo_url: input.photoUrl,
    photo_width: input.photoUrl ? 512 : undefined,
    photo_height: input.photoUrl ? 512 : undefined,
  });
};

/** Used inside the webhook to ack a pre_checkout_query. */
export const answerPreCheckoutQuery = (
  id: string,
  ok: boolean,
  errorMessage?: string,
): Promise<boolean> =>
  call<boolean>('answerPreCheckoutQuery', {
    pre_checkout_query_id: id,
    ok,
    error_message: errorMessage,
  });
