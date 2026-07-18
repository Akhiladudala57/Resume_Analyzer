import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, KeyRound, Cpu, Heart, SpellCheck2, LayoutList,
  TrendingUp, TrendingDown, Lightbulb,
} from 'lucide-react';
import type { Analysis } from '../lib/types';
import { Card } from './ui/Card';
import { ScoreRing } from './ui/ScoreRing';
import { Badge } from './ui/Badge';
import { classNames, scoreColor } from '../lib/utils';

const SEVERITY_TONE: Record<string, 'error' | 'warning' | 'neutral'> = {
  high: 'error',
  medium: 'warning',
  low: 'neutral',
};

export function AnalysisResults({ analysis }: { analysis: Analysis }) {
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#262c3a' : '#e6e9ef';
  const tickColor = isDark ? '#94a1b8' : '#66758f';

  return (
    <div className="space-y-6">
      {/* Score overview */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="flex gap-6">
            <ScoreRing score={analysis.resume_score} label="Resume" />
            <ScoreRing score={analysis.ats_score} label="ATS" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-ink-900 dark:text-white font-display text-lg font-700">Analysis Summary</h3>
              <Badge tone={analysis.engine === 'ai' ? 'brand' : 'neutral'} icon={analysis.engine === 'ai' ? Cpu : Lightbulb}>
                {analysis.engine === 'ai' ? 'AI engine' : 'Smart engine'}
              </Badge>
            </div>
            <p className="text-ink-700 dark:text-ink-200 mt-2 text-sm leading-relaxed">{analysis.summary}</p>
            {analysis.target_role && (
              <p className="text-muted mt-3 text-xs">Target role: <span className="font-medium text-ink-700 dark:text-ink-200">{analysis.target_role}</span></p>
            )}
          </div>
        </div>
      </Card>

      {/* Skill radar + bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-ink-900 dark:text-white font-display text-base font-700">Skill breakdown</h3>
          <p className="text-muted mt-1 text-xs">How your resume scores across key dimensions</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={analysis.skill_scores} outerRadius="72%">
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="skill" tick={{ fill: tickColor, fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: tickColor, fontSize: 10 }} stroke={gridColor} />
                <Radar dataKey="score" stroke="#1d66f5" fill="#1d66f5" fillOpacity={0.35} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-ink-900 dark:text-white font-display text-base font-700">Dimension scores</h3>
          <p className="text-muted mt-1 text-xs">Lower bars show where to focus improvements</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.skill_scores} layout="vertical" margin={{ left: 20, right: 16 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: tickColor, fontSize: 11 }} stroke={gridColor} />
                <YAxis type="category" dataKey="skill" tick={{ fill: tickColor, fontSize: 11 }} stroke={gridColor} width={80} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ background: isDark ? '#131722' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {analysis.skill_scores.map((s, i) => (
                    <Cell key={i} fill={scoreColor(s.score).bg.replace('bg-', '').replace('-500', '') === 'accent' ? '#10d178' : scoreColor(s.score).bg.includes('brand') ? '#1d66f5' : scoreColor(s.score).bg.includes('amber') ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <div className="bg-accent-50 dark:bg-accent-950/40 flex h-9 w-9 items-center justify-center rounded-lg">
              <TrendingUp className="h-5 w-5 text-accent-600" />
            </div>
            <h3 className="text-ink-900 dark:text-white font-display text-base font-700">Strengths</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                <span className="text-ink-700 dark:text-ink-200">{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <div className="bg-amber-50 dark:bg-amber-950/40 flex h-9 w-9 items-center justify-center rounded-lg">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-ink-900 dark:text-white font-display text-base font-700">Weaknesses</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {analysis.weaknesses.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span className="text-ink-700 dark:text-ink-200">{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Missing keywords / tech / soft */}
      <div className="grid gap-6 md:grid-cols-3">
        <GapCard icon={KeyRound} title="Missing Keywords" tone="brand" items={analysis.missing_keywords} />
        <GapCard icon={Cpu} title="Missing Tech Skills" tone="info" items={analysis.missing_tech_skills} />
        <GapCard icon={Heart} title="Missing Soft Skills" tone="accent" items={analysis.missing_soft_skills} />
      </div>

      {/* Grammar + Formatting */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SuggestionCard icon={SpellCheck2} title="Grammar Suggestions" suggestions={analysis.grammar_suggestions} />
        <SuggestionCard icon={LayoutList} title="Formatting Suggestions" suggestions={analysis.formatting_suggestions} />
      </div>
    </div>
  );
}

function GapCard({
  icon: Icon, title, items, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  tone: 'brand' | 'info' | 'accent';
}) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400',
  };
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <div className={classNames('flex h-9 w-9 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-ink-900 dark:text-white font-display text-base font-700">{title}</h3>
      </div>
      {items.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((k, i) => (
            <span key={i} className="surface-2 text-ink-700 dark:text-ink-200 rounded-lg px-2.5 py-1 text-xs font-medium">
              {k}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-muted mt-4 flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-accent-500" /> None detected — great coverage.
        </p>
      )}
    </Card>
  );
}

function SuggestionCard({
  icon: Icon, title, suggestions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  suggestions: { text: string; severity: string }[];
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <div className="surface-2 flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon className="h-5 w-5 text-brand-500" />
        </div>
        <h3 className="text-ink-900 dark:text-white font-display text-base font-700">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Badge tone={SEVERITY_TONE[s.severity] || 'neutral'} className="mt-0.5 shrink-0 capitalize">
              {s.severity}
            </Badge>
            <span className="text-ink-700 dark:text-ink-200">{s.text}</span>
          </li>
        ))}
        {suggestions.length === 0 && (
          <li className="text-muted text-sm">No suggestions.</li>
        )}
      </ul>
    </Card>
  );
}
