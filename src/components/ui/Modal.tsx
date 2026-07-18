import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 animate-fade-in backdrop-blur-sm" onClick={onClose} />
      <div
        className={classNames(
          'surface relative z-10 w-full overflow-hidden rounded-2xl shadow-xl animate-scale-in',
          SIZES[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="border-b border-ink-200 dark:border-ink-700 flex items-start justify-between p-6">
            <div>
              {title && <h2 className="font-display text-xl font-700 text-ink-900 dark:text-white">{title}</h2>}
              {description && <p className="text-muted mt-1 text-sm">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink-900 dark:hover:text-white rounded-lg p-1 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
