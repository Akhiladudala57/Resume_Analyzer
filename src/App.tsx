import { ThemeProvider } from './lib/theme';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { useRoute, useNavigate, Link } from './lib/router';
import { useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppShell } from './components/AppShell';
import { FullPageSpinner } from './components/ui/Spinner';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';

const PUBLIC_AUTH_PAGES = ['/login', '/signup', '/forgot-password'];
const PROTECTED_PAGES = ['/dashboard', '/chat', '/profile', '/admin', '/builder'];

function Router() {
  const route = useRoute();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logic
  useEffect(() => {
    if (loading) return;
    const isProtected = PROTECTED_PAGES.some((p) => route === p || route.startsWith(p));
    const isAuthPage = PUBLIC_AUTH_PAGES.includes(route);
    if (isProtected && !user) {
      navigate('/login');
    } else if (isAuthPage && user) {
      navigate('/dashboard');
    }
  }, [route, user, loading, navigate]);

  if (loading) {
    // Only block on protected routes; let landing render immediately.
    if (PROTECTED_PAGES.some((p) => route === p)) {
      return <FullPageSpinner label="Loading…" />;
    }
  }

  // Landing
  if (route === '/') {
    return (
      <>
        <Navbar />
        <LandingPage />
        <Footer />
      </>
    );
  }

  // Auth pages
  if (route === '/login') return <LoginPage />;
  if (route === '/signup') return <SignupPage />;
  if (route === '/forgot-password') return <ForgotPasswordPage />;

  // Protected pages
  if (PROTECTED_PAGES.some((p) => route === p)) {
    if (!user) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-ink-900 dark:text-white font-semibold">Please sign in to continue.</p>
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Go to sign in</Link>
        </div>
      );
    }
    return (
      <AppShell>
        {route === '/dashboard' && <DashboardPage />}
        {route === '/chat' && <ChatPage />}
        {route === '/profile' && <ProfilePage />}
        {route === '/admin' && <AdminPage />}
        {route === '/builder' && <ResumeBuilderPage />}
      </AppShell>
    );
  }

  // 404
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-display text-6xl font-800 gradient-text">404</p>
      <p className="text-ink-900 dark:text-white font-semibold">Page not found</p>
      <Link to="/" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Back home</Link>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
