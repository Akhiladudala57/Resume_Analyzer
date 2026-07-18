import { useEffect, useState } from 'react';
import { User, Mail, Trash2, FileText, History, LogOut, Save, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Skeleton, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { useNavigate } from '../lib/router';
import { getResumes, getAnalyses, deleteResume, deleteAnalysis, updateProfile } from '../lib/data';
import type { Resume, Analysis } from '../lib/types';
import { formatBytes, formatDate, classNames, scoreColor } from '../lib/utils';

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([getResumes(), getAnalyses()]);
      setResumes(r);
      setAnalyses(a);
    } catch (e) {
      toast.error('Failed to load', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    setSavingName(true);
    try {
      await updateProfile(fullName, profile?.avatar_url || null);
      await refreshProfile();
      toast.success('Profile updated');
    } catch (e) {
      toast.error('Update failed', (e as Error).message);
    } finally {
      setSavingName(false);
    }
  };

  const removeResume = async (id: string) => {
    try {
      await deleteResume(id);
      setResumes((p) => p.filter((r) => r.id !== id));
      setAnalyses((p) => p.filter((a) => a.resume_id !== id));
      toast.success('Resume deleted');
    } catch (e) {
      toast.error('Delete failed', (e as Error).message);
    }
  };

  const removeAnalysis = async (id: string) => {
    try {
      await deleteAnalysis(id);
      setAnalyses((p) => p.filter((a) => a.id !== id));
      toast.success('Report deleted');
    } catch (e) {
      toast.error('Delete failed', (e as Error).message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-800 text-ink-900 dark:text-white">Profile</h1>
      <p className="text-muted mt-1 text-sm">Manage your account, resumes, and analysis history.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Account */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="gradient-brand flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-800 text-white shadow-glow">
              {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <p className="text-ink-900 dark:text-white mt-3 font-display text-base font-700">
              {profile?.full_name || 'Your name'}
            </p>
            <p className="text-muted text-xs">{user?.email}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone={profile?.role === 'admin' ? 'brand' : 'neutral'} icon={Shield}>
                {profile?.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
              <Badge tone="neutral">Since {formatDate(profile?.created_at || new Date().toISOString())}</Badge>
            </div>
          </div>

          <div className="border-ink-200 dark:border-ink-700 mt-6 border-t pt-5">
            <Input label="Full name" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={User} />
            <Input label="Email" name="email" value={user?.email || ''} disabled icon={Mail} className="mt-3" />
            <Button className="mt-4" fullWidth onClick={saveName} loading={savingName}>
              {!savingName && <Save className="h-4 w-4" />} Save changes
            </Button>
          </div>

          <div className="border-ink-200 dark:border-ink-700 mt-5 border-t pt-5">
            <Button variant="outline" fullWidth onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </Card>

        {/* Resumes + history */}
        <div className="space-y-6 lg:col-span-2">
          {/* Resumes */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="text-brand-500 h-5 w-5" />
              <h2 className="text-ink-900 dark:text-white font-display text-base font-700">Uploaded resumes</h2>
              <Badge tone="neutral">{resumes.length}</Badge>
            </div>
            {loading ? (
              <div className="mt-4 space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : resumes.length === 0 ? (
              <p className="text-muted mt-4 text-sm">No resumes uploaded yet.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {resumes.map((r) => (
                  <div key={r.id} className="surface-2 flex items-center gap-3 rounded-xl p-3">
                    <div className="surface flex h-9 w-9 items-center justify-center rounded-lg">
                      <FileText className="h-4 w-4 text-brand-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink-900 dark:text-white truncate text-sm font-semibold">{r.file_name}</p>
                      <p className="text-muted text-xs">{formatBytes(r.file_size)} · {formatDate(r.created_at)} · {r.content_text.split(/\s+/).length} words</p>
                    </div>
                    <button onClick={() => removeResume(r.id)} className="text-muted hover:text-red-500 p-1" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* History */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <History className="text-brand-500 h-5 w-5" />
              <h2 className="text-ink-900 dark:text-white font-display text-base font-700">Analysis history</h2>
              <Badge tone="neutral">{analyses.length}</Badge>
            </div>
            {loading ? (
              <div className="mt-4 space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : analyses.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={History} title="No analyses yet" description="Your past reports will appear here." />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {analyses.map((a) => {
                  const c = scoreColor(a.resume_score);
                  return (
                    <div key={a.id} className="surface-2 flex items-center gap-3 rounded-xl p-3">
                      <div className={classNames('flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-800', c.text)}>
                        {a.resume_score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-ink-900 dark:text-white truncate text-sm font-semibold">
                          {resumes.find((r) => r.id === a.resume_id)?.file_name || 'Analysis'}
                        </p>
                        <p className="text-muted text-xs">{formatDate(a.created_at)} · ATS {a.ats_score} · {a.engine === 'ai' ? 'AI' : 'Smart'}</p>
                      </div>
                      <button onClick={() => { removeAnalysis(a.id); }} className="text-muted hover:text-red-500 p-1" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
