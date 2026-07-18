import { Logo } from './ui/Logo';
import { Link } from '../lib/router';

export function Footer() {
  return (
    <footer className="border-ink-200 dark:border-ink-800 border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="text-muted mt-4 max-w-xs text-sm">
              AI-powered resume analysis and career coaching. Land your next role with confidence.
            </p>
          </div>
          <div>
            <h4 className="text-ink-900 dark:text-white text-sm font-semibold">Product</h4>
            <ul className="text-muted mt-3 space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-brand-600">Dashboard</Link></li>
              <li><Link to="/chat" className="hover:text-brand-600">Career Assistant</Link></li>
              <li><Link to="/profile" className="hover:text-brand-600">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-ink-900 dark:text-white text-sm font-semibold">Company</h4>
            <ul className="text-muted mt-3 space-y-2 text-sm">
              <li><a href="#/features" className="hover:text-brand-600">Features</a></li>
              <li><a href="#/pricing" className="hover:text-brand-600">Pricing</a></li>
              <li><a href="#/testimonials" className="hover:text-brand-600">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-ink-900 dark:text-white text-sm font-semibold">Legal</h4>
            <ul className="text-muted mt-3 space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-600">Privacy</a></li>
              <li><a href="#" className="hover:text-brand-600">Terms</a></li>
              <li><a href="#" className="hover:text-brand-600">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="border-ink-200 dark:border-ink-800 mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-muted text-xs">© {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
          <p className="text-muted text-xs">Built for job seekers. Powered by AI.</p>
        </div>
      </div>
    </footer>
  );
}
