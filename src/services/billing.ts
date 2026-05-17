/**
 * Billing Service Layer.
 *
 * Currently MOCKED - resolves after a short delay to simulate a successful
 * checkout. Production wiring options:
 *   - Telegram Stars (WebApp.openInvoice + bot-side createInvoiceLink)
 *   - External gateway (YooKassa / Stripe) opened via WebApp.openLink
 */

export interface Pack {
  id: string;
  generations: number;
  priceRub: number;
  priceUsd: number;
  popular?: boolean;
  bonusLabel?: string;
}

export const PACKS: Pack[] = [
  { id: 'starter', generations: 5,  priceRub: 299,  priceUsd: 3 },
  { id: 'pro',     generations: 20, priceRub: 990,  priceUsd: 9, popular: true, bonusLabel: '-25%' },
  { id: 'studio',  generations: 60, priceRub: 2490, priceUsd: 24, bonusLabel: '-45%' },
];

export interface PurchaseResult {
  ok: boolean;
  pack: Pack;
  transactionId: string;
}

/** Pick a pack by id. */
export const getPack = (id: string): Pack | undefined => PACKS.find((p) => p.id === id);

/** MOCKED checkout. Replace internals with real provider call. */
export async function purchasePack(packId: string): Promise<PurchaseResult> {
  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown pack: ${packId}`);
  await new Promise((r) => setTimeout(r, 1400));
  return {
    ok: true,
    pack,
    transactionId: `mock_tx_${Date.now()}`,
  };
}
