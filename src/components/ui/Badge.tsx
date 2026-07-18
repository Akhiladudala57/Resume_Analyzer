import type { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

type Tone = 'brand' | 'accent' | 'neutral' | 'warning' | 'error' | 'info';

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 ring-brand-500/20',
  accent: 'bg-accent-50 text-accent-700 dark:bg-accent-950/60 dark:text-accent-300 ring-accent-500/20',
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200 ring-ink-500/20',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-500/20',
  error: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 ring-red-500/20',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 ring-sky-500/20',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon: Icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
