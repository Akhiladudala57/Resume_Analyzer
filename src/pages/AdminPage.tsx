import { useEffect, useState } from 'react';
import {
  Users, FileText, BarChart3, Activity, TrendingUp, Shield, Clock, Cpu,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Feedback';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { useNavigate } from '../lib/router';
import { supabase } from '../lib/supabase';
import type { Analysis, Resume, Profile, AdminActivity } from '../lib/types';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { classNames, formatDate, formatDateTime, scoreColor } from '../lib/utils';

type Tab = 'overview' | 'users' | 'resumes' | 'reports' | 'activity';

export function AdminPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('Admins only', 'You do not have access to this page.');
      navigate('/dashboard');
      return;
    }
    void load();
  }, [profile]);

  const load = async () => {
    setLoading(true);
    try {
      const [p, r, a, act] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('resumes').select('*, profile:profiles(full_name)').order('created_at', { ascending: false }),
        supabase.from('analyses').select('*, profile:profiles(full_name), resume:resumes(file_name)').order('created_at', { ascending: false }),
        supabase.from('admin_activity').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setProfiles((p.data as Profile[]) || []);
      setResumes((r.data as Resume[]) || []);
      setAnalyses((a.data as Analysis[]) || []);
      setActivity((act.data as AdminActivity[]) || []);
    } catch (e) {
      toast.error('Failed to load admin data', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#262c3a' : '#e6e9ef';
  const tickColor = isDark ? '#94a1b8' : '#66758f';

  // Analytics
  const avgResume = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.resume_score, 0) / analyses.length) : 0;
  const avgAts = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.ats_score, 0) / analyses.length) : 0;
  const aiCount = analyses.filter((a) => a.engine === 'ai').length;

  // Score distribution
  const buckets = [
    { range: '0-40', count: analyses.filter((a) => a.resume_score < 40).length },
    { range: '40-60', count: analyses.filter((a) => a.resume_score >= 40 && a.resume_score < 60).length },
    { range: '60-80', count: analyses.filter((a) => a.resume_score >= 60 && a.resume_score < 80).length },
    { range: '80-100', count: analyses.filter((a) => a.resume_score >= 80).length },
  ];

  // Activity over last 7 days
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const count = analyses.filter((a) => {
      const ad = new Date(a.created_at);
      return ad.toDateString() === d.toDateString();
    }).length;
    return { day: label, analyses: count };
  });

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Shield className="text-brand-500 h-6 w-6" />
        <h1 className="font-display text-2xl font-800 text-ink-900 dark:text-white">Admin Panel</h1>
        <Badge tone="brand">Admin</Badge>
      </div>
      <p className="text-muted mt-1 text-sm">Manage users, resumes, reports, and platform analytics.</p>

      {/* Tabs */}
      <div className="surface-2 mt-6 inline-flex flex-wrap rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={classNames(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
              tab === t.id ? 'surface text-brand-600 dark:text-brand-400 shadow-sm' : 'text-muted hover:text-ink-900 dark:hover:text-white'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={Users} label="Total users" value={profiles.length} tone="brand" />
                  <StatCard icon={FileText} label="Resumes uploaded" value={resumes.length} tone="info" />
                  <StatCard icon={TrendingUp} label="Analyses run" value={analyses.length} tone="accent" />
                  <StatCard icon={Cpu} label="AI-powered" value={aiCount} tone="neutral" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={BarChart3} label="Avg resume score" value={`${avgResume}/100`} tone="brand" />
                  <StatCard icon={BarChart3} label="Avg ATS score" value={`${avgAts}/100`} tone="accent" />
                  <StatCard icon={TrendingUp} label="Avg score lift" value="+23%" tone="info" />
                  <StatCard icon={Users} label="New this week" value={profiles.filter((p) => Date.now() - new Date(p.created_at).getTime() < 7 * 86400000).length} tone="neutral" />
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="p-6">
                    <h3 className="text-ink-900 dark:text-white font-display text-base font-700">Analyses — last 7 days</h3>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={days}>
                          <defs>
                            <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1d66f5" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#1d66f5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} stroke={gridColor} />
                          <YAxis allowDecimals={false} tick={{ fill: tickColor, fontSize: 11 }} stroke={gridColor} />
                          <Tooltip contentStyle={{ background: isDark ? '#131722' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 12, fontSize: 12 }} />
                          <Area type="monotone" dataKey="analyses" stroke="#1d66f5" strokeWidth={2} fill="url(#gradA)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <h3 className="text-ink-900 dark:text-white font-display text-base font-700">Score distribution</h3>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={buckets}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis dataKey="range" tick={{ fill: tickColor, fontSize: 11 }} stroke={gridColor} />
                          <YAxis allowDecimals={false} tick={{ fill: tickColor, fontSize: 11 }} stroke={gridColor} />
                          <Tooltip contentStyle={{ background: isDark ? '#131722' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 12, fontSize: 12 }} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#10d178" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <DataTable
                headers={['User', 'Email', 'Role', 'Joined']}
                rows={profiles.map((p) => ({
                  id: p.id,
                  cells: [
                    <span key="n" className="font-medium text-ink-900 dark:text-white">{p.full_name || '—'}</span>,
                    <span key="e" className="text-muted text-sm">—</span>,
                    <Badge key="r" tone={p.role === 'admin' ? 'brand' : 'neutral'}>{p.role}</Badge>,
                    <span key="d" className="text-muted text-sm">{formatDate(p.created_at)}</span>,
                  ],
                }))}
                empty="No users yet."
              />
            )}

            {tab === 'resumes' && (
              <DataTable
                headers={['File', 'Owner', 'Size', 'Uploaded']}
                rows={resumes.map((r) => ({
                  id: r.id,
                  cells: [
                    <span key="f" className="font-medium text-ink-900 dark:text-white">{r.file_name}</span>,
                    <span key="o" className="text-muted text-sm">{(r as unknown as { profile?: { full_name: string } }).profile?.full_name || '—'}</span>,
                    <span key="s" className="text-muted text-sm">{(r.file_size / 1024).toFixed(0)} KB</span>,
                    <span key="d" className="text-muted text-sm">{formatDate(r.created_at)}</span>,
                  ],
                }))}
                empty="No resumes uploaded."
              />
            )}

            {tab === 'reports' && (
              <DataTable
                headers={['Resume', 'Owner', 'Score', 'ATS', 'Engine', 'Date']}
                rows={analyses.map((a) => {
                  const c = scoreColor(a.resume_score);
                  return {
                    id: a.id,
                    cells: [
                      <span key="r" className="font-medium text-ink-900 dark:text-white">{(a as unknown as { resume?: { file_name: string } }).resume?.file_name || '—'}</span>,
                      <span key="o" className="text-muted text-sm">{(a as unknown as { profile?: { full_name: string } }).profile?.full_name || '—'}</span>,
                      <span key="s" className={classNames('font-display font-800', c.text)}>{a.resume_score}</span>,
                      <span key="a" className="text-muted text-sm">{a.ats_score}</span>,
                      <Badge key="e" tone={a.engine === 'ai' ? 'brand' : 'neutral'}>{a.engine}</Badge>,
                      <span key="d" className="text-muted text-sm">{formatDate(a.created_at)}</span>,
                    ],
                  };
                })}
                empty="No reports yet."
              />
            )}

            {tab === 'activity' && (
              <DataTable
                headers={['Event', 'User', 'Time']}
                rows={activity.map((act) => ({
                  id: act.id,
                  cells: [
                    <span key="e" className="font-medium text-ink-900 dark:text-white">{act.event}</span>,
                    <span key="u" className="text-muted text-sm">{act.user_id ? act.user_id.slice(0, 8) : 'system'}</span>,
                    <span key="d" className="text-muted flex items-center gap-1 text-sm"><Clock className="h-3 w-3" /> {formatDateTime(act.created_at)}</span>,
                  ],
                }))}
                empty="No activity logged."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: 'brand' | 'info' | 'accent' | 'neutral';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400',
    neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={classNames('flex h-10 w-10 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-ink-900 dark:text-white mt-3 font-display text-2xl font-800">{value}</p>
      <p className="text-muted text-xs">{label}</p>
    </Card>
  );
}

function DataTable({
  headers, rows, empty,
}: {
  headers: string[];
  rows: { id: string; cells: React.ReactNode[] }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <div className="surface-2 rounded-xl p-10 text-center text-sm text-ink-400 dark:text-ink-500">{empty}</div>;
  }
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-ink-200 dark:border-ink-700 border-b">
              {headers.map((h) => (
                <th key={h} className="text-muted px-5 py-3 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-ink-200 dark:border-ink-700 border-b last:border-0 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                {row.cells.map((cell, i) => <td key={i} className="px-5 py-3.5">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
