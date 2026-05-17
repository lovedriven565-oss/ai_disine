import { Sparkles, User } from 'lucide-react';
import { useAppStore, type Tab } from '../../store/useAppStore';
import { haptic } from '../../services/telegram';

interface TabDef {
  id: Tab;
  label: string;
  Icon: typeof Sparkles;
}

const TABS: TabDef[] = [
  { id: 'create',  label: 'Studio',  Icon: Sparkles },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function BottomTabBar() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const setStep = useAppStore((s) => s.setCreateStep);

  const onPick = (id: Tab) => {
    haptic('light');
    setTab(id);
    if (id === 'create') setStep('upload');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch px-4 pt-2 pb-6 bg-surface-container/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => onPick(id)}
            className={`flex-1 flex flex-col items-center justify-center rounded-2xl py-1.5 mx-1 transition-all duration-200 active:scale-95 ${
              active
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} className="mb-0.5" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
