import { classNames, scoreColor } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, max = 100, className, showLabel, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const c = scoreColor(value);
  return (
    <div className={classNames('w-full', className)}>
      {(showLabel || label) && (
        <div className="text-muted mb-1.5 flex items-center justify-between text-xs">
          <span>{label}</span>
          {showLabel && <span className={c.text}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="surface-2 h-2 w-full overflow-hidden rounded-full">
        <div
          className={classNames('h-full rounded-full transition-all duration-700 ease-out', c.bg)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
