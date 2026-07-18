import { classNames, scoreColor, scoreLabel } from '../../lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  showGrade?: boolean;
  className?: string;
}

export function ScoreRing({ score, size = 120, stroke = 10, label, showGrade = true, className }: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const c = scoreColor(score);

  return (
    <div className={classNames('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-100 dark:stroke-ink-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={classNames(c.ring, 'transition-all duration-1000 ease-out')}
          style={{ transitionProperty: 'stroke-dashoffset' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={classNames('font-display text-2xl font-800', c.text)}>{score}</span>
        {showGrade && <span className="text-muted text-[10px] font-semibold uppercase tracking-wide">{scoreLabel(score)}</span>}
        {label && <span className="text-muted mt-0.5 text-[10px]">{label}</span>}
      </div>
    </div>
  );
}
