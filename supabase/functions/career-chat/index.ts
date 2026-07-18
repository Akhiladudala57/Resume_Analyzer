import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatBody {
  mode: "chat" | "recommendations" | "generate_resume";
  // chat
  message?: string;
  resumeText?: string | null;
  history?: { role: string; content: string }[];
  // recommendations
  analysisSummary?: string;
  categories?: string[];
  targetRole?: string;
  // generate_resume
  details?: ResumeDetails;
}

interface ResumeDetails {
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

interface GeneratedResume {
  contact: { name: string; email: string; phone: string; location: string; linkedin: string; github: string };
  summary: string;
  experience: { company: string; role: string; duration: string; bullets: string[] }[];
  education: { school: string; degree: string; year: string }[];
  skills: string[];
  projects: { name: string; description: string; tech: string[] }[];
  certifications: string[];
}

// ---------------------------------------------------------------------------
// Heuristic recommendation generator — runs when no AI key is configured.
// Produces concrete, resume-grounded suggestions per category.
// ---------------------------------------------------------------------------

function topSkillsFromResume(text: string): string[] {
  const pool = [
    "javascript", "typescript", "python", "java", "react", "node", "aws", "sql",
    "docker", "kubernetes", "go", "rust", "figma", "tableau", "pandas",
  ];
  const t = text.toLowerCase();
  return pool.filter((s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t)).slice(0, 4);
}

function roleFromText(text: string, target?: string): string {
  if (target && target.trim()) return target.trim();
  const t = text.toLowerCase();
  if (/data scientist|machine learning/.test(t)) return "Data Scientist";
  if (/frontend|react/.test(t)) return "Frontend Developer";
  if (/backend|node|api/.test(t)) return "Backend Developer";
  if (/full stack|fullstack/.test(t)) return "Full Stack Developer";
  if (/devops|kubernetes/.test(t)) return "DevOps Engineer";
  if (/ux|designer/.test(t)) return "UX Designer";
  if (/product manager/.test(t)) return "Product Manager";
  return "Software Engineer";
}

interface RecGroup {
  title: string;
  items: { text: string; priority?: string }[];
}

type RecMap = Record<string, RecGroup>;

function heuristicRecommendations(
  resumeText: string,
  analysisSummary: string,
  categories: string[],
  targetRole?: string
): RecMap {
  const role = roleFromText(resumeText, targetRole);
  const skills = topSkillsFromResume(resumeText);
  const hasMetrics = /\d+%|\$\d|\d+ (users|customers|requests)/i.test(resumeText);
  const out: RecMap = {};

  for (const cat of categories) {
    switch (cat) {
      case "resume_improvement":
        out[cat] = {
          title: "Resume Improvement",
          items: [
            { text: `Rewrite 3 experience bullets using the formula: Action verb + task + quantified result (e.g. "Reduced API latency 40% by introducing Redis caching").`, priority: "high" },
            { text: "Add a 2-line professional summary at the top that names your target role and top 2 strengths.", priority: "high" },
            { text: hasMetrics ? "Add 2 more quantified metrics to roles that currently lack numbers." : "Quantify every role — even estimates (e.g. '~50k monthly users') add credibility.", priority: "high" },
            { text: "Move your strongest, most relevant role to the top if it isn't already.", priority: "medium" },
            { text: "Remove any role older than 10 years unless it's at a recognizable company.", priority: "low" },
          ],
        };
        break;
      case "ats_optimization":
        out[cat] = {
          title: "ATS Optimization",
          items: [
            { text: "Mirror the target job description's exact keywords (e.g. 'CI/CD', 'microservices', 'cross-functional') in your skills and experience.", priority: "high" },
            { text: "Use a single-column, standard-font layout — multi-column designs confuse ATS parsers.", priority: "high" },
            { text: "Name section headers conventionally: 'Experience', 'Education', 'Skills'. Avoid creative names like 'My Journey'.", priority: "medium" },
            { text: "Avoid headers/footers, text boxes, and images for critical info — many parsers skip them.", priority: "medium" },
            { text: "Save and submit as PDF or DOCX with a simple filename (First_Last_Resume.pdf).", priority: "low" },
          ],
        };
        break;
      case "skill_recommendations":
        out[cat] = {
          title: "Skill Recommendations",
          items: [
            { text: `For ${role}: add System Design and API versioning to your skill set if absent.`, priority: "high" },
            { text: skills.includes("typescript") ? "Deepen TypeScript — generics, conditional types, and strict mode are common interview topics." : `Learn TypeScript — it's the most-requested skill for modern ${role} roles.`, priority: "high" },
            { text: "Add a testing framework (Jest/Playwright) to your skills if not present — most roles expect it.", priority: "medium" },
            { text: "Pick up observability basics (logging, metrics, dashboards) — increasingly expected mid-level.", priority: "medium" },
            { text: "Strengthen one soft skill: 'stakeholder communication' — demonstrate it in a bullet.", priority: "low" },
          ],
        };
        break;
      case "project_recommendations":
        out[cat] = {
          title: "Project Recommendations",
          items: [
            { text: `Build a ${role}-focused capstone that uses your current stack${skills[0] ? ` (${skills.slice(0, 2).join(", ")})` : ""} and deploys to a free tier (Vercel/Render).`, priority: "high" },
            { text: "Open-source contribution: fix a 'good first issue' on a popular repo in your stack — recruiters value this.", priority: "medium" },
            { text: "Add a project that demonstrates a full loop: data → logic → UI → tests → CI — and write a short README.", priority: "medium" },
            { text: "If targeting data roles, publish a notebook analysis on a public dataset with charts and a writeup.", priority: "medium" },
            { text: "Pin each project on a GitHub profile README with a one-line value statement.", priority: "low" },
          ],
        };
        break;
      case "certification_recommendations":
        out[cat] = {
          title: "Certification Recommendations",
          items: [
            { text: /devops|backend|aws|cloud/i.test(role) ? "AWS Solutions Architect Associate — high signal for cloud roles." : "Consider a cloud fundamentals cert (AWS Cloud Practitioner or Azure AZ-900) to broaden appeal.", priority: "medium" },
            { text: "If you have <2 years experience, a relevant cert (e.g. Meta Front-End, Google Data Analytics) helps pass resume filters.", priority: "medium" },
            { text: "For security-adjacent roles, Security+ is a quick, recognized credential.", priority: "low" },
            { text: "Avoid paid 'bootcamp' certificates with low industry recognition — prefer vendor-backed ones.", priority: "low" },
            { text: "List certs under a dedicated 'Certifications' section with year and issuing body.", priority: "low" },
          ],
        };
        break;
      case "interview_preparation":
        out[cat] = {
          title: "Interview Preparation",
          items: [
            { text: `Prepare 3 STAR stories: one on impact (a metric you moved), one on conflict/collaboration, one on a hard technical problem.`, priority: "high" },
            { text: `For ${role}: expect a system design or case question — practice aloud for 20 min/day for a week.`, priority: "high" },
            { text: "Prepare a crisp 90-second answer to 'Tell me about yourself' anchored on your most recent role.", priority: "medium" },
            { text: "Have 3 thoughtful questions ready (team goals, tech stack decisions, onboarding).", priority: "medium" },
            { text: "Do a mock interview with a peer or platform (pramp, interviewing.io) before the real one.", priority: "low" },
          ],
        };
        break;
      case "career_path":
        out[cat] = {
          title: "Career Path Suggestions",
          items: [
            { text: `From ${role}, a natural next step is Senior ${role} in 1-2 years, then Staff/Lead in 3-5 years.`, priority: "high" },
            { text: "Consider a lateral move into a high-growth domain (AI/ML, platform engineering, data) to compound optionality.", priority: "medium" },
            { text: "If you enjoy cross-functional work, explore Engineering Manager or Tech Lead paths — start by mentoring a junior.", priority: "medium" },
            { text: "Build a 'T-shape': go deep in one area (your current stack) and broad in adjacent ones.", priority: "medium" },
            { text: "Track your impact publicly — a quarterly writeup accelerates networking and recruiter reach.", priority: "low" },
          ],
        };
        break;
      case "job_recommendations":
        out[cat] = {
          title: "Job Recommendations",
          items: [
            { text: `Target mid-size product companies hiring ${role}s — they offer growth with less filtering than FAANG.`, priority: "high" },
            { text: `Search job boards for these keywords combined with your skills: ${skills.join(", ") || role}.`, priority: "medium" },
            { text: "Apply to 5 roles/week where you meet 70%+ of requirements — quality over quantity.", priority: "medium" },
            { text: "Reach out to 2 employees at each target company via LinkedIn for a referral — referrals double callback rates.", priority: "medium" },
            { text: "Set up alerts on LinkedIn, Wellfound, and the company careers pages of your top 10 companies.", priority: "low" },
          ],
        };
        break;
      case "learning_roadmap":
        out[cat] = {
          title: "Learning Roadmap",
          items: [
            { text: "Week 1-2: Close your biggest keyword gap (pick one from the Missing Keywords list) with a focused tutorial + mini project.", priority: "high" },
            { text: "Week 3-4: System design fundamentals — read 'Designing Data-Intensive Applications' and do 2 practice problems.", priority: "high" },
            { text: "Week 5-6: Testing & CI — add tests to an existing project and wire up a GitHub Actions pipeline.", priority: "medium" },
            { text: "Week 7-8: Communication — practice explaining a past project in 3 minutes to a non-technical friend.", priority: "medium" },
            { text: "Ongoing: 1 hour/week reading engineering blogs from companies you admire.", priority: "low" },
          ],
        };
        break;
      case "cover_letter":
        out[cat] = {
          title: "Cover Letter Generator",
          items: [
            { text: `Dear Hiring Manager,\n\nI'm applying for the ${role} role. With my background in ${skills.join(", ") || "software development"}, I'm excited to contribute to your team.`, priority: "high" },
            { text: "In my most recent role I [describe one quantified achievement from your resume]. This experience directly maps to your need for [requirement from the job description].", priority: "high" },
            { text: "What draws me to [Company] is [one specific reason — a product, value, or recent announcement]. I'd bring the same [skill] that drove that outcome.", priority: "medium" },
            { text: "I'd welcome the chance to discuss how I can help [team goal]. Thank you for considering my application.\n\nBest regards,\n[Your Name]", priority: "medium" },
            { text: "Keep it under 250 words. Customize the bracketed parts per application — generic letters get ignored.", priority: "low" },
          ],
        };
        break;
      case "linkedin_optimization":
        out[cat] = {
          title: "LinkedIn Optimization",
          items: [
            { text: `Headline: "${role} | ${skills.slice(0, 3).join(" | ") || "Building scalable software"}" — keywords here are searchable.`, priority: "high" },
            { text: "About: 3 short paragraphs — who you are, your top 2 achievements (with numbers), and what you're looking for.", priority: "high" },
            { text: "Add a professional headshot and a banner — profiles with photos get 21x more views.", priority: "medium" },
            { text: "Rewrite each experience to mirror your resume's best bullets (with metrics).", priority: "medium" },
            { text: "Turn on 'Open to work' (recruiter-only) and list 5 skills — LinkedIn ranks you by skill endorsements.", priority: "low" },
          ],
        };
        break;
      default:
        out[cat] = { title: cat, items: [{ text: analysisSummary, priority: "low" }] };
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Heuristic chat — context-aware career Q&A without an LLM.
// ---------------------------------------------------------------------------

function heuristicChat(message: string, resumeText: string | null): string {
  const m = message.toLowerCase();
  const role = resumeText ? roleFromText(resumeText) : "software engineer";

  if (/^(hi|hello|hey|gm|good (morning|evening))/.test(m)) {
    return `Hi! I'm your AI Career Assistant. I can help with resume feedback, interview prep, skill gaps, career paths, and job search strategy${resumeText ? " — and I can see the resume you've uploaded, so my answers are tailored to it" : ""}. What would you like to work on?`;
  }

  if (/resume.*(score|good|bad|improve)|how is my resume|rate my resume/.test(m)) {
    return resumeText
      ? `Based on your uploaded resume targeting a ${role} role: focus on three things — (1) quantify every achievement with metrics (% , $, users), (2) add the missing keywords flagged in your analysis, and (3) replace passive phrases like "responsible for" with action verbs. Would you like me to suggest specific rewrites for a bullet point?`
      : `Upload your resume in the dashboard first — then I can give you specific, grounded feedback instead of generic advice.`;
  }

  if (/interview/.test(m)) {
    return `For a ${role} interview, expect three rounds typically: (1) a screening call on background and motivation, (2) a technical/case round — practice system design or a take-home aligned to your stack, and (3) a behavioral round using STAR stories. Prepare 3 stories: one on impact, one on collaboration, one on a hard problem. Want me to draft likely questions for your role?`;
  }

  if (/skill|learn|roadmap|what should i (learn|study)/.test(m)) {
    return `For ${role}, the highest-leverage skills to add are: (1) system design & API design, (2) testing and CI/CD, and (3) cloud basics (AWS or Azure). Spend 2 weeks on each with a small project to cement it. Open the "Learning Roadmap" recommendation in your dashboard for a sequenced 8-week plan.`;
  }

  if (/career|path|growth|promot/.test(m)) {
    return `A realistic path from ${role}: Senior ${role} (1-2 yrs) → Staff/Lead (3-5 yrs) → either Engineering Manager or Principal IC. The fastest accelerators are (a) owning a project end-to-end with measurable impact, (b) mentoring, and (c) visibility — write a quarterly internal summary of your work.`;
  }

  if (/job|apply|search|hiring/.test(m)) {
    return `Job search strategy: target mid-size product companies where you meet 70%+ of the requirements, apply to ~5/week, and get 2 referrals per target company via LinkedIn. Referrals roughly double your callback rate. Set alerts on LinkedIn and Wellfound, and tailor your resume's summary per application.`;
  }

  if (/cover letter/.test(m)) {
    return `A strong cover letter is under 250 words and does three things: (1) names the role and one specific reason you're interested in THIS company, (2) maps one quantified achievement to a requirement in the JD, (3) a confident close. Use the "Cover Letter Generator" recommendation in your dashboard for a tailored draft.`;
  }

  if (/linkedin/.test(m)) {
    return `LinkedIn quick wins: rewrite your headline to "${role} | <top 3 skills>", add a 3-paragraph About with metrics, use a professional photo, and turn on "Open to work" (recruiter-only). See the "LinkedIn Optimization" recommendation for a full checklist.`;
  }

  if (/ats|keyword|parse/.test(m)) {
    return `ATS tips: mirror the job description's exact keywords in your skills and experience, use a single-column layout, name sections conventionally ("Experience", "Skills"), and avoid headers/footers for critical info. Submit as PDF or DOCX. Run an analysis in your dashboard to see your ATS score and missing keywords.`;
  }

  if (/thank/.test(m)) {
    return `You're welcome! Feel free to ask about your resume, an interview, or your next career step anytime.`;
  }

  return `I can help with resume feedback, interview prep, skills to learn, career paths, job search, cover letters, and LinkedIn — ${
    resumeText ? `tailored to your uploaded ${role} resume. ` : ""
  }Try asking "How can I improve my resume?" or "What should I learn next?" for specific advice.`;
}

// ---------------------------------------------------------------------------
// AI provider (OpenAI) — used when OPENAI_API_KEY is configured.
// ---------------------------------------------------------------------------

async function aiChat(message: string, resumeText: string | null, history: { role: string; content: string }[]): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("no key");

  const system = `You are an expert, friendly career coach and ATS resume reviewer. Answer concisely (3-6 sentences) with specific, actionable advice.${
    resumeText ? " The user has uploaded a resume; ground your advice in it." : ""
  } If asked something outside career/resume/interview/skills/jobs, politely redirect.`;

  const messages = [
    { role: "system", content: system },
    ...(resumeText ? [{ role: "system", content: `User's resume:\n${resumeText.slice(0, 8000)}` }] : []),
    ...history.slice(-8).map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      messages,
      temperature: 0.5,
      max_tokens: 600,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty AI reply");
  return reply.trim();
}

// ---------------------------------------------------------------------------
// Resume generation — heuristic (no AI key) and AI-powered.
// Produces a structured, ATS-optimized resume from user details and (optional)
// source resume text. Bullet points use action verbs + quantified impact.
// ---------------------------------------------------------------------------

function splitLines(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(/\n|•|\u2022/).map((l) => l.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
}

function splitCsv(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(/[,;]\s*|\n/).map((l) => l.trim()).filter(Boolean);
}

function inferRole(details: ResumeDetails, sourceText?: string | null): string {
  if (details.targetRole && details.targetRole.trim()) return details.targetRole.trim();
  if (sourceText) return roleFromText(sourceText);
  const skills = (details.skills || "").toLowerCase();
  if (/react|frontend|css/.test(skills)) return "Frontend Developer";
  if (/node|backend|api|sql/.test(skills)) return "Backend Developer";
  if (/python|machine learning|pandas/.test(skills)) return "Data Scientist";
  if (/figma|ux|design/.test(skills)) return "UX Designer";
  return "Software Engineer";
}

const STRONG_BULLET_TEMPLATES = [
  (role: string, company: string) => `Led development of core ${role.toLowerCase()} features at ${company}, delivering improvements measured by user engagement and system reliability.`,
  () => `Architected and shipped scalable solutions that reduced latency and improved performance across key services.`,
  () => `Collaborated cross-functionally with product and design teams to translate requirements into shipped features.`,
  () => `Mentored junior engineers and drove code-quality initiatives through reviews and documentation.`,
];

function heuristicGenerate(details: ResumeDetails, sourceText?: string | null): GeneratedResume {
  const role = inferRole(details, sourceText);

  // Summary
  const summary =
    details.summary?.trim() ||
    (sourceText
      ? `${details.fullName || "Results-driven"} ${role} with proven impact building and shipping production software. Skilled at turning requirements into reliable, well-tested features and collaborating across teams to move key metrics.`
      : `${details.fullName || "Results-driven"} ${role} passionate about building reliable, well-tested software. Adept at translating requirements into shipped features and collaborating cross-functionally to deliver measurable impact.`);

  // Experience
  const experience = (details.experience || []).map((exp, i) => {
    const company = exp.company || "Company";
    const title = exp.role || role;
    const duration = [exp.start, exp.end].filter(Boolean).join(" – ") || "20XX – Present";
    let bullets = splitLines(exp.bullets);
    if (bullets.length === 0) {
      bullets = STRONG_BULLET_TEMPLATES.slice(0, 3).map((t) => t(title, company));
    }
    return { company, role: title, duration, bullets };
  });

  // Education
  const education = (details.education || []).map((ed) => ({
    school: ed.school || "University",
    degree: ed.degree || "Degree",
    year: ed.year || "",
  }));

  // Skills
  let skills = splitCsv(details.skills);
  if (skills.length === 0) {
    skills = sourceText ? topSkillsFromResume(sourceText) : ["JavaScript", "TypeScript", "React", "Node.js", "Git", "Testing (Jest)"];
  }

  // Projects
  const projects = (details.projects || []).map((p) => ({
    name: p.name || "Project",
    description: p.description || "A production application built with modern tooling.",
    tech: splitCsv(p.tech),
  }));

  // Certifications
  const certifications = splitCsv(details.certifications);

  return {
    contact: {
      name: details.fullName || "Your Name",
      email: details.email || "you@example.com",
      phone: details.phone || "",
      location: details.location || "",
      linkedin: details.linkedin || "",
      github: details.github || "",
    },
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
  };
}

async function aiGenerate(details: ResumeDetails, sourceText: string | null): Promise<GeneratedResume> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("no key");

  const system = `You are an expert resume writer. Produce an ATS-optimized resume as JSON with this exact shape:
{ "contact": {"name","email","phone","location","linkedin","github"}, "summary": string, "experience": [{"company","role","duration","bullets": string[]}], "education": [{"school","degree","year"}], "skills": string[], "projects": [{"name","description","tech": string[]}], "certifications": string[] }
Rules: write 3-4 impact-driven bullets per role using action verbs + quantified results (use realistic estimated metrics like "~30%"). Mirror the target role's keywords. Return ONLY JSON.`;

  const userPrompt = `Target role: ${inferRole(details, sourceText)}.\nUser details: ${JSON.stringify(details)}.\n${sourceText ? `Source resume text to improve:\n${sourceText.slice(0, 8000)}` : "No source resume — generate from the details provided."}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  if (!parsed.contact || !parsed.experience) throw new Error("Bad AI resume shape");
  return parsed as GeneratedResume;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ChatBody;
    const useAI = !!Deno.env.get("OPENAI_API_KEY");

    if (body.mode === "recommendations") {
      const cats = body.categories || [];
      let recs: RecMap;
      if (useAI) {
        try {
          recs = await aiRecommend(body.resumeText || "", body.analysisSummary || "", cats, body.targetRole);
        } catch (e) {
          console.warn("AI recs failed:", e.message);
          recs = heuristicRecommendations(body.resumeText || "", body.analysisSummary || "", cats, body.targetRole);
        }
      } else {
        recs = heuristicRecommendations(body.resumeText || "", body.analysisSummary || "", cats, body.targetRole);
      }
      return new Response(JSON.stringify({ recommendations: recs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "generate_resume") {
      const details = body.details || {};
      let resume: GeneratedResume;
      if (useAI) {
        try {
          resume = await aiGenerate(details, body.resumeText || null);
        } catch (e) {
          console.warn("AI generate failed:", e.message);
          resume = heuristicGenerate(details, body.resumeText || null);
        }
      } else {
        resume = heuristicGenerate(details, body.resumeText || null);
      }
      return new Response(JSON.stringify({ resume }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // chat mode
    const message = body.message || "";
    if (!message.trim()) {
      return new Response(JSON.stringify({ error: "Empty message." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let reply: string;
    if (useAI) {
      try {
        reply = await aiChat(message, body.resumeText || null, body.history || []);
      } catch (e) {
        console.warn("AI chat failed:", e.message);
        reply = heuristicChat(message, body.resumeText || null);
      }
    } else {
      reply = heuristicChat(message, body.resumeText || null);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Chat failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function aiRecommend(
  resumeText: string,
  analysisSummary: string,
  categories: string[],
  targetRole?: string
): Promise<RecMap> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("no key");

  const system = `You are an expert career coach. For each requested category, return 4-6 specific, actionable items grounded in the user's resume and analysis. Return ONLY JSON: { "<category>": { "title": string, "items": [{"text": string, "priority": "high"|"medium"|"low"}] } }.`;
  const userPrompt = `Target role: ${targetRole || "infer"}.\nAnalysis summary: ${analysisSummary}\nResume:\n${resumeText.slice(0, 8000)}\n\nCategories: ${categories.join(", ")}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  if (!parsed || typeof parsed !== "object" || Object.keys(parsed).length === 0) throw new Error("Bad AI recs shape");
  return parsed as RecMap;
}
