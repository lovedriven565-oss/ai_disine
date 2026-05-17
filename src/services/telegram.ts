/**
 * Telegram WebApp Service Layer.
 * Wraps @twa-dev/sdk and provides safe access during development (outside TG).
 */
import WebApp from '@twa-dev/sdk';

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

/** Detect whether we're inside the real Telegram client. */
export const isTelegramEnv = (): boolean => {
  try {
    return Boolean(WebApp?.initData);
  } catch {
    return false;
  }
};

/** Initialize WebApp UI (expand to full height, set theme params). */
export const initTelegram = (): void => {
  try {
    WebApp.ready();
    WebApp.expand();
    // Make the WebApp render with the Telegram background colour
    WebApp.setHeaderColor?.('#0b1326');
    WebApp.setBackgroundColor?.('#0b1326');
  } catch (e) {
    console.warn('[telegram] not in TG environment', e);
  }
};

/** Pulls the user from initDataUnsafe, with a dev fallback. */
export const getTelegramUser = (): TelegramUser => {
  try {
    const u = WebApp.initDataUnsafe?.user;
    if (u) return u as TelegramUser;
  } catch {
    /* noop */
  }
  return {
    id: 0,
    first_name: 'Guest',
    last_name: '',
    username: 'guest',
    language_code: 'en',
  };
};

/**
 * Reads the start_param sent by Telegram (set via t.me/BOT/app?startapp=XYZ).
 * Falls back to the `?tgWebAppStartParam=...` URL query for browser previews.
 */
export const getStartParam = (): string | null => {
  try {
    const fromTg = WebApp.initDataUnsafe?.start_param;
    if (fromTg) return fromTg;
  } catch {
    /* noop */
  }
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('tgWebAppStartParam') || url.searchParams.get('startapp');
  } catch {
    return null;
  }
};

/** Haptic helper that no-ops outside TG. */
export const haptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  try {
    if (type === 'success' || type === 'error') {
      WebApp.HapticFeedback?.notificationOccurred(type);
    } else {
      WebApp.HapticFeedback?.impactOccurred(type);
    }
  } catch {
    /* noop */
  }
};

/** Open native share dialog inside Telegram. */
export const shareToTelegram = (url: string, text: string): void => {
  try {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    WebApp.openTelegramLink(shareUrl);
  } catch (e) {
    console.warn('[telegram] share failed', e);
    // Web fallback
    if (navigator.share) {
      navigator.share({ url, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  }
};

/** Bot username + app short name, sourced from Vite env with safe defaults. */
export const BOT_USERNAME =
  (import.meta.env.VITE_TG_BOT_USERNAME as string | undefined) || 'AiStagingBot';
export const APP_SHORT_NAME =
  (import.meta.env.VITE_TG_APP_SHORT_NAME as string | undefined) || 'app';
