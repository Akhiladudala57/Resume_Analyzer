import { useEffect, useState } from 'react';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { Logo } from './ui/Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { Button } from './ui/Button';
import { Link, useNavigate, useRoute } from '../lib/router';
import { useAuth } from '../lib/auth';
import { classNames } from '../lib/utils';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Pricing', href: '/#pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const route = useRoute();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLanding = route === '/';
  const go = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      if (!isLanding) {
        navigate('/');
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <header
      className={classNames(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-ink-200 dark:border-ink-800' : 'border-b border-transparent'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => go(l.href)}
              className="text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button size="sm" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate('/signup')}>
                Get started
              </Button>
            </div>
          )}
          <button
            className="text-ink-700 dark:text-ink-200 inline-flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="glass border-ink-200 dark:border-ink-800 border-b md:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="text-ink-700 dark:text-ink-200 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium"
              >
                {l.label}
              </button>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" fullWidth onClick={() => { setMenuOpen(false); navigate('/login'); }}>
                  Sign in
                </Button>
                <Button size="sm" fullWidth onClick={() => { setMenuOpen(false); navigate('/signup'); }}>
                  Get started
                </Button>
              </div>
            )}
            {user && (
              <div className="text-muted px-3 pt-2 text-xs">Signed in as {profile?.full_name || user.email}</div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
