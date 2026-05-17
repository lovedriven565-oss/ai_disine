/**
 * Global Application Store (Zustand).
 *
 * Holds user, balance and navigation. Persisted to localStorage so the
 * free generation grant + balance + earned referrals survive reloads
 * during the mock phase. When Supabase comes online, the persistence
 * layer should be swapped for a remote sync.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getTelegramUser, type TelegramUser, BOT_USERNAME, APP_SHORT_NAME } from '../services/telegram';

export type Tab = 'create' | 'profile';
export type CreateStep = 'upload' | 'loading' | 'result';

export type Currency = 'RUB' | 'USD';

interface AppState {
  // session
  user: TelegramUser | null;
  initialized: boolean;
  currency: Currency;

  // navigation
  tab: Tab;
  createStep: CreateStep;

  // domain
  balance: number;
  totalGenerated: number;
  referralCode: string;
  invitedFriends: number;
  paywallOpen: boolean;

  // last result
  lastResult: { before: string; after: string; style: string } | null;

  // actions
  initSession: () => void;
  setTab: (tab: Tab) => void;
  setCreateStep: (s: CreateStep) => void;
  consumeCredit: () => boolean;
  addCredits: (n: number) => void;
  registerReferralBonus: () => void;
  openPaywall: () => void;
  closePaywall: () => void;
  setLastResult: (r: AppState['lastResult']) => void;
  reset: () => void;
}

const REFERRAL_BONUS = 3; // generations per invited friend
const FREE_ON_START = 1;

const buildReferralCode = (userId: number) => {
  if (!userId) return `ref_${Math.random().toString(36).slice(2, 8)}`;
  return `ref_${userId.toString(36)}`;
};

const detectCurrency = (langCode?: string): Currency => {
  const cis = ['ru', 'be', 'kk', 'uk', 'ky', 'tg', 'uz'];
  return cis.includes((langCode || '').toLowerCase()) ? 'RUB' : 'USD';
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      initialized: false,
      currency: 'USD',
      tab: 'create',
      createStep: 'upload',
      balance: FREE_ON_START,
      totalGenerated: 0,
      referralCode: '',
      invitedFriends: 0,
      paywallOpen: false,
      lastResult: null,

      initSession: () => {
        if (get().initialized) return;
        const user = getTelegramUser();
        set({
          user,
          initialized: true,
          currency: detectCurrency(user.language_code),
          referralCode: get().referralCode || buildReferralCode(user.id),
        });
      },

      setTab: (tab) => set({ tab }),
      setCreateStep: (createStep) => set({ createStep }),

      consumeCredit: () => {
        const b = get().balance;
        if (b <= 0) return false;
        set({ balance: b - 1, totalGenerated: get().totalGenerated + 1 });
        return true;
      },

      addCredits: (n) => set({ balance: get().balance + n }),

      registerReferralBonus: () =>
        set({
          invitedFriends: get().invitedFriends + 1,
          balance: get().balance + REFERRAL_BONUS,
        }),

      openPaywall: () => set({ paywallOpen: true }),
      closePaywall: () => set({ paywallOpen: false }),

      setLastResult: (lastResult) => set({ lastResult }),

      reset: () =>
        set({
          balance: FREE_ON_START,
          totalGenerated: 0,
          invitedFriends: 0,
          createStep: 'upload',
          tab: 'create',
          lastResult: null,
        }),
    }),
    {
      name: 'ai-staging-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        balance: s.balance,
        totalGenerated: s.totalGenerated,
        invitedFriends: s.invitedFriends,
        referralCode: s.referralCode,
      }),
    },
  ),
);

/** Selector helper: full referral URL for the current user. */
export const useReferralUrl = (): string => {
  const code = useAppStore((s) => s.referralCode);
  return `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=${code}`;
};

export const REFERRAL_BONUS_AMOUNT = REFERRAL_BONUS;
