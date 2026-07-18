import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon: Icon, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="text-ink-800 dark:text-ink-100 mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="text-muted pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            'surface-2 text-ink-900 dark:text-white placeholder:text-muted h-11 w-full rounded-xl border px-3.5 text-sm transition-all',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none',
            Icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="text-ink-800 dark:text-ink-100 mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={classNames(
          'surface-2 text-ink-900 dark:text-white placeholder:text-muted w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none',
          error && 'border-red-500',
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
});
