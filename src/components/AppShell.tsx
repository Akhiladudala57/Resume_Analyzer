import type { ReactNode } from 'react';
import { Logo } from './ui/Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { Navbar } from './Navbar';
import { useAuth } from '../lib/auth';
import { useNavigate, useRoute, Link } from '../lib/router';
import { LayoutDashboard, Sparkles, User, Shield, LogOut, Menu, X, FilePlus2 } from 'lucide-react';
import { classNames } from '../lib/utils';
import { useState } from 'react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/builder', label: 'Resume Builder', icon: FilePlus2 },
  { to: '/chat', label: 'Career Assistant', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const route = useRoute();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const items = isAdmin ? [...NAV, { to: '/admin', label: 'Admin', icon: Shield }] : NAV;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-60 shrink-0 py-6 lg:block">
          <nav className="space-y-1">
            {items.map((item) => {
              const active = route === item.to || route.startsWith(item.to + '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={classNames(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'surface text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-ink-600 dark:text-ink-300 hover:surface-2'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-ink-200 dark:border-ink-700 mt-6 border-t pt-4">
            <div className="surface-2 flex items-center gap-2.5 rounded-xl p-3">
              <div className="gradient-brand flex h-8 w-8 items-center justify-center rounded-lg text-xs font-800 text-white">
                {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-ink-900 dark:text-white truncate text-xs font-semibold">{profile?.full_name || 'User'}</p>
                <p className="text-muted truncate text-[10px]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-muted hover:text-red-500 mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex w-full flex-col py-6 lg:pl-6">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="surface-2 inline-flex h-9 w-9 items-center justify-center rounded-lg"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <div className="surface absolute left-0 top-0 h-full w-72 p-5 animate-fade-up shadow-xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setSidebarOpen(false)} className="text-muted p-1"><X className="h-5 w-5" /></button>
            </div>
            <nav className="mt-6 space-y-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={classNames(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                    route === item.to ? 'surface text-brand-600 dark:text-brand-400' : 'text-ink-600 dark:text-ink-300'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => { setSidebarOpen(false); handleSignOut(); }}
              className="text-muted hover:text-red-500 mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
