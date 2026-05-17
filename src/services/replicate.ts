/**
 * Replicate API Service Layer.
 *
 * The current implementation is a MOCK with realistic latency (~15s) and
 * progressive status callbacks. When wiring real Replicate, replace
 * `generateStagingMock` with a real `fetch('/api/replicate/predictions')`
 * flow - the public signature of `generateStaging` must stay the same.
 */

import WebApp from '@twa-dev/sdk';

export type GenerationStage =
  | 'queued'
  | 'analyzing_geometry'
  | 'placing_furniture'
  | 'rendering'
  | 'succeeded'
  | 'failed';

export interface GenerationProgress {
  stage: GenerationStage;
  /** 0-100 */
  progress: number;
  message: string;
}

export interface GenerationRequest {
  imageUrl?: string;
  style: string;
  roomType?: string;
  /** Dev-mode fallback so the backend can identify the user without initData. */
  telegramUserId?: number;
}

export interface GenerationResult {
  id: string;
  status: 'succeeded' | 'failed';
  output: {
    before: string;
    after: string;
  };
  durationMs: number;
  /** Authoritative balance after the server charged for the generation. */
  balance?: number;
}

/** Thrown when the server rejected the call because of zero balance. */
export class InsufficientCreditsError extends Error {
  status = 403;
  balance: number;
  constructor(balance: number) {
    super('insufficient_credits');
    this.name = 'InsufficientCreditsError';
    this.balance = balance;
  }
}

const DEMO_BEFORE =
  'https://lh3.googleusercontent.com/aida/ADBb0ugaplghrz_oaJY6SIdBcLyEG2MPaveTfWVDruU1uh7YnfwHRgY-wNsF5-fW4X1OMd53MC31xK0HmJOMSQklDI9DrO6mL2_hR3IiazSTs1iOFCNRC_tMhL_Vv_bqR18GI-1zkAKiS8lMJaXU02sBTraWRVSTabQZ_F037YwjjVWXM8VIVwsfamYVsVZHfaHsJPOJOT9K1id6acZl_9RLWlyTVnA-ssmlx1ULbY-6cDnVwEFw5SqISEzYPI0';
const DEMO_AFTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Public, production-ready entrypoint. Always call this from screens.
 *
 * Default: pure client-side mock with progress callbacks.
 * If `VITE_USE_BACKEND === 'true'`, calls our Express /api/predict endpoint
 * while still emitting client-side progress events so UX stays identical
 * when we later flip the backend to real Replicate.
 */
export async function generateStaging(
  req: GenerationRequest,
  onProgress?: (p: GenerationProgress) => void,
): Promise<GenerationResult> {
  const useBackend = (import.meta.env.VITE_USE_BACKEND as string | undefined) === 'true';
  if (useBackend) {
    return generateViaBackend(req, onProgress);
  }
  return generateStagingMock(req, onProgress);
}

async function generateViaBackend(
  req: GenerationRequest,
  onProgress?: (p: GenerationProgress) => void,
): Promise<GenerationResult> {
  const startedAt = Date.now();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const initData = WebApp?.initData;
    if (initData) headers['x-tg-init-data'] = initData;
  } catch {
    /* not in TG */
  }

  // Fire the request first so we can short-circuit on 403 instead of waiting
  // the full 14s of mock progress.
  const apiPromise = fetch('/api/predict', {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });

  const progressPromise = generateStagingMock(req, onProgress);

  const apiRes = await apiPromise;
  if (apiRes.status === 403) {
    const body = (await apiRes.json().catch(() => ({}))) as { balance?: number };
    throw new InsufficientCreditsError(body.balance ?? 0);
  }
  if (!apiRes.ok) {
    throw new Error(`Generation failed: HTTP ${apiRes.status}`);
  }
  const api = (await apiRes.json()) as {
    id?: string;
    status?: 'succeeded' | 'failed';
    output?: { after?: string };
    balance?: number;
  };

  // Make sure the UX progress finishes before we resolve.
  await progressPromise;

  return {
    id: api.id ?? `api_${Date.now()}`,
    status: api.status ?? 'succeeded',
    output: {
      before: req.imageUrl || DEMO_BEFORE,
      after: api.output?.after || DEMO_AFTER,
    },
    durationMs: Date.now() - startedAt,
    balance: api.balance,
  };
}

async function generateStagingMock(
  _req: GenerationRequest,
  onProgress?: (p: GenerationProgress) => void,
): Promise<GenerationResult> {
  const startedAt = Date.now();

  const steps: { stage: GenerationStage; message: string; durationMs: number; toProgress: number }[] = [
    { stage: 'queued',              message: 'Постановка в очередь...',     durationMs: 800,  toProgress: 8 },
    { stage: 'analyzing_geometry',  message: 'Анализируем геометрию...',    durationMs: 4500, toProgress: 40 },
    { stage: 'placing_furniture',   message: 'Расставляем мебель...',       durationMs: 5500, toProgress: 75 },
    { stage: 'rendering',           message: 'Рендеринг финального кадра...',durationMs: 4200, toProgress: 99 },
  ];

  let prevProgress = 0;
  for (const step of steps) {
    const startProgress = prevProgress;
    const targetProgress = step.toProgress;
    const ticks = 12;
    const tickMs = step.durationMs / ticks;

    onProgress?.({ stage: step.stage, progress: startProgress, message: step.message });

    for (let i = 1; i <= ticks; i++) {
      await sleep(tickMs);
      const p = startProgress + ((targetProgress - startProgress) * i) / ticks;
      onProgress?.({ stage: step.stage, progress: Math.round(p), message: step.message });
    }
    prevProgress = targetProgress;
  }

  onProgress?.({ stage: 'succeeded', progress: 100, message: 'Готово' });

  return {
    id: `mock_${Date.now()}`,
    status: 'succeeded',
    output: { before: DEMO_BEFORE, after: DEMO_AFTER },
    durationMs: Date.now() - startedAt,
  };
}
