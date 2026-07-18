import mammoth from 'mammoth';

// pdfjs-dist is imported dynamically so the worker wiring only loads when needed.
let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      // Use the bundled worker via Vite's ?url import so it is served from origin.
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return pdfjsLibPromise;
}

export interface ExtractedFile {
  text: string;
  type: 'pdf' | 'docx';
  size: number;
  name: string;
}

export const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB).`;
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  const okType = ACCEPTED_TYPES.includes(file.type);
  const okExt = ACCEPTED_EXTENSIONS.includes(ext);
  if (!okType && !okExt) return 'Only PDF and DOCX files are supported.';
  return null;
}

export function detectType(file: File): 'pdf' | 'docx' | null {
  const ext = file.name.toLowerCase().match(/\.([^.]+)$/)?.[1] ?? '';
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  if (ext === 'docx' || file.type.includes('wordprocessing')) return 'docx';
  return null;
}

export async function extractFromFile(file: File): Promise<ExtractedFile> {
  const err = validateFile(file);
  if (err) throw new Error(err);
  const type = detectType(file);
  if (!type) throw new Error('Unsupported file type.');

  let text = '';
  if (type === 'pdf') {
    const pdfjs = await getPdfjs();
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it) => ('str' in it ? (it as { str: string }).str : ''))
        .join(' ');
      parts.push(pageText);
    }
    text = parts.join('\n').replace(/\s+\n/g, '\n').trim();
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value.trim();
  }

  if (!text || text.length < 20) {
    throw new Error('Could not extract meaningful text. The file may be a scanned image or empty.');
  }
  return { text, type, size: file.size, name: file.name };
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
