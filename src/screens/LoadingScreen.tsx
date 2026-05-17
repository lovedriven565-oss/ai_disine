import { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Armchair, Brush, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateStaging, type GenerationProgress, type GenerationStage } from '../services/replicate';
import { haptic } from '../services/telegram';

interface Props {
  style: string;
  onDone: () => void;
}

interface StepDef {
  stage: GenerationStage | 'queued';
  label: string;
  Icon: typeof CheckCircle2;
}

const STEPS: StepDef[] = [
  { stage: 'queued',             label: 'Загрузка фото',        Icon: CheckCircle2 },
  { stage: 'analyzing_geometry', label: 'Анализ геометрии',     Icon: Cpu },
  { stage: 'placing_furniture',  label: 'Расстановка мебели',   Icon: Armchair },
  { stage: 'rendering',          label: 'Финальный рендеринг',  Icon: Brush },
];

export default function LoadingScreen({ style, onDone }: Props) {
  const setLastResult = useAppStore((s) => s.setLastResult);
  const consumeCredit = useAppStore((s) => s.consumeCredit);

  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'queued',
    progress: 0,
    message: 'Подготовка...',
  });

  useEffect(() => {
    let cancelled = false;
    consumeCredit();

    (async () => {
      try {
        const res = await generateStaging(
          { style },
          (p) => {
            if (!cancelled) setProgress(p);
          },
        );
        if (cancelled) return;
        setLastResult({ before: res.output.before, after: res.output.after, style });
        haptic('success');
        onDone();
      } catch (e) {
        console.error(e);
        haptic('error');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.stage === progress.stage),
  );

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY29chiM74D1z0XistXwSUkacucUvYdPQtY2H2XN7-N1YhqWdvyV3f3A8Hu71CS_g4Oi3P328Dk6c2tuM9idkhxMoog3cUzr5m0WAD7LTRmM2hRfdA0JSHl9CQCcR9X0uKWKI2Lg3hp0__QHGZV1PQnNelxnYO2t3wSjCa6P4vWrIz-hWb0Za8zTtXKxCHSu3RC9ZFuNSdboShZAJn_Bodt3DFZLYHu0oBSvyssKjPT27Z2BZXA8_cmQsdZZ-zlPCJcAuL-vZ_2Hre')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-surface/85 backdrop-blur-[4px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        <div className="relative w-full aspect-[4/5] rounded-3xl border border-white/10 bg-surface-container/50 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-4 flex flex-col overflow-hidden">
          {/* Scanning preview */}
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/5 mb-4">
            <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY29chiM74D1z0XistXwSUkacucUvYdPQtY2H2XN7-N1YhqWdvyV3f3A8Hu71CS_g4Oi3P328Dk6c2tuM9idkhxMoog3cUzr5m0WAD7LTRmM2hRfdA0JSHl9CQCcR9X0uKWKI2Lg3hp0__QHGZV1PQnNelxnYO2t3wSjCa6P4vWrIz-hWb0Za8zTtXKxCHSu3RC9ZFuNSdboShZAJn_Bodt3DFZLYHu0oBSvyssKjPT27Z2BZXA8_cmQsdZZ-zlPCJcAuL-vZ_2Hre')] bg-cover bg-center opacity-60" />
            <div className="absolute top-1/4 left-[10%] w-[30%] h-[40%] border-2 border-primary/60 border-dashed bg-primary/10 rounded-xl flex items-center justify-center">
              <Armchair className="text-primary" size={22} />
            </div>
            <div className="absolute bottom-[10%] right-[15%] w-[40%] h-[25%] border-2 border-tertiary/50 border-dashed bg-tertiary/10 rounded-xl" />
            <div
              className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(173,198,255,0.8)] transition-all duration-300"
              style={{ top: `${20 + (progress.progress / 100) * 60}%` }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles size={20} />
            <span className="font-headline-md text-[18px] font-semibold flex-1 truncate">{progress.message}</span>
            <span className="tabular-nums font-bold">{progress.progress}%</span>
          </div>

          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(173,198,255,0.7)] transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-1.5 mt-4 text-[12px] font-medium">
            {STEPS.map((s, i) => {
              const done = i < currentIdx || progress.stage === 'succeeded';
              const active = i === currentIdx && progress.stage !== 'succeeded';
              const Icon = done ? CheckCircle2 : s.Icon;
              return (
                <div
                  key={s.label}
                  className={`flex items-center justify-between transition-colors ${
                    active ? 'text-primary' : done ? 'text-on-surface/70' : 'text-on-surface-variant/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{s.label}</span>
                  </div>
                  <span className="uppercase tracking-wider text-[10px]">
                    {done ? 'Готово' : active ? 'В работе' : 'Ожидание'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
