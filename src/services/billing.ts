/**
 * Billing Service - Telegram Stars.
 *
 * Production flow:
 *   1. `purchasePack(packId)` -> POST /api/billing/create-invoice
 *      Server safely calls Bot API `createInvoiceLink` (currency: 'XTR')
 *      and returns a t.me/$invoice/... URL.
 *   2. We hand that URL to `WebApp.openInvoice(url, cb)`.
 *   3. Telegram triggers the native Stars sheet. The callback resolves with
 *      one of: 'paid' | 'cancelled' | 'failed' | 'pending'.
 *   4. On 'paid' we optimistically credit the local balance. The server-side
 *      webhook (`/api/billing/webhook`) is the source of truth and will
 *      reconcile via Supabase once wired.
 *
 * Dev fallback: if no bot token is configured, the server returns a
 * `mock://invoice/...` URL and we simulate success after a short delay.
 */
import WebApp from '@twa-dev/sdk';

export interface Pack {
  id: string;
  title: string;
  generations: number;
  priceStars: number;
  priceRub: number;
  priceUsd: number;
  popular?: boolean;
  bonusLabel?: string;
}

/** Keep in sync with `server/packs.ts`. */
export const PACKS: Pack[] = [
  { id: 'starter', title: 'Starter Pack', generations: 5,  priceStars: 75,  priceRub: 299,  priceUsd: 3 },
  { id: 'pro',     title: 'Pro Pack',     generations: 20, priceStars: 250, priceRub: 990,  priceUsd: 9, popular: true, bonusLabel: '-25%' },
  { id: 'studio',  title: 'Studio Pack',  generations: 60, priceStars: 700, priceRub: 2490, priceUsd: 24, bonusLabel: '-45%' },
];

export const getPack = (id: string): Pack | undefined => PACKS.find((p) => p.id === id);

export type PurchaseStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

export interface PurchaseResult {
  status: PurchaseStatus;
  pack: Pack;
  payload: string;
}

interface CreateInvoiceResponse {
  url: string;
  payload: string;
  mock?: boolean;
}

const createInvoice = async (packId: string, telegramUserId?: number): Promise<CreateInvoiceResponse> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const initData = WebApp?.initData;
    if (initData) headers['x-tg-init-data'] = initData;
  } catch {
    /* not in TG */
  }
  const res = await fetch('/api/billing/create-invoice', {
    method: 'POST',
    headers,
    body: JSON.stringify({ packId, telegramUserId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Invoice creation failed (${res.status})`);
  }
  return res.json();
};

/**
 * Drives the full Telegram Stars checkout for a given pack.
 * Resolves with the final transaction status reported by Telegram.
 */
export async function purchasePack(packId: string, telegramUserId?: number): Promise<PurchaseResult> {
  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown pack: ${packId}`);

  const invoice = await createInvoice(packId, telegramUserId);

  // Dev / non-Telegram fallback: server returned a mock URL or we're not in TG.
  const inTelegram = !!(WebApp && WebApp.initData);
  if (invoice.mock || !inTelegram || !invoice.url.startsWith('https://')) {
    await new Promise((r) => setTimeout(r, 1200));
    return { status: 'paid', pack, payload: invoice.payload };
  }

  // Real Stars flow via native invoice sheet.
  const status = await new Promise<PurchaseStatus>((resolve) => {
    try {
      WebApp.openInvoice(invoice.url, (s) => resolve(s as PurchaseStatus));
    } catch (e) {
      console.warn('[billing] openInvoice threw', e);
      resolve('failed');
    }
  });

  return { status, pack, payload: invoice.payload };
}
