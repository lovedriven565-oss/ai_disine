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
import {
  getTelegramUser,
  getStartParam,
  type TelegramUser,
  BOT_USERNAME,
  APP_SHORT_NAME,
} from '../services/telegram';
import { syncUser, type ServerUser } from '../services/supabase';

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
  referredBy: string | null;
  invitedFriends: number;
  paywallOpen: boolean;

  // upload pipeline
  uploadedPhoto: string | null; // data URL
  uploadedFileName: string | null;

  // last result
  lastResult: { before: string; after: string; style: string } | null;

  // toast
  toast: { kind: 'success' | 'error' | 'info'; message: string } | null;

  // server sync state
  serverUserId: string | null;
  syncing: boolean;
  lastSyncError: string | null;

  // actions
  initSession: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  applyServerUser: (u: ServerUser) => void;
  setBalance: (n: number) => void;
  setTab: (tab: Tab) => void;
  setCreateStep: (s: CreateStep) => void;
  consumeCredit: () => boolean;
  addCredits: (n: number) => void;
  registerReferralBonus: () => void;
  openPaywall: () => void;
  closePaywall: () => void;
  setUploadedPhoto: (dataUrl: string | null, fileName?: string) => void;
  setLastResult: (r: AppState['lastResult']) => void;
  showToast: (t: AppState['toast']) => void;
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
      referredBy: null,
      invitedFriends: 0,
      paywallOpen: false,
      uploadedPhoto: null,
      uploadedFileName: null,
      lastResult: null,
      toast: null,
      serverUserId: null,
      syncing: false,
      lastSyncError: null,

      initSession: async () => {
        if (get().initialized) return;
        const user = getTelegramUser();
        const startParam = getStartParam();
        const localCode = buildReferralCode(user.id);
        const inboundRef =
          startParam && startParam.startsWith('ref_') && startParam !== localCode
            ? startParam
            : null;

        // Optimistic local hydrate while we hit the backend.
        set({
          user,
          initialized: true,
          currency: detectCurrency(user.language_code),
          referralCode: get().referralCode || localCode,
          referredBy: get().referredBy || inboundRef,
        });

        await get().refreshFromServer();
      },

      refreshFromServer: async () => {
        const user = get().user;
        if (!user) return;
        set({ syncing: true, lastSyncError: null });
        try {
          const { user: srv } = await syncUser({
            telegramUserId: user.id,
            user: {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              language_code: user.language_code,
            },
            referredBy: get().referredBy,
          });
          get().applyServerUser(srv);
        } catch (e) {
          // Backend down? Fall back to local optimistic state.
          // eslint-disable-next-line no-console
          console.warn('[store] refreshFromServer failed', e);
          set({ lastSyncError: e instanceof Error ? e.message : 'sync_failed' });
        } finally {
          set({ syncing: false });
        }
      },

      applyServerUser: (srv) =>
        set({
          serverUserId: srv.id,
          balance: srv.balance,
          totalGenerated: srv.total_generated,
          referralCode: srv.referral_code,
          referredBy: srv.referred_by,
          invitedFriends: srv.invited_friends,
        }),

      setBalance: (n) => set({ balance: Math.max(0, n) }),

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

      setUploadedPhoto: (dataUrl, fileName) =>
        set({ uploadedPhoto: dataUrl, uploadedFileName: fileName ?? null }),

      setLastResult: (lastResult) => set({ lastResult }),

      showToast: (toast) => set({ toast }),

      reset: () =>
        set({
          balance: FREE_ON_START,
          totalGenerated: 0,
          invitedFriends: 0,
          createStep: 'upload',
          tab: 'create',
          uploadedPhoto: null,
          uploadedFileName: null,
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
        referredBy: s.referredBy,
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
