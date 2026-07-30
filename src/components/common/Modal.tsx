import type { ReactNode } from 'react';
import { Ico, XMarkIcon } from '../../lib/icons';

interface ModalProps {
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  maxWidth?: number;
}

export default function Modal({ onClose, title, eyebrow, children, maxWidth = 520 }: ModalProps) {
  return (
    <div className="flex overflow-y-auto fixed inset-0 z-[1000] justify-center items-center p-5 bg-black/55">
      <div
        className="overflow-x-hidden w-full max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        style={{ maxWidth }}
      >
        {(title || eyebrow) && (
          <div className="flex gap-3 justify-between items-center mb-5">
            <div className="min-w-0">
              {eyebrow && (
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                  {eyebrow}
                </div>
              )}
              {title && <div className="mt-0.5 text-[15px] font-bold text-primary">{title}</div>}
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="flex justify-center items-center p-2 -m-2 text-muted bg-transparent rounded-full border-none outline-none transition-colors duration-200 cursor-pointer shrink-0 hover:text-primary hover:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-elevated"
            >
              <Ico icon={XMarkIcon} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
