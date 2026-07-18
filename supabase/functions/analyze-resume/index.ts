import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeBody {
  resumeText: string;
  targetRole?: string;
}

// ---------------------------------------------------------------------------
// Heuristic analysis engine — produces a real, useful breakdown from the
// extracted resume text. Used when no AI provider key is configured.
// ---------------------------------------------------------------------------

const ACTION_VERBS = [
  "led", "built", "designed", "developed", "implemented", "launched", "created",
  "architected", "optimized", "improved", "increased", "reduced", "automated",
  "shipped", "delivered", "managed", "drove", "scaled", "established", "spearheaded",
  "engineered", "modernized", "streamlined", "accelerated", "migrated", "integrated",
  "mentored", "trained", "founded", "negotiated", "analyzed", "researched",
];

const WEAK_VERBS = ["responsible for", "in charge of", "worked on", "helped with", "duties included", "tasked with"];

const TECH_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin",
  "react", "react.js", "reactjs", "vue", "vue.js", "angular", "next.js", "nextjs", "svelte", "sveltekit",
  "node", "node.js", "express", "nestjs", "django", "flask", "fastapi", "spring", "rails", "laravel",
  "html", "css", "tailwind", "sass", "bootstrap", "material-ui", "mui",
  "sql", "postgres", "postgresql", "mysql", "mongodb", "redis", "sqlite", "dynamodb", "cassandra",
  "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform", "ansible", "ci/cd", "jenkins",
  "git", "github", "gitlab", "bitbucket",
  "rest", "graphql", "grpc", "websockets", "microservices",
  "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "scipy", "jupyter", "keras", "opencv", "nlp",
  "machine learning", "deep learning", "data science", "data analysis", "data visualization",
  "tableau", "power bi", "powerbi", "excel", "looker",
  "kafka", "spark", "hadoop", "airflow", "dbt", "snowflake", "bigquery",
  "linux", "bash", "shell", "powershell",
  "agile", "scrum", "kanban", "jira", "confluence",
  "figma", "sketch", "adobe xd", "photoshop", "illustrator",
  "testing", "jest", "cypress", "playwright", "selenium", "mocha", "pytest", "junit",
];

const SOFT_SKILLS = [
  "leadership", "communication", "teamwork", "collaboration", "problem-solving",
  "problem solving", "critical thinking", "adaptability", "creativity", "time management",
  "project management", "mentoring", "coaching", "presentation", "negotiation",
  "stakeholder", "cross-functional", "cross functional", "public speaking", "writing",
];

const ATS_KEYWORDS_BY_ROLE: Record<string, string[]> = {
  "software engineer": ["system design", "api", "testing", "ci/cd", "scalability", "code review", "agile", "version control", "algorithms", "data structures"],
  "frontend developer": ["responsive design", "accessibility", "performance optimization", "state management", "component architecture", "cross-browser", "ui/ux", "webpack", "typescript"],
  "backend developer": ["api design", "database", "authentication", "caching", "microservices", "rest", "sql", "security", "scalability", "message queues"],
  "full stack developer": ["frontend", "backend", "api", "database", "devops", "authentication", "state management", "rest", "typescript", "ci/cd"],
  "data scientist": ["python", "machine learning", "statistics", "sql", "data visualization", "pandas", "scikit-learn", "experimentation", "a/b testing", "feature engineering"],
  "data analyst": ["sql", "excel", "tableau", "data visualization", "statistics", "python", "reporting", "dashboards", "kpi", "a/b testing"],
  "product manager": ["roadmap", "stakeholder", "user research", "kpi", "okrs", "agile", "prioritization", "go-to-market", "a/b testing", "analytics"],
  "devops engineer": ["kubernetes", "docker", "terraform", "ci/cd", "aws", "monitoring", "linux", "ansible", "networking", "security"],
  "ux designer": ["user research", "wireframing", "prototyping", "figma", "usability testing", "interaction design", "accessibility", "design systems", "journey mapping", "persona"],
  "marketing": ["seo", "content", "analytics", "campaign", "social media", "email marketing", "conversion", "google analytics", "copywriting", "branding"],
};

