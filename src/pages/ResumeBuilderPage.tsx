import { useEffect, useState } from 'react';
import {
  Wand2, FileText, Download, Save, Trash2, Plus, Sparkles, Eye, Pencil,
  Mail, Phone, MapPin, Linkedin, Github, Briefcase, GraduationCap,
  FolderGit2, Award, User,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';
import { EmptyState, LoadingOverlay, Skeleton } from '../components/ui/Feedback';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

import { getResumes } from '../lib/data';
import {
  generateResumeData, getGeneratedResumes, saveGeneratedResume,
  updateGeneratedResume, deleteGeneratedResume,
} from '../lib/data';
import { downloadGeneratedResume } from '../lib/pdf';
import type { Resume, GeneratedResume, GeneratedResumeData, ResumeBuilderDetails } from '../lib/types';
import { formatDate, relativeTime } from '../lib/utils';

type View = 'form' | 'preview';

export function ResumeBuilderPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<View>('form');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sourceResumes, setSourceResumes] = useState<Resume[]>([]);
  const [sourceResumeId, setSourceResumeId] = useState<string>('');
  const [generated, setGenerated] = useState<GeneratedResumeData | null>(null);
  const [savedResumes, setSavedResumes] = useState<GeneratedResume[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [experience, setExperience] = useState<{ company: string; role: string; start: string; end: string; bullets: string }[]>(
    [{ company: '', role: '', start: '', end: '', bullets: '' }]
  );
  const [education, setEducation] = useState<{ school: string; degree: string; year: string }[]>(
    [{ school: '', degree: '', year: '' }]
  );
  const [projects, setProjects] = useState<{ name: string; description: string; tech: string }[]>([]);

  useEffect(() => {
    void init();
  }, []);

  const init = async () => {
    try {
      const [rs, saved] = await Promise.all([getResumes(), getGeneratedResumes()]);
      setSourceResumes(rs);
      setSavedResumes(saved);
      if (rs.length > 0) setSourceResumeId(rs[0].id);
    } catch (e) {
      toast.error('Could not load data', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const buildDetails = (): ResumeBuilderDetails => ({
    fullName, email, phone, location, linkedin, github, targetRole, summary, skills, certifications,
    experience: experience.map((e) => ({ company: e.company, role: e.role, start: e.start, end: e.end, bullets: e.bullets })),
    education: education.map((e) => ({ school: e.school, degree: e.degree, year: e.year })),
    projects: projects.map((p) => ({ name: p.name, description: p.description, tech: p.tech })),
  });

  const generate = async () => {
    setGenerating(true);
    try {
      const source = sourceResumes.find((r) => r.id === sourceResumeId) || null;
      const result = await generateResumeData(buildDetails(), source?.content_text || null);
      setGenerated(result);
      // populate editable fields from generated output
      setFullName(result.contact.name);
      setEmail(result.contact.email);
      setPhone(result.contact.phone);
      setLocation(result.contact.location);
      setLinkedin(result.contact.linkedin);
      setGithub(result.contact.github);
      setSummary(result.summary);
      setSkills(result.skills.join(', '));
      setCertifications(result.certifications.join(', '));
      setExperience(result.experience.map((e) => ({ company: e.company, role: e.role, start: '', end: '', bullets: e.bullets.join('\n') })));
      setEducation(result.education.map((e) => ({ school: e.school, degree: e.degree, year: e.year })));
      setProjects(result.projects.map((p) => ({ name: p.name, description: p.description, tech: p.tech.join(', ') })));
      setView('preview');
      toast.success('Resume generated', 'Review and edit the preview, then save.');
    } catch (e) {
      toast.error('Generation failed', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const rebuildFromForm = (): GeneratedResumeData => ({
    contact: { name: fullName, email, phone, location, linkedin, github },
    summary,
    experience: experience.map((e) => ({
      company: e.company, role: e.role,
      duration: [e.start, e.end].filter(Boolean).join(' – ') || '—',
      bullets: e.bullets.split(/\n/).map((b) => b.replace(/^\s*[-•]\s*/, '').trim()).filter(Boolean),
    })),
    education: education.map((e) => ({ school: e.school, degree: e.degree, year: e.year })),
    skills: skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
    projects: projects.map((p) => ({ name: p.name, description: p.description, tech: p.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean) })),
    certifications: certifications.split(/[,;]/).map((c) => c.trim()).filter(Boolean),
  });

  const save = async () => {
    const data = rebuildFromForm();
    const title = `${targetRole || 'Resume'} — ${fullName || 'Untitled'}`;
    setSaving(true);
    try {
      if (editingId) {
        await updateGeneratedResume(editingId, title, data);
        toast.success('Resume updated');
      } else {
        const saved = await saveGeneratedResume(title, targetRole || null, data, sourceResumeId || null);
        setEditingId(saved.id);
        toast.success('Resume saved');
      }
      const refreshed = await getGeneratedResumes();
      setSavedResumes(refreshed);
    } catch (e) {
      toast.error('Save failed', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const loadSaved = (gr: GeneratedResume) => {
    const d = gr.data;
    setFullName(d.contact.name); setEmail(d.contact.email); setPhone(d.contact.phone);
    setLocation(d.contact.location); setLinkedin(d.contact.linkedin); setGithub(d.contact.github);
    setSummary(d.summary); setSkills(d.skills.join(', ')); setCertifications(d.certifications.join(', '));
    setTargetRole(gr.target_role || '');
    setExperience(d.experience.map((e) => ({ company: e.company, role: e.role, start: '', end: '', bullets: e.bullets.join('\n') })));
    setEducation(d.education.map((e) => ({ school: e.school, degree: e.degree, year: e.year })));
    setProjects(d.projects.map((p) => ({ name: p.name, description: p.description, tech: p.tech.join(', ') })));
    setEditingId(gr.id);
    setGenerated(d);
    setView('preview');
  };

  const remove = async (id: string) => {
    try {
      await deleteGeneratedResume(id);
      setSavedResumes((p) => p.filter((r) => r.id !== id));
      if (editingId === id) { setEditingId(null); setGenerated(null); setView('form'); }
      toast.success('Deleted');
    } catch (e) {
      toast.error('Delete failed', (e as Error).message);
    }
  };

  const download = () => {
    const data = rebuildFromForm();
    const title = `${targetRole || 'Resume'} — ${fullName || 'Untitled'}`;
    downloadGeneratedResume(data, title);
    toast.success('PDF downloaded');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-ink-900 dark:text-white">Resume Builder</h1>
          <p className="text-muted mt-1 text-sm">Generate an ATS-optimized resume from your details — or improve an uploaded one.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'form' ? 'primary' : 'outline'} size="sm" onClick={() => setView('form')}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant={view === 'preview' ? 'primary' : 'outline'} size="sm" onClick={() => setView('preview')} disabled={!generated && !editingId}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,300px]">
          {/* Main */}
          <div className="relative">
            {view === 'form' ? (
              <FormView
                fullName={fullName} setFullName={setFullName}
                email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone}
                location={location} setLocation={setLocation}
                linkedin={linkedin} setLinkedin={setLinkedin}
                github={github} setGithub={setGithub}
                targetRole={targetRole} setTargetRole={setTargetRole}
                summary={summary} setSummary={setSummary}
                skills={skills} setSkills={setSkills}
                certifications={certifications} setCertifications={setCertifications}
                experience={experience} setExperience={setExperience}
                education={education} setEducation={setEducation}
                projects={projects} setProjects={setProjects}
                sourceResumes={sourceResumes} sourceResumeId={sourceResumeId} setSourceResumeId={setSourceResumeId}
                onGenerate={generate} generating={generating}
              />
            ) : (
              <PreviewView data={rebuildFromForm()} />
            )}
            {generating && <LoadingOverlay label="Generating your optimized resume…" />}
          </div>

          {/* Sidebar: actions + saved */}
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-ink-900 dark:text-white font-display text-sm font-700">Actions</h3>
              <div className="mt-3 space-y-2">
                <Button fullWidth size="sm" onClick={save} loading={saving} disabled={!generated && !editingId}>
                  {!saving && <Save className="h-4 w-4" />} Save resume
                </Button>
                <Button fullWidth size="sm" variant="outline" onClick={download} disabled={!generated && !editingId}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button fullWidth size="sm" variant="ghost" onClick={generate} loading={generating}>
                  {!generating && <Sparkles className="h-4 w-4" />} Regenerate
                </Button>
              </div>
              {editingId && <p className="text-muted mt-3 text-xs">Editing saved resume · {relativeTime(savedResumes.find((r) => r.id === editingId)?.updated_at || '')}</p>}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <FileText className="text-brand-500 h-4 w-4" />
                <h3 className="text-ink-900 dark:text-white font-display text-sm font-700">Saved resumes</h3>
                <Badge tone="neutral">{savedResumes.length}</Badge>
              </div>
              {savedResumes.length === 0 ? (
                <p className="text-muted mt-3 text-xs">Generated resumes you save will appear here.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {savedResumes.map((gr) => (
                    <div key={gr.id} className="surface-2 group rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => loadSaved(gr)} className="min-w-0 flex-1 text-left">
                          <p className="text-ink-900 dark:text-white truncate text-xs font-semibold">{gr.title}</p>
                          <p className="text-muted mt-0.5 text-[10px]">{formatDate(gr.created_at)} · {gr.data.experience.length} roles</p>
                        </button>
                        <button onClick={() => remove(gr.id)} className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="surface-2 p-5">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-ink-900 dark:text-white text-xs font-semibold">Tip</p>
                  <p className="text-muted mt-1 text-[11px] leading-relaxed">Select an uploaded resume as a source — the generator will improve and restructure it with stronger, quantified bullets and ATS keywords.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Form view ----

interface FormViewProps {
  fullName: string; setFullName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  linkedin: string; setLinkedin: (v: string) => void;
  github: string; setGithub: (v: string) => void;
  targetRole: string; setTargetRole: (v: string) => void;
  summary: string; setSummary: (v: string) => void;
  skills: string; setSkills: (v: string) => void;
  certifications: string; setCertifications: (v: string) => void;
  experience: { company: string; role: string; start: string; end: string; bullets: string }[];
  setExperience: (v: { company: string; role: string; start: string; end: string; bullets: string }[]) => void;
  education: { school: string; degree: string; year: string }[];
  setEducation: (v: { school: string; degree: string; year: string }[]) => void;
  projects: { name: string; description: string; tech: string }[];
  setProjects: (v: { name: string; description: string; tech: string }[]) => void;
  sourceResumes: Resume[]; sourceResumeId: string; setSourceResumeId: (v: string) => void;
  onGenerate: () => void; generating: boolean;
}

function FormView(p: FormViewProps) {
  const updateExp = (i: number, key: keyof FormViewProps['experience'][0], val: string) => {
    const next = [...p.experience];
    next[i] = { ...next[i], [key]: val };
    p.setExperience(next);
  };
  const updateEdu = (i: number, key: keyof FormViewProps['education'][0], val: string) => {
    const next = [...p.education];
    next[i] = { ...next[i], [key]: val };
    p.setEducation(next);
  };
  const updateProj = (i: number, key: keyof FormViewProps['projects'][0], val: string) => {
    const next = [...p.projects];
    next[i] = { ...next[i], [key]: val };
    p.setProjects(next);
  };

  return (
    <div className="space-y-6">
      {/* Source */}
      {p.sourceResumes.length > 0 && (
        <Card className="p-5">
          <label className="text-ink-800 dark:text-ink-100 mb-1.5 block text-sm font-medium">Source resume (optional)</label>
          <select
            value={p.sourceResumeId}
            onChange={(e) => p.setSourceResumeId(e.target.value)}
            className="surface-2 text-ink-900 dark:text-white h-11 w-full rounded-xl border px-3 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Start from scratch</option>
            {p.sourceResumes.map((r) => <option key={r.id} value={r.id}>{r.file_name}</option>)}
          </select>
          <p className="text-muted mt-2 text-xs">The AI will use the selected resume's content to generate an improved version.</p>
        </Card>
      )}

      {/* Contact */}
      <Card className="p-5">
        <SectionTitle icon={User} title="Contact" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={p.fullName} onChange={(e) => p.setFullName(e.target.value)} placeholder="Jane Doe" />
          <Input label="Target role" value={p.targetRole} onChange={(e) => p.setTargetRole(e.target.value)} placeholder="Frontend Developer" />
          <Input label="Email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} icon={Mail} placeholder="you@example.com" />
          <Input label="Phone" value={p.phone} onChange={(e) => p.setPhone(e.target.value)} icon={Phone} placeholder="+1 555 000 0000" />
          <Input label="Location" value={p.location} onChange={(e) => p.setLocation(e.target.value)} icon={MapPin} placeholder="San Francisco, CA" />
          <Input label="LinkedIn" value={p.linkedin} onChange={(e) => p.setLinkedin(e.target.value)} icon={Linkedin} placeholder="linkedin.com/in/you" />
          <Input label="GitHub" value={p.github} onChange={(e) => p.setGithub(e.target.value)} icon={Github} placeholder="github.com/you" />
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-5">
        <SectionTitle icon={Sparkles} title="Professional summary" />
        <Textarea className="mt-4" rows={3} value={p.summary} onChange={(e) => p.setSummary(e.target.value)} placeholder="Leave blank to auto-generate, or write your own." />
      </Card>

      {/* Experience */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <SectionTitle icon={Briefcase} title="Experience" />
          <Button size="sm" variant="ghost" onClick={() => p.setExperience([...p.experience, { company: '', role: '', start: '', end: '', bullets: '' }])}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {p.experience.map((exp, i) => (
            <div key={i} className="surface-2 rounded-xl p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Company" value={exp.company} onChange={(e) => updateExp(i, 'company', e.target.value)} placeholder="Acme Inc." />
                <Input label="Role" value={exp.role} onChange={(e) => updateExp(i, 'role', e.target.value)} placeholder="Software Engineer" />
                <Input label="Start" value={exp.start} onChange={(e) => updateExp(i, 'start', e.target.value)} placeholder="Jan 2022" />
                <Input label="End" value={exp.end} onChange={(e) => updateExp(i, 'end', e.target.value)} placeholder="Present" />
              </div>
              <Textarea className="mt-3" label="Bullet points (one per line)" rows={3} value={exp.bullets} onChange={(e) => updateExp(i, 'bullets', e.target.value)} placeholder="Led development of...&#10;Reduced latency by 40%..." />
              {p.experience.length > 1 && (
                <button onClick={() => p.setExperience(p.experience.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500 mt-2 text-xs">Remove</button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <SectionTitle icon={GraduationCap} title="Education" />
          <Button size="sm" variant="ghost" onClick={() => p.setEducation([...p.education, { school: '', degree: '', year: '' }])}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {p.education.map((ed, i) => (
            <div key={i} className="surface-2 grid gap-3 rounded-xl p-4 sm:grid-cols-3">
              <Input label="School" value={ed.school} onChange={(e) => updateEdu(i, 'school', e.target.value)} placeholder="State University" />
              <Input label="Degree" value={ed.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} placeholder="B.Sc Computer Science" />
              <Input label="Year" value={ed.year} onChange={(e) => updateEdu(i, 'year', e.target.value)} placeholder="2020" />
            </div>
          ))}
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-5">
        <SectionTitle icon={Award} title="Skills" />
        <Input className="mt-4" value={p.skills} onChange={(e) => p.setSkills(e.target.value)} placeholder="JavaScript, TypeScript, React, Node.js, AWS" />
        <p className="text-muted mt-2 text-xs">Comma-separated. Leave blank to auto-generate from the source resume.</p>
      </Card>

      {/* Projects */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <SectionTitle icon={FolderGit2} title="Projects" />
          <Button size="sm" variant="ghost" onClick={() => p.setProjects([...p.projects, { name: '', description: '', tech: '' }])}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {p.projects.length === 0 && <p className="text-muted text-sm">No projects added. Click "Add" to include one.</p>}
          {p.projects.map((proj, i) => (
            <div key={i} className="surface-2 space-y-3 rounded-xl p-4">
              <Input label="Name" value={proj.name} onChange={(e) => updateProj(i, 'name', e.target.value)} placeholder="Project name" />
              <Textarea label="Description" rows={2} value={proj.description} onChange={(e) => updateProj(i, 'description', e.target.value)} placeholder="What it does and your role." />
              <Input label="Tech (comma-separated)" value={proj.tech} onChange={(e) => updateProj(i, 'tech', e.target.value)} placeholder="React, Node.js, PostgreSQL" />
            </div>
          ))}
        </div>
      </Card>

      {/* Certifications */}
      <Card className="p-5">
        <SectionTitle icon={Award} title="Certifications" />
        <Input className="mt-4" value={p.certifications} onChange={(e) => p.setCertifications(e.target.value)} placeholder="AWS Solutions Architect, Scrum Master" />
      </Card>

      <Button size="lg" fullWidth onClick={p.onGenerate} loading={p.generating}>
        {!p.generating && <Wand2 className="h-5 w-5" />} Generate optimized resume
      </Button>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="surface-2 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon className="h-4 w-4 text-brand-500" />
      </div>
      <h3 className="text-ink-900 dark:text-white font-display text-sm font-700">{title}</h3>
    </div>
  );
}

// ---- Preview view ----

function PreviewView({ data }: { data: GeneratedResumeData }) {
  const hasContent = data.contact.name || data.summary || data.experience.length > 0;
  if (!hasContent) {
    return (
      <Card className="p-10">
        <EmptyState icon={FileText} title="Nothing to preview yet" description="Fill in the form and click Generate to build your resume." />
      </Card>
    );
  }
  return (
    <Card className="mx-auto max-w-3xl p-8 sm:p-12">
      {/* Header */}
      <div className="border-ink-200 dark:border-ink-700 border-b pb-5">
        <h1 className="font-display text-3xl font-800 text-ink-900 dark:text-white">{data.contact.name || 'Your Name'}</h1>
        {data.contact.email && <p className="text-muted mt-1.5 text-sm">{[data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin, data.contact.github].filter(Boolean).join('  |  ')}</p>}
      </div>

      {data.summary && (
        <section className="mt-5">
          <PreviewHeading>Professional Summary</PreviewHeading>
          <p className="text-ink-700 dark:text-ink-200 mt-2 text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mt-6">
          <PreviewHeading>Experience</PreviewHeading>
          <div className="mt-3 space-y-5">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <p className="text-ink-900 dark:text-white font-semibold text-sm">{exp.role} · <span className="text-ink-600 dark:text-ink-300 font-normal">{exp.company}</span></p>
                  <p className="text-muted text-xs italic">{exp.duration}</p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-ink-700 dark:text-ink-200 flex gap-2 text-sm leading-relaxed">
                      <span className="text-brand-500 mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mt-6">
          <PreviewHeading>Education</PreviewHeading>
          <div className="mt-3 space-y-2">
            {data.education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between">
                <p className="text-ink-900 dark:text-white text-sm font-medium">{ed.degree}</p>
                <p className="text-muted text-xs">{ed.year}</p>
              </div>
            ))}
            {data.education.map((ed, i) => ed.school && <p key={`s${i}`} className="text-muted -mt-1 text-xs italic">{ed.school}</p>)}
          </div>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mt-6">
          <PreviewHeading>Skills</PreviewHeading>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.skills.map((s, i) => (
              <span key={i} className="surface-2 text-ink-700 dark:text-ink-200 rounded-lg px-2.5 py-1 text-xs font-medium">{s}</span>
            ))}
          </div>
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="mt-6">
          <PreviewHeading>Projects</PreviewHeading>
          <div className="mt-3 space-y-4">
            {data.projects.map((proj, i) => (
              <div key={i}>
                <p className="text-ink-900 dark:text-white text-sm font-semibold">{proj.name}</p>
                <p className="text-ink-700 dark:text-ink-200 mt-0.5 text-sm">{proj.description}</p>
                {proj.tech.length > 0 && <p className="text-muted mt-1 text-xs italic">Tech: {proj.tech.join(', ')}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.certifications.length > 0 && (
        <section className="mt-6">
          <PreviewHeading>Certifications</PreviewHeading>
          <ul className="mt-2 space-y-1">
            {data.certifications.map((c, i) => (
              <li key={i} className="text-ink-700 dark:text-ink-200 flex gap-2 text-sm">
                <span className="text-brand-500 mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}

function PreviewHeading({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3 className="text-brand-600 dark:text-brand-400 font-display text-xs font-700 uppercase tracking-wider">{children}</h3>
      <div className="border-ink-200 dark:border-ink-700 mt-1.5 h-px w-full border-t" />
    </>
  );
}
