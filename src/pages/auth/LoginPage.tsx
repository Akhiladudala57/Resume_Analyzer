import { useState, type FormEvent } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error('Sign in failed', error);
      return;
    }
    toast.success('Welcome back!');
    navigate('/dashboard');
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue improving your resume.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          icon={Lock}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && <p className="rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-muted mt-6 text-center text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign up free</Link>
      </p>
    </AuthLayout>
  );
}
