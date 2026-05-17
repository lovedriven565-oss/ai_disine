import type { ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';

interface Props {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  rightSlot?: ReactNode;
}

export default function TopAppBar({ title, onBack, onClose, rightSlot }: Props) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 h-14 px-4 flex items-center justify-between bg-surface/70 backdrop-blur-xl border-b border-white/10 shadow-sm">
      {onBack ? (
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:opacity-80 active:scale-95 transition-all rounded-full"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
      ) : (
        <span className="w-10" />
      )}

      <h1 className="font-headline-md text-[20px] font-semibold text-on-surface">{title}</h1>

      {rightSlot ? (
        <div className="w-10 h-10 flex items-center justify-center">{rightSlot}</div>
      ) : onClose ? (
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:opacity-80 active:scale-95 transition-all rounded-full"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      ) : (
        <span className="w-10" />
      )}
    </header>
  );
}
