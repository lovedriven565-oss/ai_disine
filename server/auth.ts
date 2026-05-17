/**
 * Telegram initData verification.
 *
 * Implements the HMAC-SHA-256 scheme documented at
 *   https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Flow:
 *   1. The browser passes `Telegram.WebApp.initData` (a urlencoded string)
 *      as `x-tg-init-data` HTTP header on every API call.
 *   2. We strip the `hash` param, sort the rest, build a `data_check_string`,
 *      derive `secret_key = HMAC_SHA256("WebAppData", bot_token)`,
 *      then compare `HMAC_SHA256(secret_key, data_check_string)` to the hash.
 *
 *  In dev (no TELEGRAM_BOT_TOKEN), we accept any payload but still parse the
 *  user JSON so the rest of the request pipeline behaves identically.
 */
import { createHmac } from 'node:crypto';

export interface TgUserPayload {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export interface VerifiedInitData {
  user: TgUserPayload | null;
  start_param: string | null;
  /** True only if HMAC matched (real Telegram traffic). */
  trusted: boolean;
  /** Set when running without TELEGRAM_BOT_TOKEN. */
  devMode: boolean;
}

const DEV_FALLBACK: VerifiedInitData = {
  user: null,
  start_param: null,
  trusted: false,
  devMode: true,
};

/** Parse the initData urlencoded string into key/value pairs. */
const parsePairs = (raw: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const part of raw.split('&')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    map.set(decodeURIComponent(part.slice(0, i)), decodeURIComponent(part.slice(i + 1)));
  }
  return map;
};

const safeJson = <T>(s: string | undefined): T | null => {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
};

export function verifyInitData(rawInitData: string | undefined): VerifiedInitData {
  if (!rawInitData) {
    return process.env.TELEGRAM_BOT_TOKEN ? { ...DEV_FALLBACK, devMode: false } : DEV_FALLBACK;
  }

  const pairs = parsePairs(rawInitData);
  const hash = pairs.get('hash');
  pairs.delete('hash');

  const user = safeJson<TgUserPayload>(pairs.get('user'));
  const start_param = pairs.get('start_param') || null;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    // Dev: accept whatever the client sends.
    return { user, start_param, trusted: false, devMode: true };
  }
  if (!hash) {
    return { user, start_param, trusted: false, devMode: false };
  }

  const dataCheckString = [...pairs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return {
    user,
    start_param,
    trusted: computed === hash,
    devMode: false,
  };
}
