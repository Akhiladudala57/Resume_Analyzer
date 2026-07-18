export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'pdf' | 'docx';
  file_size: number;
  content_text: string;
  storage_path: string | null;
  created_at: string;
}

export interface Suggestion {
  text: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SkillScore {
  skill: string;
  score: number;
}

export interface RecommendationItem {
  text: string;
  priority?: 'high' | 'medium' | 'low';
}

export type RecommendationCategory =
  | 'resume_improvement'
  | 'ats_optimization'
  | 'skill_recommendations'
  | 'project_recommendations'
  | 'certification_recommendations'
  | 'interview_preparation'
  | 'career_path'
  | 'job_recommendations'
  | 'learning_roadmap'
  | 'cover_letter'
  | 'linkedin_optimization';

export interface RecommendationGroup {
  title: string;
  items: RecommendationItem[];
}

export type RecommendationMap = Partial<Record<RecommendationCategory, RecommendationGroup>>;

export interface Analysis {
  id: string;
  user_id: string;
  resume_id: string | null;
  target_role: string | null;
  resume_score: number;
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  missing_tech_skills: string[];
  missing_soft_skills: string[];
  grammar_suggestions: Suggestion[];
  formatting_suggestions: Suggestion[];
  recommendations: RecommendationMap;
  skill_scores: SkillScore[];
  raw_ai_response: Record<string, unknown> | null;
  engine: 'ai' | 'heuristic';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  context_resume_id: string | null;
  created_at: string;
}

export interface AdminActivity {
  id: string;
  user_id: string | null;
  event: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface GeneratedResumeContact {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

export interface GeneratedResumeExperience {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

export interface GeneratedResumeEducation {
  school: string;
  degree: string;
  year: string;
}

export interface GeneratedResumeProject {
  name: string;
  description: string;
  tech: string[];
}

export interface GeneratedResumeData {
  contact: GeneratedResumeContact;
  summary: string;
  experience: GeneratedResumeExperience[];
  education: GeneratedResumeEducation[];
  skills: string[];
  projects: GeneratedResumeProject[];
  certifications: string[];
}

export interface GeneratedResume {
  id: string;
  user_id: string;
  title: string;
  target_role: string | null;
  data: GeneratedResumeData;
  source_resume_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeBuilderDetails {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  targetRole?: string;
  summary?: string;
  experience?: { company?: string; role?: string; start?: string; end?: string; bullets?: string }[];
  education?: { school?: string; degree?: string; year?: string }[];
  skills?: string;
  projects?: { name?: string; description?: string; tech?: string }[];
  certifications?: string;
}

export interface AnalysisResult {
  resume_score: number;
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  missing_tech_skills: string[];
  missing_soft_skills: string[];
  grammar_suggestions: Suggestion[];
  formatting_suggestions: Suggestion[];
  recommendations: RecommendationMap;
  skill_scores: SkillScore[];
  engine: 'ai' | 'heuristic';
}

export const RECOMMENDATION_CATEGORIES: {
  id: RecommendationCategory;
  label: string;
  description: string;
}[] = [
  { id: 'resume_improvement', label: 'Resume Improvement', description: 'Concrete edits to strengthen bullet points, structure, and impact.' },
  { id: 'ats_optimization', label: 'ATS Optimization', description: 'Keyword and formatting fixes so parsers read your resume correctly.' },
  { id: 'skill_recommendations', label: 'Skill Recommendations', description: 'High-impact technical and soft skills to add for your target role.' },
  { id: 'project_recommendations', label: 'Project Recommendations', description: 'Portfolio projects that fill gaps and impress recruiters.' },
  { id: 'certification_recommendations', label: 'Certification Recommendations', description: 'Certifications that boost credibility and ATS keyword match.' },
  { id: 'interview_preparation', label: 'Interview Preparation', description: 'Likely questions and STAR-format answer starters.' },
  { id: 'career_path', label: 'Career Path Suggestions', description: 'Realistic next roles and a trajectory from your current position.' },
  { id: 'job_recommendations', label: 'Job Recommendations', description: 'Roles and companies aligned with your profile.' },
  { id: 'learning_roadmap', label: 'Learning Roadmap', description: 'A sequenced learning plan to close your biggest skill gaps.' },
  { id: 'cover_letter', label: 'Cover Letter Generator', description: 'A tailored cover letter draft you can edit and send.' },
  { id: 'linkedin_optimization', label: 'LinkedIn Optimization', description: 'Headline, about, and experience rewrites for your profile.' },
];
