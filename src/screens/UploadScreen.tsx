import { useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { Sparkles, Zap, Check, ImagePlus, X } from 'lucide-react';
import TopAppBar from '../components/ui/TopAppBar';
import { useAppStore } from '../store/useAppStore';
import { haptic } from '../services/telegram';

const STYLES = [
  {
    id: 'scandinavian',
    label: 'Скандинавский',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsbKw5UkXdZ8xHDFSFguPVhuaE1F1j87EN7FMrrU3Dj5BQVcGKVenQUJu9DIdTrjYqf4c8SnBsW4Zn5IRO-7IfF5q_Uy0AlTIyuYGkl_xsXB6cEW7gMyxoJ0XHHMMl5oI4H6hkM4-IDATFWUTFvzJVAFAWBjgXa8ZejbmlubrMLIi6qNWlzSZovdc9LoT2CcrxqlJtu704tOxDBs9jjWUKJFiBCl3u0u7Jsu4mO7VsNYzcd2RQfTXaTbQdKNans1cdU531J6rm6xAo',
  },
  {
    id: 'loft',
    label: 'Лофт',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBQiCCd3qudKk6_uQB1ZxfzkoCpNSJRaG0F_X1NeZgwxHW_kzuiy3-vSCbGK93kr467XNGGU9gluS12WQTsu33ChCJTOMabjcHw0thgIypbndjE6BIA2FkvA1ZDznkQ6XkSgBdOB34txuMdpVrTEruyZQ21647ydJf8HVCaNprwwqjWMVf_LktdYEIFXIw9xIgoYnZ3jSwzGB34b_eMWV35GySsFQDTf1DtGhgdRIYq3Fm8-DK7d-CMV7Q8yott7ZqlCyU8dmaXpkB',
  },
  {
    id: 'neoclassic',
    label: 'Неоклассика',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7ybKcdNYtoL9zFL0LPo1uIlsv_UM7fN-hF4av_SDSpHb8Na5hxvtO7hVpBZ-dlHDnu9fYcyk2pAt40RL2qaRFxc4Y5eP6EKkS2QEqIMZpZGtpvXEAQQbaLyKM57BYTIHVnpRX8sfM553cycKyc8hl17Y7bDqX10PoBcGdfYy9gJ5AsaMz6nMRATSxKm8jiUwHNAEVo5tmgxWariJRTr-jx1gEUR1HReTiy0VcObyoufxoacs9oqCmmUqNwOkdpGuBUhAevfcG_esk',
  },
];

const DEMO_BEFORE =
  'https://lh3.googleusercontent.com/aida/ADBb0ugaplghrz_oaJY6SIdBcLyEG2MPaveTfWVDruU1uh7YnfwHRgY-wNsF5-fW4X1OMd53MC31xK0HmJOMSQklDI9DrO6mL2_hR3IiazSTs1iOFCNRC_tMhL_Vv_bqR18GI-1zkAKiS8lMJaXU02sBTraWRVSTabQZ_F037YwjjVWXM8VIVwsfamYVsVZHfaHsJPOJOT9K1id6acZl_9RLWlyTVnA-ssmlx1ULbY-6cDnVwEFw5SqISEzYPI0';
const DEMO_AFTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK';

interface Props {
  onGenerate: (style: string) => void;
}

export default function UploadScreen({ onGenerate }: Props) {
  const [selectedStyle, setSelectedStyle] = useState<string>('scandinavian');
  const [sliderPos, setSliderPos] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const balance = useAppStore((s) => s.balance);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const uploadedPhoto = useAppStore((s) => s.uploadedPhoto);
  const uploadedFileName = useAppStore((s) => s.uploadedFileName);
  const setUploadedPhoto = useAppStore((s) => s.setUploadedPhoto);
  const showToast = useAppStore((s) => s.showToast);

  const handlePickFile = () => {
    haptic('light');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({ kind: 'error', message: 'Загрузите файл с изображением' });
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast({ kind: 'error', message: 'Размер фото больше 12 МБ' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhoto(reader.result as string, file.name);
      haptic('success');
    };
    reader.onerror = () => showToast({ kind: 'error', message: 'Не удалось прочитать файл' });
    reader.readAsDataURL(file);
  };

  const clearPhoto = (e: MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    setUploadedPhoto(null);
  };

  const handleGenerate = () => {
    haptic('medium');
    if (!uploadedPhoto) {
      showToast({ kind: 'info', message: 'Сначала загрузите фото комнаты' });
      handlePickFile();
      return;
    }
    if (balance <= 0) {
      openPaywall();
      return;
    }
    onGenerate(selectedStyle);
  };

  return (
    <div className="min-h-screen pt-14 pb-32">
      <TopAppBar
        title="AI Staging"
        rightSlot={
          <button
            onClick={() => {
              haptic('light');
              openPaywall();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-white/15 bg-white/[0.04] text-on-surface text-[12px] font-semibold hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            <Zap size={13} className="text-primary" />
            <span className="tabular-nums">{balance}</span>
          </button>
        }
      />

      <main className="px-4 pt-4 flex flex-col gap-5">
        {/* Upload zone */}
        <section className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadedPhoto ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handlePickFile}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePickFile()}
              className="group relative w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-surface-container shadow-lg active:scale-[0.99] transition-transform cursor-pointer"
            >
              <img src={uploadedPhoto} alt="Загруженное фото" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[12px] text-on-surface font-medium truncate">
                    {uploadedFileName || 'Фото комнаты'}
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant px-2 py-1 rounded-full border border-white/10 bg-white/[0.06]">
                  Заменить
                </span>
              </div>
              <button
                onClick={clearPhoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-on-surface hover:bg-background/90 active:scale-90 transition-all"
                aria-label="Удалить фото"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePickFile}
              className="relative w-full h-44 rounded-2xl border-2 border-dashed border-primary/50 hover:border-primary overflow-hidden bg-surface-container flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors px-4 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-1">
                <ImagePlus size={22} />
              </div>
              <p className="text-[15px] text-on-surface font-semibold">Загрузить фото комнаты</p>
              <p className="text-[12px] text-on-surface-variant">PNG / JPG / HEIC до 12 МБ</p>
            </button>
          )}
        </section>

        {/* Magic slider */}
        <section className="flex flex-col gap-2">
          <h2 className="font-headline-md text-[18px] font-semibold text-on-surface">Магия ИИ</h2>
          <div
            className="relative w-full h-[30vh] rounded-2xl overflow-hidden bg-surface-variant select-none shadow-lg touch-none"
            onPointerDown={(e) => {
              const el = e.currentTarget;
              const move = (ev: PointerEvent) => {
                const rect = el.getBoundingClientRect();
                const x = Math.min(Math.max(0, ev.clientX - rect.left), rect.width);
                setSliderPos((x / rect.width) * 100);
              };
              const up = () => {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
              };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
              move(e.nativeEvent);
            }}
          >
            <img src={DEMO_AFTER} alt="После" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={DEMO_BEFORE}
                alt="До"
                className="absolute inset-y-0 left-0 h-full object-cover"
                style={{ width: `${100 * (100 / Math.max(sliderPos, 0.0001))}%`, maxWidth: 'none' }}
              />
              <div className="absolute bottom-3 left-3 bg-surface/80 backdrop-blur-md text-on-surface text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
                До
              </div>
            </div>

            <div className="absolute bottom-3 right-3 bg-surface/80 backdrop-blur-md text-on-surface text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
              После
            </div>

            <div
              className="absolute inset-y-0 w-[3px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] -translate-x-1/2 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            />
            <div
              className="absolute top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex items-center justify-center text-background pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5l-5 7 5 7V5zm8 0v14l5-7-5-7z" />
              </svg>
            </div>
          </div>
        </section>

        {/* Style picker */}
        <section className="flex flex-col gap-3">
          <h2 className="font-headline-md text-[18px] font-semibold text-on-surface">Выберите стиль</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 no-scrollbar">
            {STYLES.map((style) => {
              const active = style.id === selectedStyle;
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    haptic('light');
                    setSelectedStyle(style.id);
                  }}
                  className={`snap-start shrink-0 w-40 rounded-2xl p-2.5 flex flex-col gap-2.5 relative overflow-hidden text-left transition-all active:scale-95 border ${
                    active
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/60'
                      : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-surface-variant">
                    <img
                      src={style.img}
                      alt={style.label}
                      className={`w-full h-full object-cover ${active ? '' : 'opacity-80'}`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[13px] font-semibold ${
                        active ? 'text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      {style.label}
                    </span>
                    {active && (
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-surface" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* CTA */}
      <div className="fixed bottom-24 left-0 w-full px-4 z-40 flex justify-center pointer-events-none">
        <button
          onClick={handleGenerate}
          className="pointer-events-auto w-full max-w-md bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-[16px] py-4 px-6 rounded-2xl shadow-[0_8px_24px_rgba(59,130,246,0.45)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Sparkles size={20} />
          <span>{balance > 0 ? 'Сгенерировать интерьер' : 'Пополнить и продолжить'}</span>
        </button>
      </div>
    </div>
  );
}
