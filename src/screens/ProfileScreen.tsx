import { useState } from 'react';
import { Gift, Copy, Check, Share2, Sparkles, Zap, Users, TrendingUp } from 'lucide-react';
import TopAppBar from '../components/ui/TopAppBar';
import { useAppStore, useReferralUrl, REFERRAL_BONUS_AMOUNT } from '../store/useAppStore';
import { haptic, shareToTelegram } from '../services/telegram';

export default function ProfileScreen() {
  const user = useAppStore((s) => s.user);
  const balance = useAppStore((s) => s.balance);
  const totalGenerated = useAppStore((s) => s.totalGenerated);
  const invited = useAppStore((s) => s.invitedFriends);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const registerReferralBonus = useAppStore((s) => s.registerReferralBonus);
  const referralUrl = useReferralUrl();
  const [copied, setCopied] = useState(false);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Гость';
  const initials = (user?.first_name?.[0] || 'G').toUpperCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      haptic('success');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };

  const handleShare = () => {
    haptic('medium');
    shareToTelegram(
      referralUrl,
      `Сделай профессиональный стейджинг любой комнаты за 15 секунд. Лови ${REFERRAL_BONUS_AMOUNT} бесплатных генерации по моей ссылке.`,
    );
  };

  return (
    <div className="min-h-screen pt-14 pb-28">
      <TopAppBar title="Профиль" />

      <main className="px-4 pt-4 flex flex-col gap-4">
        {/* User card */}
        <section className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container/70 backdrop-blur-xl border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-surface font-bold text-xl shadow-[0_8px_24px_rgba(173,198,255,0.25)]">
            {user?.photo_url ? (
              <img src={user.photo_url} alt={displayName} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-on-surface truncate">{displayName}</div>
            <div className="text-[13px] text-on-surface-variant truncate">
              {user?.username ? `@${user.username}` : 'Telegram user'}
            </div>
          </div>
        </section>

        {/* Balance card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2547] via-[#171f33] to-[#0e1730] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-on-surface-variant text-[12px] uppercase tracking-wider font-semibold">
                <Zap size={14} className="text-primary" />
                Баланс
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[44px] leading-none font-bold text-on-surface tabular-nums">{balance}</span>
                <span className="text-on-surface-variant text-sm">генераций</span>
              </div>
            </div>
            <button
              onClick={() => {
                haptic('medium');
                openPaywall();
              }}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_8px_20px_rgba(59,130,246,0.4)] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={16} />
              Пополнить
            </button>
          </div>

          <div className="relative grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] uppercase tracking-wider">
                <TrendingUp size={12} />
                Создано
              </div>
              <div className="mt-1 text-xl font-bold text-on-surface tabular-nums">{totalGenerated}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3">
              <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] uppercase tracking-wider">
                <Users size={12} />
                Приглашено
              </div>
              <div className="mt-1 text-xl font-bold text-on-surface tabular-nums">{invited}</div>
            </div>
          </div>
        </section>

        {/* Referral block */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-surface-container/70 backdrop-blur-xl p-5">
          <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

          <div className="relative flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Gift size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-headline-md text-[18px] font-semibold text-on-surface leading-tight">
                Пригласи друга
              </h3>
              <p className="text-[14px] text-on-surface-variant mt-1">
                Получай <span className="text-primary font-semibold">{REFERRAL_BONUS_AMOUNT} генерации</span> за
                каждого друга, который запустит приложение.
              </p>
            </div>
          </div>

          {/* Link */}
          <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-background/50 border border-white/10 px-3.5 py-3">
            <span className="font-mono text-[12px] text-on-surface/80 truncate flex-1">{referralUrl}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center text-on-surface"
              aria-label="Copy link"
            >
              {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="relative grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={handleShare}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-3 rounded-2xl shadow-[0_8px_20px_rgba(59,130,246,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              Поделиться
            </button>
            <button
              onClick={() => {
                // DEV helper: simulate a friend joining
                haptic('success');
                registerReferralBonus();
              }}
              className="border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-on-surface font-semibold py-3 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Users size={18} />
              Симулировать +1
            </button>
          </div>
        </section>

        {/* Roadmap / Info */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-on-surface-variant leading-relaxed">
          <p>
            <span className="text-on-surface font-semibold">Готовится:</span> синхронизация баланса между
            устройствами, история генераций и платный шлюз через Telegram Stars.
          </p>
        </section>
      </main>
    </div>
  );
}
