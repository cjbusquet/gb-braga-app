/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Ico,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  type HeroIcon,
} from '../../lib/icons';

export type ToastType = 'sucesso' | 'erro' | 'aviso' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_CONFIG: Record<ToastType, { icon: HeroIcon; color: string; border: string }> = {
  sucesso: { icon: CheckCircleIcon,        color: '#22C55E',      border: 'rgba(34,197,94,0.25)' },
  erro:    { icon: XCircleIcon,            color: 'var(--gb-red)', border: 'rgba(200,16,30,0.2)' },
  aviso:   { icon: ExclamationTriangleIcon, color: '#F59E0B',      border: 'rgba(245,158,11,0.25)' },
  info:    { icon: InformationCircleIcon,  color: '#3B82F6',      border: 'rgba(59,130,246,0.25)' },
};

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setItems(prev => [...prev, { id, message, type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
  }, [dismiss]);

  const value: ToastContextType = {
    toast,
    success: (message: string) => toast(message, 'sucesso'),
    error:   (message: string) => toast(message, 'erro'),
    warning: (message: string) => toast(message, 'aviso'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="flex fixed bottom-4 right-4 z-[2000] flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none">
        {items.map(item => {
          const cfg = TOAST_CONFIG[item.type];
          return (
            <div
              key={item.id}
              role="status"
              className="flex gap-2.5 items-start py-3 px-3.5 rounded-lg border shadow-[0_8px_24px_rgba(0,0,0,0.15)] pointer-events-auto bg-card"
              style={{ borderColor: cfg.border, borderLeftWidth: 3, borderLeftColor: cfg.color }}
            >
              <span className="mt-0.5" style={{ color: cfg.color }}>
                <Ico icon={cfg.icon} />
              </span>
              <p className="flex-1 m-0 text-[13px] leading-[1.4] text-primary">{item.message}</p>
              <button
                onClick={() => dismiss(item.id)}
                aria-label="Fechar"
                className="flex justify-center items-center p-1 -m-1 text-muted bg-transparent rounded-full border-none outline-none transition-colors duration-200 cursor-pointer shrink-0 hover:text-primary hover:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red"
              >
                <Ico icon={XMarkIcon} sm />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
