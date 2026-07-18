import {
  FileText, Sparkles, ShieldCheck, Zap, Brain, Download, MessageSquare,
  TrendingUp, CheckCircle2, ArrowRight, Star, BarChart3, Target, Award,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScoreRing } from '../components/ui/ScoreRing';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';

const FEATURES = [
  { icon: Brain, title: 'AI Resume Analysis', desc: 'Get a 0-100 resume score, ATS compatibility, strengths, weaknesses, and missing keywords — all grounded in your actual resume text.' },
  { icon: Target, title: 'ATS Optimization', desc: 'See exactly which keywords and formatting choices are costing you interviews, with concrete fixes.' },
  { icon: Sparkles, title: '12 Recommendation Tracks', desc: 'From resume improvement to cover letters, LinkedIn, and interview prep — personalized AI guidance per category.' },
  { icon: MessageSquare, title: 'AI Career Assistant', desc: 'A chatbot that answers your resume, interview, skills, and job-search questions — grounded in your uploaded resume.' },
  { icon: BarChart3, title: 'Visual Skill Scores', desc: 'Interactive charts and progress bars break down your strengths across keywords, impact, structure, and more.' },
  { icon: Download, title: 'PDF Report Export', desc: 'Download a professionally formatted analysis report to keep or share with a mentor.' },
];

const STEPS = [
  { icon: FileText, title: 'Upload your resume', desc: 'Drag and drop a PDF or DOCX. We extract the text securely in your browser.' },
  { icon: Zap, title: 'AI analyzes it', desc: 'Our engine scores your resume, checks ATS compatibility, and finds gaps in seconds.' },
  { icon: TrendingUp, title: 'Act on recommendations', desc: 'Pick from 12 recommendation tracks and generate personalized, actionable advice.' },
  { icon: Award, title: 'Land the interview', desc: 'Apply with a stronger resume, a tailored cover letter, and interview prep in hand.' },
];

