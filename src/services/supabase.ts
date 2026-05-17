/**
 * Supabase Service Layer (stub).
 *
 * Not yet wired. Reserved for: user profile sync, generations log,
 * referral tracking and billing webhooks. All public functions return
 * resolved promises so callers can integrate without crashes.
 */

export interface UserProfile {
  telegram_id: number;
  balance: number;
  referral_code: string;
  referred_by?: string;
  created_at: string;
}

/** Fetch / upsert user on first launch. Stubbed for now. */
export async function upsertUser(_telegramId: number): Promise<UserProfile | null> {
  // TODO: real Supabase client + RLS-protected upsert
  return null;
}

export async function getProfile(_telegramId: number): Promise<UserProfile | null> {
  return null;
}

/** Append a transaction (purchase / referral bonus / free generation). */
export async function logTransaction(_data: {
  telegram_id: number;
  type: 'purchase' | 'referral' | 'free' | 'spend';
  amount: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  // TODO
}
