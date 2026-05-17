import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function Toast() {
  const toast = useAppStore((s) => s.toast);
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => showToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast, showToast]);

  if (!toast) return null;

  const palette = {
    success: { Icon: CheckCircle2, accent: 'text-emerald-300', ring: 'ring-emerald-400/30' },
    error:   { Icon: AlertTriangle, accent: 'text-red-300',     ring: 'ring-red-400/30' },
    info:    { Icon: Info,           accent: 'text-primary',     ring: 'ring-primary/30' },
  }[toast.kind];

  const { Icon, accent, ring } = palette;

  return (
    <div className="fixed left-0 right-0 top-[max(env(safe-area-inset-top,0px),12px)] z-[110] flex justify-center px-4 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2.5 max-w-[90%] sm:max-w-sm rounded-2xl pl-3 pr-2 py-2.5 bg-surface-container/90 backdrop-blur-xl border border-white/10 ring-1 ${ring} shadow-[0_12px_40px_rgba(0,0,0,0.45)] animate-[toastIn_.25s_ease]`}
      >
        <Icon size={18} className={accent} />
        <span className="text-[13px] text-on-surface font-medium flex-1">{toast.message}</span>
        <button
          onClick={() => showToast(null)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
      <style>{`
        @keyframes toastIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
