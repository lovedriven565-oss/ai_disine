import { useState } from 'react';
import { X, Sparkles, Check, Loader2, Zap, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PACKS, purchasePack, type Pack } from '../services/billing';
import { formatPrice } from '../lib/format';
import { haptic } from '../services/telegram';

export default function Paywall() {
  const open = useAppStore((s) => s.paywallOpen);
  const closePaywall = useAppStore((s) => s.closePaywall);
  const addCredits = useAppStore((s) => s.addCredits);
  const refreshFromServer = useAppStore((s) => s.refreshFromServer);
  const currency = useAppStore((s) => s.currency);
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const [selectedId, setSelectedId] = useState<string>('pro');
  const [loading, setLoading] = useState(false);
  const [successPack, setSuccessPack] = useState<Pack | null>(null);

  if (!open) return null;

  const selected = PACKS.find((p) => p.id === selectedId)!;

  const handlePay = async () => {
    haptic('medium');
    setLoading(true);
    try {
      const res = await purchasePack(selectedId, user?.id);
      if (res.status === 'paid') {
        // Optimistic instant UX...
        addCredits(res.pack.generations);
        setSuccessPack(res.pack);
        haptic('success');
        showToast({ kind: 'success', message: `+${res.pack.generations} генерации зачислены` });
        // ...then reconcile with the server (webhook is the source of truth).
        // Small delay so the webhook has a chance to land before we re-read.
        setTimeout(() => {
          void refreshFromServer();
        }, 1500);
        setTimeout(() => {
          setSuccessPack(null);
          closePaywall();
        }, 1600);
      } else if (res.status === 'cancelled') {
        showToast({ kind: 'info', message: 'Оплата отменена' });
      } else if (res.status === 'pending') {
        showToast({ kind: 'info', message: 'Платёж в обработке. Баланс обновится автоматически.' });
      } else {
        haptic('error');
        showToast({ kind: 'error', message: 'Оплата не прошла. Попробуйте снова.' });
      }
    } catch (e) {
      console.error(e);
      haptic('error');
      showToast({ kind: 'error', message: 'Ошибка создания счёта' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md animate-[fadeIn_.25s_ease]"
        onClick={() => !loading && closePaywall()}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md mx-auto bg-surface-container/85 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.5)] p-5 pb-8 animate-[slideUp_.3s_ease]">
        {/* Grabber */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="font-headline-md text-[20px] font-semibold text-on-surface leading-tight">
                Пополнить генерации
              </h2>
              <p className="text-[13px] text-on-surface-variant">Выгоднее в больших пакетах</p>
            </div>
          </div>
          <button
            onClick={() => !loading && closePaywall()}
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-white/5 active:scale-90 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Packs */}
        <div className="flex flex-col gap-2.5 mb-5">
          {PACKS.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  haptic('light');
                  setSelectedId(p.id);
                }}
                className={`relative w-full text-left rounded-2xl p-4 border transition-all active:scale-[.99] ${
                  active
                    ? 'border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(173,198,255,0.15)]'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        active ? 'bg-primary text-surface' : 'bg-white/10 text-on-surface'
                      }`}
                    >
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface">{p.generations} генераций</span>
                        {p.popular && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary text-surface">
                            Popular
                          </span>
                        )}
                      </div>
                      {p.bonusLabel && (
                        <div className="text-[12px] text-primary font-medium mt-0.5">{p.bonusLabel} к цене</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-on-surface flex items-center gap-1 justify-end">
                      <Star size={14} className="text-yellow-300 fill-yellow-300" />
                      <span className="tabular-nums">{p.priceStars}</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      ≈ {formatPrice(p.priceRub, p.priceUsd, currency)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handlePay}
          disabled={loading || !!successPack}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-70 text-white font-semibold text-[16px] py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(59,130,246,0.45)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Обработка...
            </>
          ) : successPack ? (
            <>
              <Check size={18} />
              +{successPack.generations} генераций
            </>
          ) : (
            <>
              <Star size={18} className="fill-yellow-300 text-yellow-300" />
              Купить за {selected.priceStars} Stars
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-on-surface-variant mt-3 px-4 leading-relaxed">
          Оплата в Telegram Stars · мгновенное начисление после платежа.
          <br />
          Нажимая «Купить», вы соглашаетесь с условиями сервиса.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
