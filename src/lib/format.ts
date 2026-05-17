import type { Currency } from '../store/useAppStore';

export const formatPrice = (priceRub: number, priceUsd: number, currency: Currency): string => {
  if (currency === 'RUB') {
    return `${priceRub.toLocaleString('ru-RU')} \u20BD`;
  }
  return `$${priceUsd.toLocaleString('en-US')}`;
};
