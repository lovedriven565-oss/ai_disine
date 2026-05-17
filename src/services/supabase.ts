/**
 * Backend API client (frontend).
 *
 * Thin fetch wrapper around our Express routes. The browser NEVER talks to
 * Supabase directly: the server uses the service-role key and is the single
 * source of truth. The frontend just hits HTTP and updates the local store.
 *
 * Every protected call ships the verified `Telegram.WebApp.initData` blob
 * in the `x-tg-init-data` header so the server can HMAC-validate it.
 */
import WebApp from '@twa-dev/sdk';

export interface ServerUser {
  id: string;
  tg_id: number;
  tg_username: string | null;
  tg_first_name: string | null;
  tg_last_name: string | null;
  language_code: string | null;
  balance: number;
  total_generated: number;
  referral_code: string;
  referred_by: string | null;
  invited_friends: number;
  created_at: string;
  updated_at: string;
}

/** Build common headers, attaching initData when available. */
const headers = (): HeadersInit => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const initData = WebApp?.initData;
    if (initData) h['x-tg-init-data'] = initData;
  } catch {
    /* not in Telegram */
  }
  return h;
};

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(path, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      balance?: number;
    };
    const e = new Error(err.error || `HTTP ${res.status}`) as Error & {
      status: number;
      balance?: number;
    };
    e.status = res.status;
    e.balance = err.balance;
    throw e;
  }
  return res.json() as Promise<T>;
};

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface SyncUserInput {
  telegramUserId: number;
  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  };
  referredBy?: string | null;
}

/**
 * Boot-time call: ensures the user exists server-side and returns the
 * authoritative profile (balance, referral state, etc).
 */
export const syncUser = (input: SyncUserInput): Promise<{ user: ServerUser }> =>
  post<{ user: ServerUser }>('/api/auth/sync', input);
