import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { classNames } from '../../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={classNames(
        'surface-2 text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-400 relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        className
      )}
    >
      <Sun className={classNames('h-4.5 w-4.5 transition-all', theme === 'dark' ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
      <Moon className={classNames('absolute h-4.5 w-4.5 transition-all', theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0')} />
    </button>
  );
}
