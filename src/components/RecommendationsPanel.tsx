import { useState } from 'react';
import {
  Sparkles, ChevronRight, FileText, Target, Cpu, FolderGit2, Award,
  MessageSquare, Compass, Briefcase, GraduationCap, Mail, Linkedin,
} from 'lucide-react';
import type { Analysis, RecommendationCategory, RecommendationGroup } from '../lib/types';
import { RECOMMENDATION_CATEGORIES } from '../lib/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { classNames } from '../lib/utils';
import { generateRecommendations, updateRecommendations } from '../lib/data';
import { useToast } from '../lib/toast';

const CATEGORY_ICONS: Record<RecommendationCategory, React.ComponentType<{ className?: string }>> = {
  resume_improvement: FileText,
  ats_optimization: Target,
  skill_recommendations: Cpu,
  project_recommendations: FolderGit2,
  certification_recommendations: Award,
  interview_preparation: MessageSquare,
  career_path: Compass,
  job_recommendations: Briefcase,
  learning_roadmap: GraduationCap,
  cover_letter: Mail,
  linkedin_optimization: Linkedin,
};

const PRIORITY_TONE: Record<string, 'error' | 'warning' | 'neutral'> = {
  high: 'error',
  medium: 'warning',
  low: 'neutral',
};

interface Props {
  analysis: Analysis;
  resumeText: string;
}

export function RecommendationsPanel({ analysis, resumeText }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState<RecommendationCategory[]>([]);
  const [results, setResults] = useState<Record<string, RecommendationGroup>>(analysis.recommendations || {});
  const [loading, setLoading] = useState(false);

  const toggle = (id: RecommendationCategory) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const generate = async () => {
    if (selected.length === 0) {
      toast.warning('Select at least one category');
      return;
    }
    setLoading(true);
    try {
      const recs = await generateRecommendations(
        resumeText,
        analysis.summary,
        selected,
        analysis.target_role
      );
      const merged = { ...results, ...recs } as Record<string, RecommendationGroup>;
      setResults(merged);
      await updateRecommendations(analysis.id, merged);
      toast.success(`Generated ${selected.length} recommendation${selected.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast.error('Generation failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-ink-900 dark:text-white font-display text-lg font-700">Personalized recommendations</h3>
            <p className="text-muted mt-1 text-sm">Pick the areas you want help with, then generate tailored AI advice.</p>
          </div>
          <Badge tone="brand" icon={Sparkles}>{Object.keys(results).length} ready</Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {RECOMMENDATION_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const active = selected.includes(cat.id);
            const hasResult = !!results[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                className={classNames(
                  'surface-2 group relative flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-all',
                  active ? 'ring-2 ring-brand-500/60 bg-brand-50/50 dark:bg-brand-950/30' : 'hover:border-brand-400'
                )}
              >
                <div className={classNames(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  active ? 'gradient-brand text-white' : 'surface text-brand-500'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-ink-900 dark:text-white text-xs font-semibold leading-tight">{cat.label}</span>
                {hasResult && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent-500" title="Generated" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={generate} loading={loading} disabled={selected.length === 0}>
            {!loading && <Sparkles className="h-4 w-4" />}
            Generate {selected.length > 0 && `(${selected.length})`}
          </Button>
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} className="text-muted hover:text-ink-900 dark:hover:text-white text-sm">
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {Object.entries(results).map(([catId, group]) => {
            const cat = RECOMMENDATION_CATEGORIES.find((c) => c.id === catId);
            if (!cat) return null;
            const Icon = CATEGORY_ICONS[cat.id as RecommendationCategory];
            return (
              <Card key={catId} className="p-6 animate-fade-up">
                <div className="flex items-center gap-2.5">
                  <div className="surface-2 flex h-9 w-9 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <h4 className="text-ink-900 dark:text-white font-display text-base font-700">{group.title || cat.label}</h4>
                    <p className="text-muted text-xs">{cat.description}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3">
                  {group.items?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      {item.priority && (
                        <Badge tone={PRIORITY_TONE[item.priority] || 'neutral'} className="mt-0.5 shrink-0 capitalize">
                          {item.priority}
                        </Badge>
                      )}
                      <span className="text-ink-700 dark:text-ink-200 whitespace-pre-line">{item.text}</span>
                    </li>
                  ))}
                  {(!group.items || group.items.length === 0) && (
                    <li className="text-muted text-sm">No items yet.</li>
                  )}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      {Object.keys(results).length === 0 && !loading && (
        <Card className="p-10 text-center">
          <div className="surface-2 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
            <ChevronRight className="h-6 w-6 text-brand-500" />
          </div>
          <p className="text-ink-900 dark:text-white mt-4 font-semibold">No recommendations yet</p>
          <p className="text-muted mt-1 text-sm">Select categories above and hit Generate to get personalized AI advice.</p>
        </Card>
      )}
    </div>
  );
}
