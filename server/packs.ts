/**
 * Pack catalogue - server-side source of truth.
 *
 * Mirrors `src/services/billing.ts` but additionally carries `priceStars`,
 * which is the single field charged by Telegram. Keep prices in sync.
 */

export interface ServerPack {
  id: string;
  title: string;
  generations: number;
  priceStars: number;
  priceRub: number;
  priceUsd: number;
}

export const SERVER_PACKS: ServerPack[] = [
  { id: 'starter', title: 'Starter Pack', generations: 5,  priceStars: 75,  priceRub: 299,  priceUsd: 3 },
  { id: 'pro',     title: 'Pro Pack',     generations: 20, priceStars: 250, priceRub: 990,  priceUsd: 9 },
  { id: 'studio',  title: 'Studio Pack',  generations: 60, priceStars: 700, priceRub: 2490, priceUsd: 24 },
];

export const getServerPack = (id: string): ServerPack | undefined =>
  SERVER_PACKS.find((p) => p.id === id);
