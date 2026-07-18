import { jsPDF } from 'jspdf';
import type { Analysis, Resume, GeneratedResumeData } from './types';
import { formatDate } from './utils';

export function downloadAnalysisReport(analysis: Analysis, resume: Resume | null, userName: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(29, 102, 245);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ResumeAI — Analysis Report', margin, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated ${formatDate(analysis.created_at)} for ${userName || 'Candidate'}`, margin, 58);
  if (resume) doc.text(`Resume: ${resume.file_name}`, margin, 72);

  y = 110;
  doc.setTextColor(30, 36, 48);

  // Scores
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Scores', margin, y);
  y += 8;
  doc.setDrawColor(230, 233, 239);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  doc.setFontSize(11);
  const scoreRow = (label: string, score: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${score}/100`, margin + 120, y);
    const barW = contentW - 180;
    doc.setFillColor(240, 242, 245);
    doc.roundedRect(margin + 160, y - 8, barW, 10, 2, 2, 'F');
    const fill = score >= 80 ? [16, 209, 120] : score >= 60 ? [29, 102, 245] : score >= 40 ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(margin + 160, y - 8, (barW * score) / 100, 10, 2, 2, 'F');
    y += 22;
  };
  scoreRow('Resume Score', analysis.resume_score);
  scoreRow('ATS Compatibility', analysis.ats_score);
  y += 6;

  // Summary
  sectionTitle(doc, 'Summary', margin, y); y += 20;
  y = paragraphs(doc, analysis.summary, margin, y, contentW, 11);
  y += 8;

  // Strengths / Weaknesses
  y = listSection(doc, 'Strengths', analysis.strengths, margin, y, contentW, ensureSpace);
  y = listSection(doc, 'Weaknesses', analysis.weaknesses, margin, y, contentW, ensureSpace);

  // Missing items
  y = chipSection(doc, 'Missing Keywords', analysis.missing_keywords, margin, y, contentW, ensureSpace);
  y = chipSection(doc, 'Missing Technical Skills', analysis.missing_tech_skills, margin, y, contentW, ensureSpace);
  y = chipSection(doc, 'Missing Soft Skills', analysis.missing_soft_skills, margin, y, contentW, ensureSpace);

  // Suggestions
  y = suggestionSection(doc, 'Grammar Suggestions', analysis.grammar_suggestions, margin, y, contentW, ensureSpace);
  y = suggestionSection(doc, 'Formatting Suggestions', analysis.formatting_suggestions, margin, y, contentW, ensureSpace);

  // Skill scores
  sectionTitle(doc, 'Skill Breakdown', margin, y); y += 20;
  analysis.skill_scores.forEach((s) => {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(s.skill, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${s.score}/100`, margin + 140, y);
    y += 16;
  });
  y += 8;

  // Recommendations
  const recs = analysis.recommendations || {};
  const recKeys = Object.keys(recs);
  if (recKeys.length > 0) {
    ensureSpace(30);
    sectionTitle(doc, 'Recommendations', margin, y); y += 20;
    recKeys.forEach((key) => {
      const group = recs[key as keyof typeof recs];
      if (!group) return;
      ensureSpace(24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.setTextColor(29, 102, 245);
      doc.text(group.title || key, margin, y);
      doc.setTextColor(30, 36, 48);
      y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      group.items?.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item.text}`, contentW - 12);
        lines.forEach((line: string) => {
          ensureSpace(14);
          doc.text(line, margin + 8, y);
          y += 13;
        });
        y += 2;
      });
      y += 6;
    });
  }

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`ResumeAI · Page ${i} of ${pageCount}`, pageW / 2, pageH - 20, { align: 'center' });
  }

  const fname = resume ? resume.file_name.replace(/\.[^.]+$/, '') : 'resume';
  doc.save(`ResumeAI_Report_${fname}.pdf`);
}

// ---- helpers ----
function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 36, 48);
  doc.text(title, x, y);
  doc.setDrawColor(230, 233, 239);
  doc.line(x, y + 6, doc.internal.pageSize.getWidth() - x, y + 6);
}

function paragraphs(doc: jsPDF, text: string, x: number, y: number, w: number, size: number): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(60, 70, 90);
  const lines = doc.splitTextToSize(text, w);
  lines.forEach((line: string) => {
    if (y > doc.internal.pageSize.getHeight() - 48) {
      doc.addPage();
      y = 48;
    }
    doc.text(line, x, y);
    y += size + 4;
  });
  return y;
}

function listSection(doc: jsPDF, title: string, items: string[], x: number, y: number, w: number, ensure: (h: number) => void): number {
  sectionTitle(doc, title, x, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 70, 90);
  items.forEach((item) => {
    const lines = doc.splitTextToSize(`•  ${item}`, w - 12);
    lines.forEach((line: string) => {
      ensure(14);
      doc.text(line, x + 6, y);
      y += 13;
    });
    y += 3;
  });
  return y + 6;
}

function chipSection(doc: jsPDF, title: string, items: string[], x: number, y: number, w: number, ensure: (h: number) => void): number {
  sectionTitle(doc, title, x, y);
  y += 20;
  if (items.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('None detected.', x, y);
    return y + 16;
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(60, 70, 90);
  let cx = x;
  items.forEach((item) => {
    const tw = doc.getTextWidth(item) + 16;
    if (cx + tw > x + w) {
      cx = x;
      y += 22;
      ensure(22);
    }
    doc.setDrawColor(220, 224, 230);
    doc.setFillColor(242, 244, 248);
    doc.roundedRect(cx, y - 10, tw, 16, 3, 3, 'FD');
    doc.text(item, cx + 8, y + 1);
    cx += tw + 6;
  });
  return y + 22;
}

function suggestionSection(
  doc: jsPDF, title: string, suggestions: { text: string; severity: string }[],
  x: number, y: number, w: number, ensure: (h: number) => void
): number {
  sectionTitle(doc, title, x, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 70, 90);
  suggestions.forEach((s) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(s.severity === 'high' ? 220 : s.severity === 'medium' ? 217 : 100, s.severity === 'high' ? 38 : s.severity === 'medium' ? 119 : 116, s.severity === 'high' ? 38 : s.severity === 'medium' ? 6 : 139);
    doc.text(`[${s.severity.toUpperCase()}]`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 70, 90);
    const lines = doc.splitTextToSize(s.text, w - 60);
    lines.forEach((line: string, i: number) => {
      ensure(14);
      doc.text(line, x + 60, y + i * 13);
    });
    y += lines.length * 13 + 6;
  });
  return y + 6;
}

export function downloadGeneratedResume(data: GeneratedResumeData, title: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;
  const ensure = (h: number) => {
    if (y + h > pageH - margin) { doc.addPage(); y = margin; }
  };

  // Name header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.setTextColor(30, 36, 48);
  doc.text(data.contact.name || 'Your Name', margin, y);
  y += 6;
  doc.setDrawColor(29, 102, 245); doc.setLineWidth(2);
  doc.line(margin, y, margin + 60, y);
  y += 18;

  // Contact line
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(90, 100, 116);
  const contactParts = [data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin, data.contact.github].filter(Boolean);
  const contactLine = contactParts.join('  |  ');
  const contactLines = doc.splitTextToSize(contactLine, contentW);
  contactLines.forEach((l: string) => { ensure(12); doc.text(l, margin, y); y += 12; });
  y += 10;

  const sectionTitle = (title: string) => {
    ensure(28);
    y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.setTextColor(29, 102, 245);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(225, 230, 238); doc.setLineWidth(0.5);
    doc.line(margin, y + 4, pageW - margin, y + 4);
    doc.setTextColor(30, 36, 48);
    y += 18;
  };

  // Summary
  if (data.summary) {
    sectionTitle('Professional Summary');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(60, 70, 90);
    const lines = doc.splitTextToSize(data.summary, contentW);
    lines.forEach((l: string) => { ensure(13); doc.text(l, margin, y); y += 13; });
    y += 4;
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    sectionTitle('Experience');
    data.experience.forEach((exp) => {
      ensure(24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
      doc.text(exp.role || '', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(exp.company || '', pageW - margin, y, { align: 'right' });
      y += 13;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
      doc.setTextColor(120, 130, 145);
      doc.text(exp.duration || '', margin, y);
      doc.setTextColor(30, 36, 48);
      y += 14;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(60, 70, 90);
      (exp.bullets || []).forEach((b) => {
        const blines = doc.splitTextToSize(`•  ${b}`, contentW - 14);
        blines.forEach((l: string) => { ensure(13); doc.text(l, margin + 6, y); y += 13; });
        y += 1;
      });
      y += 6;
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    sectionTitle('Education');
    data.education.forEach((ed) => {
      ensure(18);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(ed.degree || '', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(ed.year || '', pageW - margin, y, { align: 'right' });
      y += 13;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
      doc.setTextColor(120, 130, 145);
      doc.text(ed.school || '', margin, y);
      doc.setTextColor(30, 36, 48);
      y += 12;
    });
    y += 4;
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    sectionTitle('Skills');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(60, 70, 90);
    const skillLines = doc.splitTextToSize(data.skills.join('  •  '), contentW);
    skillLines.forEach((l: string) => { ensure(13); doc.text(l, margin, y); y += 13; });
    y += 4;
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    sectionTitle('Projects');
    data.projects.forEach((p) => {
      ensure(20);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(p.name || '', margin, y);
      y += 13;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(60, 70, 90);
      const dlines = doc.splitTextToSize(p.description || '', contentW);
      dlines.forEach((l: string) => { ensure(13); doc.text(l, margin, y); y += 13; });
      if (p.tech && p.tech.length > 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
        doc.setTextColor(120, 130, 145);
        const tlines = doc.splitTextToSize(`Tech: ${p.tech.join(', ')}`, contentW);
        tlines.forEach((l: string) => { ensure(12); doc.text(l, margin, y); y += 12; });
        doc.setTextColor(30, 36, 48);
      }
      y += 6;
    });
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    sectionTitle('Certifications');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(60, 70, 90);
    data.certifications.forEach((c) => {
      const clines = doc.splitTextToSize(`•  ${c}`, contentW - 14);
      clines.forEach((l: string) => { ensure(13); doc.text(l, margin + 6, y); y += 13; });
    });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i} / ${pageCount}`, pageW / 2, pageH - 20, { align: 'center' });
  }

  doc.save(`${title.replace(/[^a-z0-9]+/gi, '_')}_Resume.pdf`);
}