const COMMON_SOFT_SKILL_DEMANDS = ["leadership", "communication", "collaboration", "problem-solving", "adaptability"];

function normalize(text: string): string {
  return text.toLowerCase();
}

function countOccurrences(haystack: string, needle: string): number {
  const re = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  return (haystack.match(re) || []).length;
}

function hasContactInfo(text: string): { hasEmail: boolean; hasPhone: boolean; hasLinkedin: boolean } {
  return {
    hasEmail: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text),
    hasPhone: /(\+?\d[\d\s().-]{8,}\d)/.test(text),
    hasLinkedin: /linkedin\.com/i.test(text),
  };
}

function detectSections(text: string): Record<string, boolean> {
  const t = normalize(text);
  return {
    experience: /experience|employment|work history|professional background/.test(t),
    education: /education|university|college|bachelor|master|b\.?sc|m\.?sc|degree/.test(t),
    skills: /^skills|technical skills|core competencies|technologies/.test(t) || /skills\b/.test(t),
    projects: /projects|portfolio|github\.com/.test(t),
    summary: /summary|objective|profile|about me/.test(t),
    certifications: /certification|certified|certificate/.test(t),
  };
}

function quantifiedAchievements(text: string): number {
  const matches = text.match(/(\d+%|\$\d|[\d,]+ (users|customers|hours|days|weeks|months|requests|transactions|deployments|revenue|impressions|conversions))/gi);
  return matches ? matches.length : 0;
}

