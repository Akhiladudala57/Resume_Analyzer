import { ScanText } from 'lucide-react';
import { classNames } from '../../lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={classNames('flex items-center gap-2', className)}>
      <div className="gradient-brand flex h-9 w-9 items-center justify-center rounded-xl shadow-glow">
        <ScanText className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <span className="font-display text-xl font-800 tracking-tight text-ink-900 dark:text-white">
          Resume<span className="gradient-text">AI</span>
        </span>
      )}
    </div>
  );
}
