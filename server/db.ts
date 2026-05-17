/**
 * Data layer.
 *
 * Single typed gateway between the server routes and the source of truth.
 * Has two backends behind the same interface:
 *
 *   1. Supabase (production) - uses SERVICE_ROLE key, bypasses RLS, calls
 *      the SECURITY DEFINER RPC functions defined in `supabase/migrations.sql`.
 *      Atomicity + idempotency live on the database.
 *
 *   2. In-memory dev fallback - used when SUPABASE_SERVICE_ROLE_KEY is unset.
 *      Mimics the same guarantees with a Map + dedupe Sets so the rest of
 *      the codebase doesn't care whether Supabase is configured or not.
 *
 * Callers should NEVER mutate users.balance directly; always go through
 * `consumeCredit` or `grantCredits` so the transaction ledger stays accurate.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface DbUser {
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

export interface UpsertUserInput {
  tg_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language_code?: string | null;
  referred_by?: string | null;
}

export interface GrantInput {
  amount: number;
  kind: 'purchase' | 'referral_bonus' | 'admin_adjust';
  payload?: string;
  telegramChargeId?: string;
  packId?: string;
  meta?: Record<string, unknown>;
}

/** Thrown when consume_credit hits a zero balance. */
export class InsufficientCreditsError extends Error {
  constructor() {
    super('INSUFFICIENT_CREDITS');
    this.name = 'InsufficientCreditsError';
  }
}

/* ------------------------------------------------------------------ */
/*  Supabase backend                                                   */
/* ------------------------------------------------------------------ */

let supabase: SupabaseClient | null = null;

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (supabaseUrl && serviceKey) {
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // eslint-disable-next-line no-console
  console.log('[db] Supabase backend active');
} else {
  // eslint-disable-next-line no-console
  console.log('[db] Supabase keys missing - using in-memory dev backend');
}

export const isSupabaseConfigured = (): boolean => !!supabase;

/* ------------------------------------------------------------------ */
/*  In-memory fallback                                                 */
/* ------------------------------------------------------------------ */

const memUsersByTgId = new Map<number, DbUser>();
const memTxnPayloads = new Set<string>();
const memTxnCharges = new Set<string>();

const randomRef = (): string =>
  'ref_' + Math.random().toString(36).slice(2, 12);

const memUpsert = (input: UpsertUserInput): DbUser => {
  const existing = memUsersByTgId.get(input.tg_id);
  const now = new Date().toISOString();
  if (existing) {
    const updated: DbUser = {
      ...existing,
      tg_username:   input.username     ?? existing.tg_username,
      tg_first_name: input.first_name   ?? existing.tg_first_name,
      tg_last_name:  input.last_name    ?? existing.tg_last_name,
      language_code: input.language_code?? existing.language_code,
      updated_at:    now,
    };
    memUsersByTgId.set(input.tg_id, updated);
    return updated;
  }
  const fresh: DbUser = {
    id:              crypto.randomUUID(),
    tg_id:           input.tg_id,
    tg_username:     input.username    ?? null,
    tg_first_name:   input.first_name  ?? null,
    tg_last_name:    input.last_name   ?? null,
    language_code:   input.language_code ?? null,
    balance:         1,
    total_generated: 0,
    referral_code:   randomRef(),
    referred_by:     input.referred_by || null,
    invited_friends: 0,
    created_at:      now,
    updated_at:      now,
  };
  memUsersByTgId.set(input.tg_id, fresh);

  // Referral bonus to inviter (mirrors the SQL function).
  if (fresh.referred_by) {
    for (const [, u] of memUsersByTgId) {
      if (u.referral_code === fresh.referred_by && u.tg_id !== fresh.tg_id) {
        u.balance += 3;
        u.invited_friends += 1;
        u.updated_at = now;
        break;
      }
    }
  }
  return fresh;
};

const memConsume = (userId: string): DbUser => {
  for (const [, u] of memUsersByTgId) {
    if (u.id !== userId) continue;
    if (u.balance <= 0) throw new InsufficientCreditsError();
    u.balance -= 1;
    u.total_generated += 1;
    u.updated_at = new Date().toISOString();
    return u;
  }
  throw new Error('USER_NOT_FOUND');
};

const memGrant = (userId: string, g: GrantInput): DbUser => {
  if (g.amount <= 0) throw new Error('INVALID_AMOUNT');
  // Idempotency check.
  if (g.telegramChargeId && memTxnCharges.has(g.telegramChargeId)) {
    return memFind(userId);
  }
  if (g.payload && memTxnPayloads.has(g.payload)) {
    return memFind(userId);
  }
  const u = memFind(userId);
  u.balance += g.amount;
  u.updated_at = new Date().toISOString();
  if (g.telegramChargeId) memTxnCharges.add(g.telegramChargeId);
  if (g.payload) memTxnPayloads.add(g.payload);
  return u;
};

const memFind = (userId: string): DbUser => {
  for (const [, u] of memUsersByTgId) if (u.id === userId) return u;
  throw new Error('USER_NOT_FOUND');
};

const memFindByTgId = (tgId: number): DbUser | null =>
  memUsersByTgId.get(tgId) ?? null;

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function upsertUser(input: UpsertUserInput): Promise<DbUser> {
  if (supabase) {
    const { data, error } = await supabase.rpc('upsert_user_from_tg', {
      p_tg_id:         input.tg_id,
      p_username:      input.username ?? null,
      p_first_name:    input.first_name ?? null,
      p_last_name:     input.last_name ?? null,
      p_language_code: input.language_code ?? null,
      p_referred_by:   input.referred_by ?? null,
    });
    if (error) throw new Error(`[db.upsertUser] ${error.message}`);
    return data as DbUser;
  }
  return memUpsert(input);
}

export async function getUserByTgId(tgId: number): Promise<DbUser | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tg_id', tgId)
      .maybeSingle();
    if (error) throw new Error(`[db.getUserByTgId] ${error.message}`);
    return (data as DbUser | null) ?? null;
  }
  return memFindByTgId(tgId);
}

export async function consumeCredit(userId: string): Promise<DbUser> {
  if (supabase) {
    const { data, error } = await supabase.rpc('consume_credit', {
      p_user_id: userId,
    });
    if (error) {
      if (error.message.includes('INSUFFICIENT_CREDITS')) {
        throw new InsufficientCreditsError();
      }
      throw new Error(`[db.consumeCredit] ${error.message}`);
    }
    return data as DbUser;
  }
  return memConsume(userId);
}

export async function grantCredits(
  userId: string,
  input: GrantInput,
): Promise<DbUser> {
  if (supabase) {
    const { data, error } = await supabase.rpc('grant_credits', {
      p_user_id:            userId,
      p_amount:             input.amount,
      p_kind:               input.kind,
      p_payload:            input.payload ?? null,
      p_telegram_charge_id: input.telegramChargeId ?? null,
      p_pack_id:            input.packId ?? null,
      p_meta:               input.meta ?? {},
    });
    if (error) throw new Error(`[db.grantCredits] ${error.message}`);
    return data as DbUser;
  }
  return memGrant(userId, input);
}
