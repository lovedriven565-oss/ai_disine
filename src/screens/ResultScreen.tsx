import { Share2, RefreshCw, Sparkles, ShoppingBag } from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import TopAppBar from '../components/ui/TopAppBar';
import { useAppStore } from '../store/useAppStore';
import { formatPrice } from '../lib/format';
import { haptic, shareToTelegram } from '../services/telegram';
import { ALL_STYLES } from '../../shared/prompts';

const STYLE_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  ALL_STYLES.map((s) => [s.id, s.label]),
);

const PRODUCTS = [
  {
    name: 'Grey Sofa',
    priceRub: 45900,
    priceUsd: 459,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDp8xd6un2tNwRZCY2qaO1Zbr-IE-CXbM2QU8OQ1JmVKk82RbGvhuy7YSc19GKnBf6TDOcIA-3p2IuibqB48XUqpwu4y0Kz9BTH_sQ3oWwcAWZxCQyetxwgT12d619IsNS3CufI8JXI7QxpyZD5BF0Da7BFkDdkHo97zMWgwWQjP2lBJrxKGUaWrIJBLV2qaudaQGQfcCUzrkPIOCnLCCaLgGneMbJuvtPamYWnsN1QP3JgCQKL-1N3ywyLsc-fkB26O2gxvmjKKqSh',
  },
  {
    name: 'Oak Coffee Table',
    priceRub: 12500,
    priceUsd: 125,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1keC0GhixSDtt_G_fPQQhKcIkd9LKS1kxoWZMJRS1MfhVOqdBfePUvV-hIAOxh34pbBjLn30DgvsSInC_YRSMu6VAhqcfa6goi6M6WyDFnBnRxZmnced6sRuVjosC09wx9sJLFqD-_Mf0Hy1yC8fhym3u7mY6TDpDi-jd_N4bg3hvrzhFWpGnUGQhafud6ZuoNSi1RlsSLoZLH6dsGpO5xOse1v5-eyUJ1VF9_x7_YdR1GfDrwJd3s7T7E4wNYWWkK_xNp1e6pUxM',
  },
  {
    name: 'Floor Lamp',
    priceRub: 8900,
    priceUsd: 89,
    img: '/screen.png',
    fallback:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAEvr37l8-c-l3sXWpa8J8NcQMmqR5XMCpSzyrIvUkqtVO63OCDezYVgz3IIADENWebOY1kyI5Oer91Ly_LKQQu2d7EVZoxvukjSKDROi6N8F1Z8_j3xGHhLDPLWZ4NyIeoo4NONnGOVC5Ddf60IiUPCxFSBvtLCgirByV2alayHX6X8DJ-G5MUZkuxMr_lGZ7u4Ls0Ke2AJo8ApTHYnCk0CGUI6zU24LB-zNgXZSx4-7PbcOiavohpqNNBK_ITDyKovEgMMy_1sfys',
  },
];

interface Props {
  onReset: () => void;
}

export default function ResultScreen({ onReset }: Props) {
  const lastResult = useAppStore((s) => s.lastResult);
  const currency = useAppStore((s) => s.currency);
  const balance = useAppStore((s) => s.balance);
  const openPaywall = useAppStore((s) => s.openPaywall);

  const before = lastResult?.before;
  const after = lastResult?.after;
  const styleLabel = STYLE_LABEL_BY_ID[lastResult?.style || 'scandinavian'] || 'AI Staged';

  const handleShare = () => {
    haptic('medium');
    shareToTelegram(after || window.location.href, 'Посмотри, как ИИ обставил мою комнату.');
  };

  const handleReset = () => {
    haptic('light');
    if (balance <= 0) {
      openPaywall();
      return;
    }
    onReset();
  };

  return (
    <div className="min-h-screen pt-14 pb-44">
      <TopAppBar title="AI Staging" onBack={onReset} onClose={onReset} />

      <main>
        {/* Hero compare */}
        <section className="relative w-full h-[45vh]">
          {before && after ? (
            <ReactCompareSlider
              itemOne={<ReactCompareSliderImage src={before} alt="До" />}
              itemTwo={<ReactCompareSliderImage src={after} alt="После" />}
              className="w-full h-full"
              style={{ borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' }}
            />
          ) : (
            <div className="w-full h-full bg-surface-variant" />
          )}

          <div className="absolute bottom-4 left-4 bg-surface-container/70 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-md pointer-events-none">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-on-surface">{styleLabel}</span>
          </div>
        </section>

        {/* Products carousel */}
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline-md text-[18px] font-semibold text-on-surface">Мебель в интерьере</h2>
            <span className="text-[12px] text-on-surface-variant">Партнёрские товары</span>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar -mx-4 px-4 snap-x">
            {PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="snap-start flex-none w-[230px] bg-surface-container/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-md"
              >
                <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={p.img}
                    onError={(e) => {
                      if (p.fallback) (e.currentTarget as HTMLImageElement).src = p.fallback;
                    }}
                    alt={p.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                <h3 className="font-semibold text-[15px] text-on-surface truncate">{p.name}</h3>
                <p className="text-[13px] text-on-surface-variant mb-3">
                  {formatPrice(p.priceRub, p.priceUsd, currency)}
                </p>
                <button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-semibold py-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5">
                  <ShoppingBag size={14} />
                  Купить
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom actions */}
      <div className="fixed bottom-20 left-0 w-full px-4 z-30 pb-3 bg-gradient-to-t from-background via-background/90 to-transparent pt-6">
        <div className="flex flex-col gap-2.5 max-w-md mx-auto">
          <button
            onClick={handleShare}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(59,130,246,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            Поделиться с клиентом
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-transparent border border-white/15 text-on-surface font-semibold py-3.5 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Сделать еще
          </button>
        </div>
      </div>
    </div>
  );
}
