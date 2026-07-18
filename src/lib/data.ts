import { supabase } from './supabase';
import type { Analysis, ChatMessage, Resume, AnalysisResult, RecommendationCategory, GeneratedResume, GeneratedResumeData, ResumeBuilderDetails } from './types';
import { analyzeResume, fetchRecommendations, sendChatMessage, generateResume } from './ai';

export async function saveResume(file: { name: string; type: 'pdf' | 'docx'; size: number; text: string }): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      content_text: file.text,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Resume;
}

export async function getResumes(): Promise<Resume[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Resume[];
}

export async function deleteResume(id: string): Promise<void> {
  const { error } = await supabase.from('resumes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function analyzeAndSave(resumeId: string, resumeText: string, targetRole: string | null): Promise<Analysis> {
  const result: AnalysisResult = await analyzeResume(resumeText, targetRole);
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      resume_id: resumeId,
      target_role: targetRole,
      resume_score: result.resume_score,
      ats_score: result.ats_score,
      summary: result.summary,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      missing_keywords: result.missing_keywords,
      missing_tech_skills: result.missing_tech_skills,
      missing_soft_skills: result.missing_soft_skills,
      grammar_suggestions: result.grammar_suggestions,
      formatting_suggestions: result.formatting_suggestions,
      recommendations: result.recommendations,
      skill_scores: result.skill_scores,
      engine: result.engine,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Analysis;
}

export async function getAnalyses(): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*, resume:resumes(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as Analysis[];
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*, resume:resumes(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as Analysis) || null;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase.from('analyses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateRecommendations(
  id: string,
  recommendations: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('analyses')
    .update({ recommendations })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function generateRecommendations(
  resumeText: string,
  analysisSummary: string,
  categories: RecommendationCategory[],
  targetRole: string | null
) {
  return fetchRecommendations(resumeText, analysisSummary, categories, targetRole);
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data || []) as ChatMessage[];
}

export async function saveChatMessage(
  role: 'user' | 'assistant',
  content: string,
  contextResumeId: string | null
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ role, content, context_resume_id: contextResumeId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ChatMessage;
}

export async function clearChat(): Promise<void> {
  const { error } = await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
}

export async function askAssistant(
  message: string,
  contextResumeText: string | null,
  history: { role: string; content: string }[]
): Promise<string> {
  return sendChatMessage(message, contextResumeText, history);
}

export async function updateProfile(fullName: string, avatarUrl: string | null): Promise<void> {
  const { error } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');
  if (error) throw new Error(error.message);
}

// ---- Generated resumes ----

export async function getGeneratedResumes(): Promise<GeneratedResume[]> {
  const { data, error } = await supabase
    .from('generated_resumes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as GeneratedResume[];
}

export async function saveGeneratedResume(
  title: string,
  targetRole: string | null,
  data: GeneratedResumeData,
  sourceResumeId: string | null
): Promise<GeneratedResume> {
  const { data: row, error } = await supabase
    .from('generated_resumes')
    .insert({ title, target_role: targetRole, data, source_resume_id: sourceResumeId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row as GeneratedResume;
}

export async function updateGeneratedResume(id: string, title: string, data: GeneratedResumeData): Promise<void> {
  const { error } = await supabase.from('generated_resumes').update({ title, data }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteGeneratedResume(id: string): Promise<void> {
  const { error } = await supabase.from('generated_resumes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function generateResumeData(
  details: ResumeBuilderDetails,
  sourceResumeText: string | null
): Promise<GeneratedResumeData> {
  return generateResume(details, sourceResumeText);
}
