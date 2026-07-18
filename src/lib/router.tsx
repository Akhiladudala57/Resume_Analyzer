import { useEffect, useState, useCallback } from 'react';

// Lightweight hash-based router. Paths look like #/dashboard, #/login, etc.
// Query params are not needed for this app.

export function getPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function navigate(path: string): void {
  if (getPath() === path) return;
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function useRoute(): string {
  const [path, setPath] = useState(getPath());
  useEffect(() => {
    const onHash = () => {
      setPath(getPath());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return path;
}

export function useNavigate() {
  return useCallback((path: string) => navigate(path), []);
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
