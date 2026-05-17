/**
 * Backend server.
 *
 * Exposes `/api/predict` which today returns a mocked result, but is wired
 * to drop into a real Replicate call by uncommenting the indicated block
 * and setting REPLICATE_API_TOKEN + REPLICATE_MODEL_VERSION in `.env`.
 *
 * Keeping the secret on the server is mandatory - the Replicate token must
 * NEVER ship to the browser.
 */
import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';

const app = express();
app.use(express.json({ limit: '20mb' }));

interface PredictBody {
  imageUrl?: string;
  style?: string;
}

const DEMO_AFTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK';

app.post('/api/predict', async (req: Request<unknown, unknown, PredictBody>, res: Response) => {
  const { style } = req.body ?? {};
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_MODEL_VERSION;

  // ---------- REAL REPLICATE BLOCK (commented until token is set) ----------
  // if (token && version) {
  //   const create = await fetch('https://api.replicate.com/v1/predictions', {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ version, input: { image: req.body.imageUrl, style } }),
  //   });
  //   const prediction = await create.json();
  //   // Poll prediction.urls.get until status === 'succeeded' or 'failed'.
  //   // Return { status, output } once finished.
  // }
  // -------------------------------------------------------------------------

  void token;
  void version;

  // Mock fallback: simulate ~14s of processing.
  await new Promise((r) => setTimeout(r, 14_000));
  return res.json({
    id: `srv_mock_${Date.now()}`,
    status: 'succeeded',
    output: { after: DEMO_AFTER },
    style,
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
});
