/**
 * Backend server.
 *
 * Trust boundary:
 *   - The browser is hostile; we never trust client-supplied balances.
 *   - Source of truth lives in Supabase, accessed via `server/db.ts`.
 *   - Authentication is the validated Telegram `initData` HMAC (see `auth.ts`)
 *     passed in the `x-tg-init-data` header on every protected call.
 *
 * Routes:
 *   POST /api/auth/sync                -> upsert TG user, return full record
 *   POST /api/predict                  -> spend 1 credit, run AI mock/Replicate
 *   POST /api/billing/create-invoice   -> Telegram Stars invoice link
 *   POST /api/billing/webhook          -> Telegram Bot webhook (idempotent grant)
 *   GET  /api/health                   -> liveness probe
 */
import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

import { buildPrompt } from '../shared/prompts';
import { createInvoiceLink, answerPreCheckoutQuery } from './telegramBot';
import { getServerPack } from './packs';
import { verifyInitData, type VerifiedInitData } from './auth';
import {
  upsertUser,
  consumeCredit,
  grantCredits,
  getUserByTgId,
  InsufficientCreditsError,
  isSupabaseConfigured,
  type DbUser,
} from './db';

const app = express();
app.use(express.json({ limit: '20mb' }));

/* ------------------------------------------------------------------ */
/*  Auth middleware                                                    */
/* ------------------------------------------------------------------ */

interface AuthedRequest extends Request {
  tg?: VerifiedInitData;
}

const attachInitData = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const raw = req.header('x-tg-init-data');
  req.tg = verifyInitData(raw);
  next();
};

/** Identifies + upserts the user for the current request. */
async function resolveUser(req: AuthedRequest): Promise<DbUser | null> {
  // Prefer verified TG user; fall back to body.telegramUserId in dev.
  const tg = req.tg;
  const bodyTgId = (req.body as { telegramUserId?: number } | undefined)?.telegramUserId;

  let tgId = tg?.user?.id;
  if (!tgId && tg?.devMode) tgId = bodyTgId;
  if (!tgId) return null;

  // In prod, require HMAC-verified payload.
  if (!tg?.devMode && !tg?.trusted) return null;

  return upsertUser({
    tg_id:        tgId,
    username:     tg?.user?.username ?? null,
    first_name:   tg?.user?.first_name ?? null,
    last_name:    tg?.user?.last_name ?? null,
    language_code: tg?.user?.language_code ?? null,
    referred_by:  tg?.start_param ?? null,
  });
}

app.use('/api', attachInitData);

/* ------------------------------------------------------------------ */
/*  /api/auth/sync                                                     */
/* ------------------------------------------------------------------ */

interface AuthSyncBody {
  telegramUserId?: number;
  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  };
  referredBy?: string;
}

