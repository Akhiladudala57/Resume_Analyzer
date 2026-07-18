import { supabase, supabaseUrl } from './supabase';
import type { AnalysisResult, RecommendationCategory, ResumeBuilderDetails, GeneratedResumeData } from './types';

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

function bearerHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
}

export interface AnalyzeRequest {
  resumeText: string;
  targetRole?: string;
}

export async function analyzeResume(
  resumeText: string,
  targetRole: string | null
): Promise<AnalysisResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('You must be signed in to analyze a resume.');

  const res = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: JSON.stringify({ resumeText, targetRole: targetRole ?? undefined } satisfies AnalyzeRequest),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Analysis failed (${res.status})`);
  }
  const data = await res.json();
  if (!data || typeof data.resume_score !== 'number') {
    throw new Error('Received an invalid analysis response.');
  }
  return data as AnalysisResult;
}

export interface RecommendRequest {
  resumeText: string;
  analysisSummary: string;
  categories: RecommendationCategory[];
  targetRole?: string;
}

export async function fetchRecommendations(
  resumeText: string,
  analysisSummary: string,
  categories: RecommendationCategory[],
  targetRole: string | null
): Promise<Record<string, { title: string; items: { text: string; priority?: string }[] }>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('You must be signed in.');

  const res = await fetch(`${supabaseUrl}/functions/v1/career-chat`, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: JSON.stringify({
      mode: 'recommendations',
      resumeText,
      analysisSummary,
      categories,
      targetRole: targetRole ?? undefined,
    } satisfies RecommendRequest & { mode: string }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  return data.recommendations ?? {};
}

export async function sendChatMessage(
  message: string,
  contextResumeText: string | null,
  history: { role: string; content: string }[]
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('You must be signed in.');

  const res = await fetch(`${supabaseUrl}/functions/v1/career-chat`, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: JSON.stringify({
      mode: 'chat',
      message,
      resumeText: contextResumeText,
      history,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat failed (${res.status})`);
  }
  const data = await res.json();
  if (typeof data.reply !== 'string') throw new Error('Invalid chat response.');
  return data.reply as string;
}

// Re-export authHeaders to satisfy linter when used by other modules.
export { authHeaders };

export async function generateResume(
  details: ResumeBuilderDetails,
  sourceResumeText: string | null
): Promise<GeneratedResumeData> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('You must be signed in.');

  const res = await fetch(`${supabaseUrl}/functions/v1/career-chat`, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: JSON.stringify({
      mode: 'generate_resume',
      details,
      resumeText: sourceResumeText,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Generation failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.resume || !data.resume.contact) throw new Error('Invalid resume response.');
  return data.resume as GeneratedResumeData;
}
