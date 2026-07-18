import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { classNames } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('surface-2 animate-pulse rounded-lg', className)} />;
}

export function LoadingOverlay({ label, children }: { label?: string; children?: ReactNode }) {
  return (
    <div className="surface-2 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/60 dark:bg-ink-950/60 backdrop-blur-sm">
      <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
      {label && <p className="text-muted text-sm">{label}</p>}
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 px-6 py-16 text-center">
      <div className="surface-2 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <Icon className="text-brand-500 h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-700 text-ink-900 dark:text-white">{title}</h3>
      {description && <p className="text-muted mt-1.5 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
