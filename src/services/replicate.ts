/**
 * Replicate API Service Layer.
 *
 * The current implementation is a MOCK with realistic latency (~15s) and
 * progressive status callbacks. When wiring real Replicate, replace
 * `generateStagingMock` with a real `fetch('/api/replicate/predictions')`
 * flow - the public signature of `generateStaging` must stay the same.
 */

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
  style: string; // e.g. 'scandinavian' | 'loft' | 'neoclassic'
}

export interface GenerationResult {
  id: string;
  status: 'succeeded' | 'failed';
  output: {
    before: string;
    after: string;
  };
  durationMs: number;
}

const DEMO_BEFORE =
  'https://lh3.googleusercontent.com/aida/ADBb0ugaplghrz_oaJY6SIdBcLyEG2MPaveTfWVDruU1uh7YnfwHRgY-wNsF5-fW4X1OMd53MC31xK0HmJOMSQklDI9DrO6mL2_hR3IiazSTs1iOFCNRC_tMhL_Vv_bqR18GI-1zkAKiS8lMJaXU02sBTraWRVSTabQZ_F037YwjjVWXM8VIVwsfamYVsVZHfaHsJPOJOT9K1id6acZl_9RLWlyTVnA-ssmlx1ULbY-6cDnVwEFw5SqISEzYPI0';
const DEMO_AFTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Public, production-ready entrypoint. Always call this from screens.
 * Today: returns a mock. Tomorrow: swap the body for a real Replicate call.
 */
export async function generateStaging(
  req: GenerationRequest,
  onProgress?: (p: GenerationProgress) => void,
): Promise<GenerationResult> {
  return generateStagingMock(req, onProgress);
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
