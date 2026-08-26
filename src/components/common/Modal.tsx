import { useState, type ReactNode } from 'react';
import { Ico, XMarkIcon } from '../../lib/icons';

interface ModalProps {
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  /**
   * Plain content, or a render function receiving the animated close handler.
   * In-modal actions that dismiss the modal (a "Cancelar" button, an
   * auto-dismiss after a successful save, ...) should call this instead of
   * the raw `onClose` prop, so they play the same exit transition as the
   * backdrop click / X button instead of cutting instantly.
   */
  children: ReactNode | ((close: () => void) => ReactNode);
  maxWidth?: number;
}

// Kept in sync with the *Out keyframe durations in index.css — the modal
// stays mounted (playing the exit animation) for this long before the
// parent actually unmounts it, otherwise the close would be an instant cut.
const EXIT_MS = 160;

export default function Modal({ onClose, title, eyebrow, children, maxWidth = 520 }: ModalProps) {
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, EXIT_MS);
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) requestClose(); }}
      className={[
        'flex overflow-y-auto fixed inset-0 z-[1000] justify-center items-center p-5 bg-black/55',
        closing ? 'animate-[modalBackdropOut_0.16s_ease_forwards]' : 'animate-[modalBackdropIn_0.18s_ease]',
      ].join(' ')}
    >
      <div
        className={[
          'overflow-x-hidden w-full max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-5 sm:p-7',
          closing ? 'animate-[modalPanelOut_0.16s_ease_forwards]' : 'animate-[modalPanelIn_0.22s_cubic-bezier(0.16,1,0.3,1)]',
        ].join(' ')}
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
              onClick={requestClose}
              aria-label="Fechar"
              className="flex justify-center items-center p-2 -m-2 text-muted bg-transparent rounded-full border-none outline-none transition-colors duration-200 cursor-pointer shrink-0 hover:text-primary hover:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-elevated"
            >
              <Ico icon={XMarkIcon} />
            </button>
          </div>
        )}
        {typeof children === 'function' ? children(requestClose) : children}
      </div>
    </div>
  );
}