function actionVerbCount(text: string): number {
  const t = normalize(text);
  return ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`).test(t)).length;
}

function weakVerbCount(text: string): number {
  const t = normalize(text);
  return WEAK_VERBS.filter((v) => t.includes(v)).length;
}

function avgWordsPerLine(text: string): number {
  const lines = text.split(/\n+/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return 0;
  const total = lines.reduce((sum, l) => sum + l.split(/\s+/).filter(Boolean).length, 0);
  return total / lines.length;
}

function detectRole(text: string, target?: string): string {
  if (target && target.trim()) return normalize(target.trim());
  const t = normalize(text);
  const priorities: [string, RegExp][] = [
    ["data scientist", /data scientist|machine learning engineer|ml engineer/],
    ["data analyst", /data analyst|business analyst|analytics/],
    ["devops engineer", /devops|site reliability|sre|platform engineer/],
    ["ux designer", /ux designer|ux\/ui|product designer|interaction designer/],
    ["product manager", /product manager|program manager|pm\b/],
    ["frontend developer", /frontend|front-end|front end|ui developer|react developer/],
    ["backend developer", /backend|back-end|back end|api developer|server engineer/],
    ["full stack developer", /full stack|full-stack|fullstack/],
    ["software engineer", /software engineer|software developer|swe\b|engineer|developer/],
    ["marketing", /marketing|seo specialist|content strategist|growth/],
  ];
  for (const [role, re] of priorities) if (re.test(t)) return role;
  return "software engineer";
}

function uniqueSkillsFound(text: string, pool: string[]): string[] {
  const t = normalize(text);
  return pool.filter((s) => new RegExp(`(^|[^a-z+])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\+/g, "\\+")}([^a-z+]|$)`).test(t));
}

interface HeuristicResult {
  resume_score: number;
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  missing_tech_skills: string[];
  missing_soft_skills: string[];
  grammar_suggestions: { text: string; severity: "high" | "medium" | "low" }[];
  formatting_suggestions: { text: string; severity: "high" | "medium" | "low" }[];
  skill_scores: { skill: string; score: number }[];
  engine: "heuristic";
}

function heuristicAnalyze(resumeText: string, targetRole?: string): HeuristicResult {
  const text = resumeText;
  const norm = normalize(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const role = detectRole(text, targetRole);
  const roleKeywords = ATS_KEYWORDS_BY_ROLE[role] || ATS_KEYWORDS_BY_ROLE["software engineer"];

  const sections = detectSections(text);
  const contact = hasContactInfo(text);
  const quantCount = quantifiedAchievements(text);
  const actionCount = actionVerbCount(text);
  const weakCount = weakVerbCount(text);
  const avgLine = avgWordsPerLine(text);

  const foundTech = uniqueSkillsFound(text, TECH_SKILLS);
  const foundSoft = uniqueSkillsFound(text, SOFT_SKILLS);
  const foundRoleKeywords = roleKeywords.filter((k) => norm.includes(k));
  const missingKeywords = roleKeywords.filter((k) => !norm.includes(k));
  const missingTech = TECH_SKILLS
    .filter((s) => roleKeywords.some((rk) => rk.includes(s) || s.includes(rk)) || ["typescript", "git", "testing"].includes(s))
    .filter((s) => !foundTech.includes(s))
    .slice(0, 8);
  const missingSoft = COMMON_SOFT_SKILL_DEMANDS.filter((s) => !foundSoft.includes(s));

  // ---- Scoring ----
  let atsScore = 0;
  if (contact.hasEmail) atsScore += 8;
  if (contact.hasPhone) atsScore += 6;
  if (contact.hasLinkedin) atsScore += 6;
  atsScore += Math.min(20, foundRoleKeywords.length * 5); // keyword match
  atsScore += Math.min(20, foundTech.length * 3); // tech skills present
  if (sections.experience) atsScore += 12;
  if (sections.education) atsScore += 8;
  if (sections.skills) atsScore += 10;
  if (sections.projects) atsScore += 5;
  if (wordCount >= 300 && wordCount <= 900) atsScore += 5;
  if (quantCount >= 3) atsScore += 5;
  atsScore = Math.min(100, atsScore);

  let qualityScore = 0;
  qualityScore += Math.min(25, actionCount * 4);
  qualityScore += Math.min(20, quantCount * 5);
  qualityScore -= Math.min(15, weakCount * 5);
  if (sections.summary) qualityScore += 8;
  if (sections.certifications) qualityScore += 6;
  if (contact.hasLinkedin) qualityScore += 4;
  if (avgLine > 0 && avgLine <= 25) qualityScore += 6;
  else if (avgLine > 25 && avgLine <= 40) qualityScore += 3;
  else qualityScore -= 4;
  if (wordCount < 150) qualityScore -= 12;
  if (wordCount > 1000) qualityScore -= 8;
  qualityScore += Math.round(atsScore * 0.37);
  qualityScore = Math.max(5, Math.min(100, qualityScore));

  // ---- Strengths / Weaknesses ----
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (actionCount >= 4) strengths.push(`Strong use of ${actionCount} action verbs to describe impact.`);
  if (quantCount >= 3) strengths.push(`${quantCount} quantified achievements — numbers make impact concrete.`);
  if (foundTech.length >= 6) strengths.push(`Diverse technical skill set (${foundTech.slice(0, 5).join(", ")}${foundTech.length > 5 ? ", …" : ""}).`);
  if (foundRoleKeywords.length >= roleKeywords.length * 0.6) strengths.push("Good alignment of keywords with the target role.");
  if (sections.experience && sections.education && sections.skills) strengths.push("Core sections (experience, education, skills) are all present.");
  if (contact.hasEmail && contact.hasPhone && contact.hasLinkedin) strengths.push("Complete contact block with email, phone, and LinkedIn.");
  if (sections.projects) strengths.push("Projects section demonstrates applied work.");
  if (strengths.length === 0) strengths.push("Resume is parseable and contains the basic structure expected by recruiters.");

  if (weakCount > 0) weaknesses.push(`Uses ${weakCount} weak phrase(s) like "responsible for" — replace with action verbs.`);
  if (quantCount < 2) weaknesses.push("Few quantified achievements. Add metrics (%, $, time saved, users impacted).");
  if (!contact.hasLinkedin) weaknesses.push("No LinkedIn URL — recruiters expect a profile link.");
  if (!sections.summary) weaknesses.push("Missing a professional summary at the top.");
  if (!sections.projects && foundTech.length < 8) weaknesses.push("No projects section to evidence hands-on skills.");
  if (wordCount < 200) weaknesses.push("Resume is short — may lack detail and keyword density.");
  if (wordCount > 1000) weaknesses.push("Resume is long — aim for 1-2 pages; recruiters skim.");
  if (missingKeywords.length > roleKeywords.length * 0.5) weaknesses.push("Many target-role keywords are missing (see Missing Keywords).");
  if (avgLine > 40) weaknesses.push("Dense, long lines — break into scannable bullet points.");
  if (weaknesses.length === 0) weaknesses.push("No major weaknesses detected — focus on fine-tuning keywords and metrics.");

  // ---- Grammar suggestions ----
  const grammar: { text: string; severity: "high" | "medium" | "low" }[] = [];
  if (weakCount > 0) grammar.push({ text: `Replace passive phrasing ("responsible for", "worked on") with strong action verbs.`, severity: "medium" });
  if (/\bi\b(?=\s+(?:is|are|was|were|am))/i.test(text) || /\bfirst person\b/i.test(text)) {
    grammar.push({ text: "Resume appears to use first person — write in implied first person (drop 'I', 'my').", severity: "low" });
  }
  if (/\bvery\b|\breally\b|\bkind of\b|\bsort of\b/i.test(text)) grammar.push({ text: "Remove filler words ('very', 'really') — they weaken claims.", severity: "low" });
  const longSentences = text.split(/[.!?]/).filter((s) => s.split(/\s+/).length > 28).length;
  if (longSentences > 0) grammar.push({ text: `${longSentences} long sentence(s) detected — split for readability.`, severity: "low" });
  if (/\betc\.?\b/i.test(text)) grammar.push({ text: "Avoid 'etc.' — it signals an incomplete list.", severity: "low" });
  if (grammar.length === 0) grammar.push({ text: "No major grammar issues detected. Proofread once more for tense consistency.", severity: "low" });

  // ---- Formatting suggestions ----
  const formatting: { text: string; severity: "high" | "medium" | "low" }[] = [];
  if (!contact.hasEmail) formatting.push({ text: "Add a professional email address in the header.", severity: "high" });
  if (!contact.hasPhone) formatting.push({ text: "Include a phone number with country code.", severity: "medium" });
  if (!contact.hasLinkedin) formatting.push({ text: "Add your LinkedIn profile URL near the top.", severity: "medium" });
  if (!sections.skills) formatting.push({ text: "Create a dedicated 'Skills' section for ATS keyword extraction.", severity: "high" });
  if (avgLine > 40) formatting.push({ text: "Use concise bullet points (max ~25 words) instead of paragraphs.", severity: "medium" });
  if (wordCount > 1000) formatting.push({ text: "Trim to 1-2 pages — remove outdated or irrelevant roles.", severity: "medium" });
  if (/\t/.test(text) || / {4,}/.test(text)) formatting.push({ text: "Avoid tabs and multiple spaces for alignment — they break ATS parsers.", severity: "medium" });
  if (formatting.length === 0) formatting.push({ text: "Formatting looks clean. Use a single-column layout and standard fonts.", severity: "low" });

  // ---- Skill scores (radar) ----
  const skillScores = [
    { skill: "Keywords", score: Math.round((foundRoleKeywords.length / roleKeywords.length) * 100) },
    { skill: "Tech Skills", score: Math.min(100, foundTech.length * 12) },
    { skill: "Impact", score: Math.min(100, quantCount * 20) },
    { skill: "Action Lang.", score: Math.min(100, actionCount * 16) },
    { skill: "Structure", score: Math.round((Object.values(sections).filter(Boolean).length / 7) * 100) },
    { skill: "Contact", score: Math.round(((contact.hasEmail ? 1 : 0) + (contact.hasPhone ? 1 : 0) + (contact.hasLinkedin ? 1 : 0)) / 3 * 100) },
  ];

  // ---- Summary ----
  const summary = `This resume targets a ${role.replace(/developer/, "developer")} role. It scores ${qualityScore}/100 overall and ${atsScore}/100 on ATS compatibility. ${
    qualityScore >= 70 ? "It is in good shape" : qualityScore >= 50 ? "It has a solid foundation but needs targeted improvements" : "It needs significant work before applying"
  }. ${quantCount > 0 ? `It includes ${quantCount} quantified achievement(s), which is ${quantCount >= 3 ? "strong" : "a start — add more"}.` : "It lacks quantified achievements — add metrics to every role."} ${
    missingKeywords.length > 0 ? `The biggest ATS gap is missing keywords: ${missingKeywords.slice(0, 4).join(", ")}.` : "Keyword coverage is strong."
  } Focus on action verbs, quantified impact, and closing the keyword gaps to lift both scores.`;

  return {
    resume_score: qualityScore,
    ats_score: atsScore,
    summary,
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    missing_keywords: missingKeywords,
    missing_tech_skills: missingTech,
    missing_soft_skills: missingSoft,
    grammar_suggestions: grammar.slice(0, 6),
    formatting_suggestions: formatting.slice(0, 6),
    skill_scores: skillScores,
    engine: "heuristic",
  };
}

// ---------------------------------------------------------------------------
// AI provider integration (optional). When OPENAI_API_KEY is configured as a
// Supabase secret, we call the LLM and parse its JSON response. Otherwise we
// fall back to the heuristic engine above.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert ATS resume reviewer and career coach. Analyze the resume and return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "resume_score": number 0-100,
  "ats_score": number 0-100,
  "summary": string (2-3 sentences),
  "strengths": string[] (up to 6),
  "weaknesses": string[] (up to 6),
  "missing_keywords": string[],
  "missing_tech_skills": string[],
  "missing_soft_skills": string[],
  "grammar_suggestions": [{"text": string, "severity": "high"|"medium"|"low"}],
  "formatting_suggestions": [{"text": string, "severity": "high"|"medium"|"low"}],
  "skill_scores": [{"skill": string, "score": number 0-100}]
}
Be specific, actionable, and grounded in the resume text.`;

