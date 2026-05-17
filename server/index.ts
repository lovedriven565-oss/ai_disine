/**
 * Backend server.
 *
 * Routes:
 *   POST /api/predict                  -> AI generation entrypoint (prompt-engineered)
 *   POST /api/billing/create-invoice   -> Telegram Stars invoice link
 *   POST /api/billing/webhook          -> Telegram Bot webhook (pre_checkout / payment)
 *   GET  /api/health                   -> liveness probe
 *
 * Secrets (TELEGRAM_BOT_TOKEN, REPLICATE_API_TOKEN, ...) stay on the server.
 * The client only ever sees the safe pieces (invoice URL, generation result).
 */
import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';

import { buildPrompt } from '../shared/prompts';
import { createInvoiceLink, answerPreCheckoutQuery } from './telegramBot';
import { getServerPack } from './packs';

const app = express();
app.use(express.json({ limit: '20mb' }));

/* ------------------------------------------------------------------ */
/*  /api/predict                                                       */
/* ------------------------------------------------------------------ */

interface PredictBody {
  imageUrl?: string;
  style?: string;
  roomType?: string;
}

const DEMO_AFTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK';

app.post('/api/predict', async (req: Request<unknown, unknown, PredictBody>, res: Response) => {
  const { imageUrl, style, roomType } = req.body ?? {};

  // 1) Translate UI style -> heavy prompt + negative.
  const built = buildPrompt(style, roomType);

  // 2) Dispatch to Replicate (real if creds, mock otherwise).
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_MODEL_VERSION;

  // ---------- REAL REPLICATE BLOCK (uncomment + set env to enable) ----------
  // if (token && version) {
  //   const create = await fetch('https://api.replicate.com/v1/predictions', {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       version,
  //       input: {
  //         image: imageUrl,
  //         prompt: built.prompt,
  //         negative_prompt: built.negativePrompt,
  //         // Model-specific knobs go here:
  //         // num_inference_steps: 30,
  //         // guidance_scale: 7.5,
  //         // controlnet_conditioning_scale: 0.7,
  //       },
  //     }),
  //   });
  //   const prediction = await create.json();
  //   // TODO: poll prediction.urls.get until status === 'succeeded' or 'failed'.
  //   // Return { id, status, output: { after: <result_url> }, style: built.styleId }.
  // }
  // -------------------------------------------------------------------------

  void token;
  void version;
  void imageUrl;

  // Mock fallback: ~14s of pretend AI work.
  await new Promise((r) => setTimeout(r, 14_000));
  return res.json({
    id: `srv_mock_${Date.now()}`,
    status: 'succeeded',
    output: { after: DEMO_AFTER },
    style: built.styleId,
    // Expose prompt metadata in dev only - handy for engineering / QA.
    ...(process.env.NODE_ENV !== 'production'
      ? { _debug: { prompt: built.prompt, negativePrompt: built.negativePrompt } }
      : {}),
  });
});

/* ------------------------------------------------------------------ */
/*  /api/billing/create-invoice                                        */
/* ------------------------------------------------------------------ */

interface InvoiceBody {
  packId?: string;
  telegramUserId?: number;
}

app.post(
  '/api/billing/create-invoice',
  async (req: Request<unknown, unknown, InvoiceBody>, res: Response) => {
    const { packId, telegramUserId } = req.body ?? {};
    const pack = packId ? getServerPack(packId) : undefined;
    if (!pack) {
      return res.status(400).json({ error: `Unknown pack: ${packId}` });
    }

    // Stable payload echoed back by Telegram in `successful_payment.invoice_payload`.
    // Format: `pack:<id>:user:<tgId>:nonce:<random>`. Webhook will parse + grant credits.
    const nonce = Math.random().toString(36).slice(2, 10);
    const payload = `pack:${pack.id}:user:${telegramUserId ?? 'anon'}:nonce:${nonce}`;

    try {
      const url = await createInvoiceLink({
        title: pack.title,
        description: `${pack.generations} AI staging generations`,
        payload,
        stars: pack.priceStars,
      });
      return res.json({ url, payload, pack });
    } catch (e) {
      // Stars not configured? Fall back to a "mock URL" so frontend can still
      // demo the flow without a bot token. The frontend treats this as success
      // because development convenience > strict matching.
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
/* ------------------------------------------------------------------ */

/**
 * Telegram Bot webhook receiver.
 *
 * Wire-up steps (do these once on the server with the real bot token):
 *   1. `setWebhook` to https://<your-host>/api/billing/webhook with
 *      `secret_token = process.env.TELEGRAM_WEBHOOK_SECRET`.
 *   2. Telegram will then POST every update here. We MUST:
 *      - validate `X-Telegram-Bot-Api-Secret-Token` against our secret
 *      - reply to `pre_checkout_query` within 10 seconds
 *      - on `successful_payment`, parse `invoice_payload`, grant credits
 *        to the user (Supabase mutation) and acknowledge with 200.
 */
app.post('/api/billing/webhook', async (req: Request, res: Response) => {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = req.header('X-Telegram-Bot-Api-Secret-Token');
    if (got !== expected) {
      return res.status(401).json({ error: 'Bad webhook secret' });
    }
  }

  const update = req.body as {
    pre_checkout_query?: { id: string; invoice_payload: string };
    message?: {
      successful_payment?: {
        invoice_payload: string;
        total_amount: number;
        currency: string;
      };
      from?: { id: number };
    };
  };

  try {
    // Step A: acknowledge pre_checkout within 10s.
    if (update.pre_checkout_query) {
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return res.json({ ok: true });
    }

    // Step B: persist successful payments.
    const payment = update.message?.successful_payment;
    if (payment) {
      // TODO(supabase): parse payload, find user, credit `pack.generations`.
      // const { packId, userId } = parsePayload(payment.invoice_payload);
      // await grantCredits(userId, getServerPack(packId)!.generations);
      // eslint-disable-next-line no-console
      console.log('[billing] payment received', payment);
      return res.json({ ok: true });
    }

    return res.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[billing] webhook error', e);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/* ------------------------------------------------------------------ */
/*  Health                                                             */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
});
