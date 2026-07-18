import type { ReactNode } from 'react';
import { Logo } from '../../components/ui/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Link, useNavigate } from '../../lib/router';
import { Quote } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')}>
            <Logo />
          </button>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-800 text-ink-900 dark:text-white">{title}</h1>
            <p className="text-muted mt-1.5 text-sm">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
        <p className="text-muted text-center text-xs">
          <Link to="/" className="hover:text-brand-600">← Back to home</Link>
        </p>
      </div>

      {/* Right: brand panel */}
      <div className="gradient-brand relative hidden overflow-hidden lg:block">
        <div className="bg-grid-dark absolute inset-0 opacity-20 [background-size:28px_28px]" />
        <div className="relative flex h-full flex-col justify-center p-12 text-white">
          <Quote className="h-10 w-10 opacity-60" />
          <p className="mt-6 max-w-md text-2xl font-semibold leading-snug">
            "I added three missing keywords, rewrote four bullets, and got two interviews the same week. The ATS score wasn't a number — it was a roadmap."
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-sm font-bold">AM</div>
            <div>
              <p className="text-sm font-semibold">Aisha M.</p>
              <p className="text-white/80 text-xs">Frontend Engineer</p>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { v: '50k+', l: 'Resumes analyzed' },
              { v: '92%', l: 'ATS lift' },
              { v: '4.9/5', l: 'Rating' },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl font-800">{s.v}</p>
                <p className="text-white/80 text-xs">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
