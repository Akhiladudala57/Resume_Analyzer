import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const ACCENT: Record<ToastType, string> = {
  success: 'text-accent-600',
  error: 'text-red-500',
  info: 'text-brand-500',
  warning: 'text-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', description?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message, description }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast: (m, t = 'info', d) => toast(m, t, d),
    success: (m, d) => toast(m, 'success', d),
    error: (m, d) => toast(m, 'error', d),
    info: (m, d) => toast(m, 'info', d),
    warning: (m, d) => toast(m, 'warning', d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className="surface shadow-card animate-scale-in rounded-xl p-4 pr-10 flex items-start gap-3"
              role="alert"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ACCENT[t.type]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.message}</p>
                {t.description && <p className="text-muted mt-0.5 text-xs">{t.description}</p>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-muted hover:text-ink-900 dark:hover:text-white absolute top-3 right-3 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