async function aiAnalyze(resumeText: string, targetRole?: string): Promise<HeuristicResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("no key");

  const userPrompt = `Target role: ${targetRole || "infer from resume"}.\n\nResume:\n${resumeText.slice(0, 12000)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = JSON.parse(content);

  // Normalize + fill gaps with heuristic so the UI is always complete.
  const fallback = heuristicAnalyze(resumeText, targetRole);
  return {
    resume_score: Math.max(0, Math.min(100, Math.round(parsed.resume_score ?? fallback.resume_score))),
    ats_score: Math.max(0, Math.min(100, Math.round(parsed.ats_score ?? fallback.ats_score))),
    summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : fallback.strengths,
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 6) : fallback.weaknesses,
    missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords : fallback.missing_keywords,
    missing_tech_skills: Array.isArray(parsed.missing_tech_skills) ? parsed.missing_tech_skills : fallback.missing_tech_skills,
    missing_soft_skills: Array.isArray(parsed.missing_soft_skills) ? parsed.missing_soft_skills : fallback.missing_soft_skills,
    grammar_suggestions: Array.isArray(parsed.grammar_suggestions) ? parsed.grammar_suggestions.slice(0, 8) : fallback.grammar_suggestions,
    formatting_suggestions: Array.isArray(parsed.formatting_suggestions) ? parsed.formatting_suggestions.slice(0, 8) : fallback.formatting_suggestions,
    skill_scores: Array.isArray(parsed.skill_scores) && parsed.skill_scores.length ? parsed.skill_scores : fallback.skill_scores,
    engine: "heuristic", // override below
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { resumeText, targetRole } = (await req.json()) as AnalyzeBody;
    if (!resumeText || resumeText.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Resume text is too short to analyze." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: HeuristicResult;
    let engine: "ai" | "heuristic" = "heuristic";

    if (Deno.env.get("OPENAI_API_KEY")) {
      try {
        result = await aiAnalyze(resumeText, targetRole);
        engine = "ai";
      } catch (e) {
        console.warn("AI analyze failed, using heuristic:", e.message);
        result = heuristicAnalyze(resumeText, targetRole);
      }
    } else {
      result = heuristicAnalyze(resumeText, targetRole);
    }

    return new Response(JSON.stringify({ ...result, engine }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
