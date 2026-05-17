-- =============================================================================
--  AI-Staging: Supabase schema, RPC functions, RLS.
--
--  How to apply (one shot):
--    1. Open Supabase Studio -> SQL Editor.
--    2. Paste this whole file.
--    3. Run.
--
--  This script is idempotent: safe to re-run after edits.
--
--  Design notes:
--    - The server uses the SERVICE_ROLE key, which bypasses RLS.
--    - RLS is enabled on every table with NO policies -> anon + authenticated
--      roles are blocked by default. When we add Supabase Auth later we will
--      explicitly relax this with `auth.uid()`-based policies.
--    - All balance mutations go through SECURITY DEFINER functions to keep
--      the atomicity + idempotency invariants on the database side.
--    - Idempotency is double-keyed:
--        * `telegram_charge_id` - the strongest signal (set by TG payments).
--        * `payload`            - our app-level invoice payload nonce.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tg_id            BIGINT UNIQUE NOT NULL,
  tg_username      TEXT,
  tg_first_name    TEXT,
  tg_last_name     TEXT,
  language_code    TEXT,
  balance          INT  NOT NULL DEFAULT 1,
  total_generated  INT  NOT NULL DEFAULT 0,
  referral_code    TEXT UNIQUE NOT NULL,
  referred_by      TEXT,           -- referral_code of the inviter (nullable)
  invited_friends  INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_balance_non_negative CHECK (balance >= 0)
);

CREATE INDEX IF NOT EXISTS users_tg_id_idx         ON public.users (tg_id);
CREATE INDEX IF NOT EXISTS users_referral_code_idx ON public.users (referral_code);

-- ─── transactions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind                 TEXT NOT NULL CHECK (kind IN (
                         'signup_bonus',
                         'purchase',
                         'generation',
                         'referral_bonus',
                         'admin_adjust'
                       )),
  delta                INT  NOT NULL,           -- positive = credit, negative = debit
  balance_after        INT  NOT NULL,
  payload              TEXT,                    -- our invoice payload (unique)
  telegram_charge_id   TEXT,                    -- TG payment charge id (unique)
  pack_id              TEXT,
  meta                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_payload_unique     UNIQUE (payload),
  CONSTRAINT transactions_charge_id_unique   UNIQUE (telegram_charge_id)
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_kind_idx    ON public.transactions (kind);

-- =============================================================================
--  RPC: upsert_user_from_tg
--    Creates the user on first login, awards the signup bonus + referrer bonus.
--    On subsequent calls: refreshes profile fields, leaves balance alone.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.upsert_user_from_tg(
  p_tg_id         BIGINT,
  p_username      TEXT DEFAULT NULL,
  p_first_name    TEXT DEFAULT NULL,
  p_last_name     TEXT DEFAULT NULL,
  p_language_code TEXT DEFAULT NULL,
  p_referred_by   TEXT DEFAULT NULL
) RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user         public.users;
  v_referrer     public.users;
  v_was_inserted BOOLEAN;
BEGIN
  INSERT INTO public.users (
    tg_id, tg_username, tg_first_name, tg_last_name, language_code,
    referral_code, referred_by, balance
  )
  VALUES (
    p_tg_id, p_username, p_first_name, p_last_name, p_language_code,
    'ref_' || encode(gen_random_bytes(5), 'hex'),
    NULLIF(p_referred_by, ''),
    1                       -- signup bonus
  )
  ON CONFLICT (tg_id) DO UPDATE SET
    tg_username   = COALESCE(EXCLUDED.tg_username,   public.users.tg_username),
    tg_first_name = COALESCE(EXCLUDED.tg_first_name, public.users.tg_first_name),
    tg_last_name  = COALESCE(EXCLUDED.tg_last_name,  public.users.tg_last_name),
    language_code = COALESCE(EXCLUDED.language_code, public.users.language_code),
    updated_at    = NOW()
  RETURNING *, (xmax = 0) INTO v_user, v_was_inserted;

  IF v_was_inserted THEN
    -- Log signup bonus.
    INSERT INTO public.transactions (user_id, kind, delta, balance_after)
    VALUES (v_user.id, 'signup_bonus', 1, v_user.balance);

    -- Credit the referrer (3 free generations) if the code exists and is not self.
    IF v_user.referred_by IS NOT NULL THEN
      UPDATE public.users
      SET balance         = balance + 3,
          invited_friends = invited_friends + 1,
          updated_at      = NOW()
      WHERE referral_code = v_user.referred_by
        AND tg_id        != p_tg_id
      RETURNING * INTO v_referrer;

      IF v_referrer.id IS NOT NULL THEN
        INSERT INTO public.transactions (user_id, kind, delta, balance_after, meta)
        VALUES (
          v_referrer.id, 'referral_bonus', 3, v_referrer.balance,
          jsonb_build_object('invited_tg_id', p_tg_id)
        );
      END IF;
    END IF;
  END IF;

  RETURN v_user;
END;
$$;

-- =============================================================================
--  RPC: consume_credit
--    Atomically subtracts 1 from balance + bumps total_generated.
--    Raises 'INSUFFICIENT_CREDITS' if balance was 0.
--    The UPDATE ... WHERE balance > 0 makes this safe under concurrency: only
--    one of two parallel calls will succeed if the user had exactly 1 credit.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users;
BEGIN
  UPDATE public.users
  SET balance          = balance - 1,
      total_generated  = total_generated + 1,
      updated_at       = NOW()
  WHERE id = p_user_id AND balance > 0
  RETURNING * INTO v_user;

  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.transactions (user_id, kind, delta, balance_after)
  VALUES (v_user.id, 'generation', -1, v_user.balance);

  RETURN v_user;
END;
$$;

-- =============================================================================
--  RPC: grant_credits
--    Idempotent credit grant. Returns the user row unchanged if a transaction
--    with the same telegram_charge_id (or payload) already exists.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id             UUID,
  p_amount              INT,
  p_kind                TEXT,
  p_payload             TEXT  DEFAULT NULL,
  p_telegram_charge_id  TEXT  DEFAULT NULL,
  p_pack_id             TEXT  DEFAULT NULL,
  p_meta                JSONB DEFAULT '{}'::jsonb
) RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT' USING ERRCODE = 'P0001';
  END IF;

  -- Idempotency guard.
  IF p_telegram_charge_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.transactions WHERE telegram_charge_id = p_telegram_charge_id
  ) THEN
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    RETURN v_user;
  END IF;

  IF p_payload IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.transactions WHERE payload = p_payload
  ) THEN
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    RETURN v_user;
  END IF;

  UPDATE public.users
  SET balance    = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.transactions (
    user_id, kind, delta, balance_after, payload, telegram_charge_id, pack_id, meta
  ) VALUES (
    v_user.id, p_kind, p_amount, v_user.balance, p_payload, p_telegram_charge_id, p_pack_id, p_meta
  );

  RETURN v_user;
END;
$$;

-- =============================================================================
--  Row Level Security
--
--  We lock everything down. The server uses service_role (which bypasses RLS).
--  When we later wire Supabase Auth + JWT for direct client reads, add:
--
--    CREATE POLICY "users_select_own"
--      ON public.users FOR SELECT
--      USING ( tg_id = (auth.jwt() ->> 'tg_id')::bigint );
-- =============================================================================
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helpful comment for future readers.
COMMENT ON TABLE public.users IS
  'AI-staging user accounts. Mutations go through SECURITY DEFINER RPC only.';
COMMENT ON TABLE public.transactions IS
  'Append-only ledger. Unique (payload) and (telegram_charge_id) guarantee idempotent credit grants from webhooks.';
