import { Loader2 } from 'lucide-react';
import { classNames } from '../../lib/utils';

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={classNames('animate-spin text-brand-500', className)} style={{ width: size, height: size }} />;
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner size={32} />
      {label && <p className="text-muted text-sm">{label}</p>}
    </div>
  );
}