const TESTIMONIALS = [
  { name: 'Aisha M.', role: 'Frontend Engineer', quote: 'The ATS score and missing keywords were a revelation. I added three terms and my callback rate jumped.', rating: 5 },
  { name: 'David K.', role: 'Data Analyst', quote: 'The career assistant felt like a real coach. It used my actual resume to answer questions. Game changer.', rating: 5 },
  { name: 'Priya S.', role: 'Product Manager', quote: 'I downloaded the report, fixed my bullets with the recommendations, and got two interviews in a week.', rating: 5 },
  { name: 'Marcus T.', role: 'Backend Developer', quote: 'The skill radar chart showed exactly where I was thin. The learning roadmap was practical, not generic.', rating: 4 },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to analyze and improve one resume.',
    features: ['3 resume analyses / month', 'ATS + resume score', 'Missing keywords & skills', 'AI Career Assistant (20 msgs/day)', 'PDF report download'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    desc: 'For active job seekers running multiple applications.',
    features: ['Unlimited analyses', 'All 12 recommendation tracks', 'Unlimited career assistant', 'Cover letter generator', 'Priority AI processing', 'Analysis history & comparison'],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    name: 'Teams',
    price: '$49',
    period: '/month',
    desc: 'For career coaches and university programs.',
    features: ['Everything in Pro', 'Up to 10 seats', 'Admin dashboard', 'Aggregate analytics', 'Shared candidate reports', 'Email support'],
    cta: 'Contact us',
    highlight: false,
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-36">
        <div className="bg-grid-light dark:bg-grid-dark absolute inset-0 [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="bg-hero-glow absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <Badge tone="brand" icon={Sparkles} className="mb-5">AI-Powered • ATS-Focused</Badge>
              <h1 className="font-display text-4xl font-800 leading-[1.1] tracking-tight text-ink-900 dark:text-white sm:text-5xl lg:text-6xl">
                Land more interviews with an <span className="gradient-text">AI resume coach</span> that actually reads your resume.
              </h1>
              <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">
                Upload your resume and get an instant ATS score, a detailed breakdown of strengths and gaps, 12 personalized recommendation tracks, and an AI career assistant — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/signup')}>
                  {user ? 'Go to dashboard' : 'Analyze my resume — free'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                  See how it works
                </Button>
              </div>
              <div className="text-muted mt-8 flex items-center gap-6 text-sm">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent-500" /> PDF & DOCX</span>
                <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-accent-500" /> Results in seconds</span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="animate-fade-up [animation-delay:120ms] relative">
              <div className="gradient-border surface p-5 shadow-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted text-xs font-medium uppercase tracking-wide">Analysis Report</p>
                    <p className="text-ink-900 dark:text-white font-display text-lg font-700">Frontend_Engineer.pdf</p>
                  </div>
                  <Badge tone="accent" icon={CheckCircle2}>Analyzed</Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="surface-2 flex flex-col items-center rounded-xl p-4">
                    <ScoreRing score={78} size={104} label="Resume" />
                  </div>
                  <div className="surface-2 flex flex-col items-center rounded-xl p-4">
                    <ScoreRing score={64} size={104} label="ATS" />
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { label: 'Keywords', v: 72 },
                    { label: 'Impact (metrics)', v: 45 },
                    { label: 'Action language', v: 88 },
                    { label: 'Structure', v: 90 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-muted mb-1 flex justify-between text-xs"><span>{s.label}</span><span>{s.v}%</span></div>
                      <div className="surface-2 h-1.5 w-full overflow-hidden rounded-full">
                        <div className="gradient-brand h-full rounded-full transition-all duration-1000" style={{ width: `${s.v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="surface absolute -bottom-5 -left-5 hidden animate-float rounded-xl p-3 shadow-card sm:block">
                <div className="flex items-center gap-2">
                  <div className="bg-accent-50 dark:bg-accent-950/50 flex h-9 w-9 items-center justify-center rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-ink-900 dark:text-white text-xs font-semibold">+23% callbacks</p>
                    <p className="text-muted text-[10px]">after recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-ink-200 dark:border-ink-800 border-y bg-white/40 dark:bg-ink-950/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { v: '50k+', l: 'Resumes analyzed' },
            { v: '92%', l: 'ATS score lift' },
            { v: '12', l: 'Recommendation tracks' },
            { v: '4.9/5', l: 'User rating' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="gradient-text font-display text-3xl font-800 sm:text-4xl">{s.v}</p>
              <p className="text-muted mt-1 text-xs sm:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="accent" className="mb-3">Features</Badge>
          <h2 className="font-display text-3xl font-800 text-ink-900 dark:text-white sm:text-4xl">Everything you need to fix your resume</h2>
          <p className="text-muted mt-4 text-lg">A complete toolkit — from deep analysis to actionable AI guidance — in one focused product.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} hover className="group p-6">
              <div className="surface-2 group-hover:gradient-brand group-hover:text-white flex h-11 w-11 items-center justify-center rounded-xl transition-all">
                <f.icon className="text-brand-600 group-hover:text-white h-5 w-5 transition-colors" />
              </div>
              <h3 className="text-ink-900 dark:text-white mt-4 font-display text-lg font-700">{f.title}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="surface-2 border-ink-200 dark:border-ink-800 border-y">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" className="mb-3">How it works</Badge>
            <h2 className="font-display text-3xl font-800 text-ink-900 dark:text-white sm:text-4xl">From upload to interview in four steps</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="surface rounded-2xl p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl text-white">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-2xl font-800 text-ink-200 dark:text-ink-700">0{i + 1}</span>
                  </div>
                  <h3 className="text-ink-900 dark:text-white mt-4 font-display text-base font-700">{s.title}</h3>
                  <p className="text-muted mt-1.5 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="accent" className="mb-3">Loved by job seekers</Badge>
          <h2 className="font-display text-3xl font-800 text-ink-900 dark:text-white sm:text-4xl">Real outcomes, real interviews</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex flex-col p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-300 dark:text-ink-700'} style={{ width: 16, height: 16 }} />
                ))}
              </div>
              <p className="text-ink-800 dark:text-ink-100 mt-3 flex-1 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="border-ink-200 dark:border-ink-700 mt-4 border-t pt-4">
                <p className="text-ink-900 dark:text-white text-sm font-semibold">{t.name}</p>
                <p className="text-muted text-xs">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="surface-2 border-ink-200 dark:border-ink-800 border-y">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" className="mb-3">Pricing</Badge>
            <h2 className="font-display text-3xl font-800 text-ink-900 dark:text-white sm:text-4xl">Simple, transparent pricing</h2>
            <p className="text-muted mt-4 text-lg">Start free. Upgrade when you're in active job-search mode.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PRICING.map((p) => (
              <Card
                key={p.name}
                className={p.highlight ? 'gradient-border p-6 shadow-glow relative' : 'p-6 relative'}
              >
                {p.highlight && (
                  <span className="gradient-brand absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow">
                    Most popular
                  </span>
                )}
                <h3 className="text-ink-900 dark:text-white font-display text-lg font-700">{p.name}</h3>
                <p className="text-muted mt-1 text-sm">{p.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-800 text-ink-900 dark:text-white">{p.price}</span>
                  <span className="text-muted text-sm">{p.period}</span>
                </div>
                <Button
                  className="mt-5"
                  variant={p.highlight ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => navigate(user ? '/dashboard' : '/signup')}
                >
                  {p.cta}
                </Button>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                      <span className="text-ink-700 dark:text-ink-200">{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="gradient-brand relative overflow-hidden rounded-3xl px-6 py-16 text-center shadow-glow sm:px-12">
          <div className="bg-grid-dark absolute inset-0 opacity-20 [background-size:24px_24px]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-800 text-white sm:text-4xl">Your next interview is one upload away</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
              Join thousands of job seekers who improved their resumes with AI. It's free to start.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 bg-white text-brand-700 hover:bg-white/90"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              {user ? 'Go to dashboard' : 'Get started — free'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
