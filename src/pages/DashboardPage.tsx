import { useEffect, useState } from 'react';
import {
  FileText, Download, Trash2, Clock, Sparkles, History, ArrowRight,
  Wand2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { ResumeUploader } from '../components/ResumeUploader';
import { AnalysisResults } from '../components/AnalysisResults';
import { RecommendationsPanel } from '../components/RecommendationsPanel';
import { EmptyState, LoadingOverlay, Skeleton } from '../components/ui/Feedback';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { useNavigate } from '../lib/router';
import { extractFromFile } from '../lib/fileExtract';
import {
  saveResume, analyzeAndSave, getResumes, getAnalyses, deleteAnalysis, getAnalysis,
} from '../lib/data';
import { downloadAnalysisReport } from '../lib/pdf';
import type { Analysis, Resume } from '../lib/types';
import { classNames, formatDate, scoreColor } from '../lib/utils';

type Tab = 'overview' | 'recommendations';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [current, setCurrent] = useState<Analysis | null>(null);
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoadingData(true);
    try {
      const [r, a] = await Promise.all([getResumes(), getAnalyses()]);
      setResumes(r);
      setAnalyses(a);
      if (a.length > 0) {
        setCurrent(a[0]);
        const matchedResume = r.find((x) => x.id === a[0].resume_id) || null;
        setCurrentResume(matchedResume);
      }
    } catch (e) {
      toast.error('Failed to load data', (e as Error).message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFile = async (file: File) => {
    setAnalyzing(true);
    try {
      const extracted = await extractFromFile(file);
      const savedResume = await saveResume({
        name: extracted.name,
        type: extracted.type,
        size: extracted.size,
        text: extracted.text,
      });
      const analysis = await analyzeAndSave(savedResume.id, extracted.text, targetRole || null);
      setResumes((p) => [savedResume, ...p]);
      setAnalyses((p) => [analysis, ...p]);
      setCurrent(analysis);
      setCurrentResume(savedResume);
      setTab('overview');
      toast.success('Analysis complete', `Resume score: ${analysis.resume_score}/100 · ATS: ${analysis.ats_score}/100`);
    } catch (e) {
      toast.error('Analysis failed', (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const selectAnalysis = async (id: string) => {
    const a = await getAnalysis(id);
    if (a) {
      setCurrent(a);
      setCurrentResume(resumes.find((r) => r.id === a.resume_id) || null);
      setTab('overview');
    }
  };

  const removeAnalysis = async (id: string) => {
    try {
      await deleteAnalysis(id);
      const remaining = analyses.filter((a) => a.id !== id);
      setAnalyses(remaining);
      if (current?.id === id) {
        setCurrent(remaining[0] || null);
        setCurrentResume(remaining[0] ? resumes.find((r) => r.id === remaining[0].resume_id) || null : null);
      }
      toast.success('Report deleted');
    } catch (e) {
      toast.error('Delete failed', (e as Error).message);
    }
  };

  const download = () => {
    if (!current) return;
    downloadAnalysisReport(current, currentResume, profile?.full_name || user?.email || '');
    toast.success('Report downloaded');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-ink-900 dark:text-white">Dashboard</h1>
          <p className="text-muted mt-1 text-sm">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/builder')}>
            <Wand2 className="h-4 w-4" /> Build resume
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/chat')}>
            <Sparkles className="h-4 w-4" /> Career Assistant
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            Profile
          </Button>
        </div>
      </div>

      {/* Upload */}
      <Card className="relative mt-6 p-6">
        <h2 className="text-ink-900 dark:text-white font-display text-base font-700">Analyze a new resume</h2>
        <p className="text-muted mt-1 text-sm">Upload a PDF or DOCX — we extract and analyze it instantly.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,240px]">
          <ResumeUploader onFileSelected={handleFile} loading={analyzing} />
          <div className="space-y-3">
            <Input
              label="Target role (optional)"
              name="targetRole"
              placeholder="e.g. Frontend Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <p className="text-muted text-xs">
              Specifying a role makes keyword and skill recommendations more precise.
            </p>
          </div>
        </div>
        {analyzing && <LoadingOverlay label="Extracting and analyzing your resume…" />}
      </Card>

      {/* Current analysis tabs */}
      {current && (
        <div className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="surface-2 inline-flex w-fit rounded-xl p-1">
              <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={FileText}>Overview</TabButton>
              <TabButton active={tab === 'recommendations'} onClick={() => setTab('recommendations')} icon={Wand2}>Recommendations</TabButton>
            </div>
            <Button size="sm" variant="outline" onClick={download}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>

          <div className="mt-4">
            {tab === 'overview' && <AnalysisResults analysis={current} />}
            {tab === 'recommendations' && (
              <RecommendationsPanel analysis={current} resumeText={currentResume?.content_text || ''} />
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <History className="text-ink-700 dark:text-ink-200 h-5 w-5" />
          <h2 className="text-ink-900 dark:text-white font-display text-lg font-700">Analysis history</h2>
          <Badge tone="neutral">{analyses.length}</Badge>
        </div>

        {loadingData ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : analyses.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={FileText}
              title="No analyses yet"
              description="Upload your first resume above to get an instant AI breakdown."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((a) => {
              const c = scoreColor(a.resume_score);
              const active = current?.id === a.id;
              return (
                <Card
                  key={a.id}
                  className={classNames('group cursor-pointer p-4 transition-all', active ? 'ring-2 ring-brand-500/60' : 'hover:shadow-glow hover:-translate-y-0.5')}
                  onClick={() => selectAnalysis(a.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-ink-900 dark:text-white truncate text-sm font-semibold">
                        {resumes.find((r) => r.id === a.resume_id)?.file_name || 'Resume'}
                      </p>
                      <p className="text-muted mt-0.5 flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" /> {formatDate(a.created_at)}
                      </p>
                    </div>
                    <span className={classNames('font-display text-lg font-800', c.text)}>{a.resume_score}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone="neutral">ATS {a.ats_score}</Badge>
                    {a.target_role && <Badge tone="brand">{a.target_role}</Badge>}
                    {a.engine === 'ai' && <Badge tone="accent">AI</Badge>}
                  </div>
                  <div className="border-ink-200 dark:border-ink-700 mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-muted text-xs">{a.strengths.length} strengths · {a.weaknesses.length} gaps</span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); selectAnalysis(a.id); }}
                        className="text-muted hover:text-brand-600 p-1"
                        aria-label="Open"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAnalysis(a.id); }}
                        className="text-muted hover:text-red-500 p-1"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
        active ? 'surface text-brand-600 dark:text-brand-400 shadow-sm' : 'text-muted hover:text-ink-900 dark:hover:text-white'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
