import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error('Sign up failed', error);
      return;
    }
    toast.success('Account created', 'Welcome to ResumeAI!');
    navigate('/dashboard');
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start analyzing and improving your resume for free.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Full name"
          name="fullName"
          required
          icon={User}
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          icon={Lock}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <div className="text-muted mt-5 flex items-center justify-center gap-2 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 text-accent-500" /> Free forever — no credit card required
      </div>
      <p className="text-muted mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