app.post(
  '/api/auth/sync',
  async (req: AuthedRequest, res: Response) => {
    try {
      const body = (req.body ?? {}) as AuthSyncBody;
      const tg = req.tg;

      // Resolve identity: HMAC-verified TG user > dev body.
      let tgId = tg?.user?.id;
      let username = tg?.user?.username;
      let firstName = tg?.user?.first_name;
      let lastName = tg?.user?.last_name;
      let language = tg?.user?.language_code;
      let referredBy = tg?.start_param;

      if (!tgId && tg?.devMode && body.telegramUserId) {
        tgId = body.telegramUserId;
        username = body.user?.username;
        firstName = body.user?.first_name;
        lastName = body.user?.last_name;
        language = body.user?.language_code;
        referredBy = body.referredBy;
      }

      if (!tgId) return res.status(400).json({ error: 'tg_id_required' });
      if (!tg?.devMode && !tg?.trusted) {
        return res.status(401).json({ error: 'untrusted_init_data' });
      }

      const user = await upsertUser({
        tg_id: tgId,
        username,
        first_name: firstName,
        last_name: lastName,
        language_code: language,
        referred_by: referredBy ?? null,
      });

      return res.json({ user });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[auth/sync] error', e);
      return res.status(500).json({ error: 'sync_failed' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  /api/predict (PROTECTED)                                           */
/*    Atomically consumes 1 credit BEFORE running the AI pipeline.     */
/* ------------------------------------------------------------------ */

interface PredictBody {
  imageUrl?: string;
  style?: string;
  roomType?: string;
  telegramUserId?: number; // dev fallback only
}

const DEMO_AFTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK';

app.post(
  '/api/predict',
  async (req: AuthedRequest, res: Response<unknown, Record<string, unknown>>) => {
    const body = (req.body ?? {}) as PredictBody;

    // 1) Identify user.
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    // 2) Charge upfront. If balance is 0, we 403 BEFORE invoking the model.
    let chargedUser: DbUser;
    try {
      chargedUser = await consumeCredit(user.id);
    } catch (e) {
      if (e instanceof InsufficientCreditsError) {
        return res
          .status(403)
          .json({ error: 'insufficient_credits', balance: user.balance });
      }
      // eslint-disable-next-line no-console
      console.error('[predict] consumeCredit failed', e);
      return res.status(500).json({ error: 'charge_failed' });
    }

    // 3) Translate style -> heavy prompt.
    const built = buildPrompt(body.style, body.roomType);

    // 4) Dispatch to Replicate (real if creds, mock otherwise).
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const replicateVersion = process.env.REPLICATE_MODEL_VERSION;

    // ---------- REAL REPLICATE BLOCK (uncomment when ready) ------------
    // if (replicateToken && replicateVersion) {
    //   const create = await fetch('https://api.replicate.com/v1/predictions', {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${replicateToken}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       version: replicateVersion,
    //       input: { image: body.imageUrl, prompt: built.prompt, negative_prompt: built.negativePrompt },
    //     }),
    //   });
    //   // ...poll prediction until succeeded/failed; on failure -> refund:
    //   //   await grantCredits(user.id, { amount: 1, kind: 'admin_adjust',
    //   //                                meta: { reason: 'refund_failed_generation' } });
    // }
    // --------------------------------------------------------------------
    void replicateToken;
    void replicateVersion;

    // Mock ~14s.
    await new Promise((r) => setTimeout(r, 14_000));

    return res.json({
      id: `srv_mock_${Date.now()}`,
      status: 'succeeded',
      output: { after: DEMO_AFTER },
      style: built.styleId,
      balance: chargedUser.balance,
      user: chargedUser,
      ...(process.env.NODE_ENV !== 'production'
        ? { _debug: { prompt: built.prompt, negativePrompt: built.negativePrompt } }
        : {}),
    });
  },
);

/* ------------------------------------------------------------------ */
/*  /api/billing/create-invoice                                        */
/* ------------------------------------------------------------------ */

interface InvoiceBody {
  packId?: string;
  telegramUserId?: number;
}

app.post(
  '/api/billing/create-invoice',
  async (req: AuthedRequest, res: Response) => {
    const { packId } = (req.body ?? {}) as InvoiceBody;
    const pack = packId ? getServerPack(packId) : undefined;
    if (!pack) {
      return res.status(400).json({ error: `Unknown pack: ${packId}` });
    }

    const tgId =
      req.tg?.user?.id ??
      (req.tg?.devMode ? (req.body as InvoiceBody).telegramUserId : undefined);

    const nonce = Math.random().toString(36).slice(2, 10);
    const payload = `pack:${pack.id}:user:${tgId ?? 'anon'}:nonce:${nonce}`;

    try {
      const url = await createInvoiceLink({
        title: pack.title,
        description: `${pack.generations} AI staging generations`,
        payload,
        stars: pack.priceStars,
      });
      return res.json({ url, payload, pack });
    } catch (e) {
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        return res.json({
          url: `mock://invoice/${pack.id}/${nonce}`,
          payload,
          pack,
          mock: true,
        });
      }
      // eslint-disable-next-line no-console
      console.error('[billing] createInvoiceLink failed', e);
      return res.status(502).json({ error: 'Failed to create invoice' });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  /api/billing/webhook                                               */
/*                                                                     */
/*  Telegram Bot webhook. Validates secret_token, acks pre_checkout,   */
/*  grants credits idempotently for successful_payment.                */
/*                                                                     */
/*  Setup: setWebhook(url, secret_token = $TELEGRAM_WEBHOOK_SECRET)    */
/* ------------------------------------------------------------------ */

interface TgUpdate {
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    invoice_payload: string;
    total_amount: number;
    currency: string;
  };
  message?: {
    from?: { id: number };
    successful_payment?: {
      invoice_payload: string;
      total_amount: number;
      currency: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id?: string;
    };
  };
}

/** Parse "pack:<id>:user:<tgId>:nonce:<rand>" payloads safely. */
const parsePayload = (raw: string): { packId: string; tgId: number | null } | null => {
  const m = /^pack:([^:]+):user:([^:]+):nonce:[^:]+$/.exec(raw);
  if (!m) return null;
  const tg = Number(m[2]);
  return { packId: m[1], tgId: Number.isFinite(tg) ? tg : null };
};

app.post('/api/billing/webhook', async (req: Request, res: Response) => {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = req.header('X-Telegram-Bot-Api-Secret-Token');
    if (got !== expected) {
      return res.status(401).json({ error: 'bad_webhook_secret' });
    }
  }

  const update = req.body as TgUpdate;

  try {
    // 1) Acknowledge pre_checkout within 10s. We always accept here, because
    //    Stars cannot be reversed: the real validation is "pack exists".
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;
      const parsed = parsePayload(q.invoice_payload);
      const valid = !!parsed && !!getServerPack(parsed.packId);
      await answerPreCheckoutQuery(
        q.id,
        valid,
        valid ? undefined : 'Invalid invoice payload',
      );
      return res.json({ ok: true });
    }

    // 2) Persist successful payment.
    const sp = update.message?.successful_payment;
    if (sp) {
      const parsed = parsePayload(sp.invoice_payload);
      const tgId = parsed?.tgId ?? update.message?.from?.id;
      const pack = parsed ? getServerPack(parsed.packId) : null;
      if (!parsed || !pack || !tgId) {
        // eslint-disable-next-line no-console
        console.warn('[webhook] bad payload', sp.invoice_payload);
        return res.json({ ok: true }); // ack to TG; don't crash retries
      }

      // Make sure the user exists (idempotent).
      const user = await upsertUser({ tg_id: tgId });

      await grantCredits(user.id, {
        amount: pack.generations,
        kind: 'purchase',
        payload: sp.invoice_payload,
        telegramChargeId: sp.telegram_payment_charge_id,
        packId: pack.id,
        meta: {
          total_amount: sp.total_amount,
          currency: sp.currency,
          provider_charge_id: sp.provider_payment_charge_id,
        },
      });
      return res.json({ ok: true });
    }

    return res.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[webhook] error', e);
    // Always 200 to TG so it doesn't keep retrying poison payloads forever.
    return res.json({ ok: true });
  }
});

/* ------------------------------------------------------------------ */
/*  Health + debug                                                     */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    telegram: !!process.env.TELEGRAM_BOT_TOKEN,
    replicate: !!process.env.REPLICATE_API_TOKEN,
  }),
);

// Dev convenience: read a user by tg_id (NEVER expose in production).
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/_dev/user/:tgId', async (req, res) => {
    const u = await getUserByTgId(Number(req.params.tgId));
    return res.json({ user: u });
  });
}

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
});
