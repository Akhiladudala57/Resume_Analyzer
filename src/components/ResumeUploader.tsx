import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react';
import { classNames, formatBytes } from '../lib/utils';
import { ACCEPTED_EXTENSIONS, detectType, validateFile } from '../lib/fileExtract';
import { useToast } from '../lib/toast';

interface ResumeUploaderProps {
  onFileSelected: (file: File) => void;
  loading?: boolean;
}

export function ResumeUploader({ onFileSelected, loading }: ResumeUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        toast.error('Invalid file', validationError);
        return;
      }
      const type = detectType(file);
      if (!type) {
        setError('Only PDF and DOCX files are supported.');
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={classNames(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all',
          dragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-ink-200 dark:border-ink-700 hover:border-brand-400 hover:bg-ink-50/50 dark:hover:bg-ink-800/30',
          loading && 'pointer-events-none opacity-70'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <div className={classNames(
          'flex h-14 w-14 items-center justify-center rounded-2xl transition-all',
          dragging ? 'gradient-brand shadow-glow' : 'surface-2'
        )}>
          <UploadCloud className={classNames('h-6 w-6 transition-colors', dragging ? 'text-white' : 'text-brand-500')} />
        </div>
        <p className="text-ink-900 dark:text-white mt-4 font-display text-base font-700">
          {dragging ? 'Drop your resume here' : 'Drag & drop your resume'}
        </p>
        <p className="text-muted mt-1 text-sm">
          or <span className="text-brand-600 dark:text-brand-400 font-medium">browse files</span> · PDF or DOCX · max 5MB
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {selectedFile && !error && (
        <div className="surface mt-3 flex items-center gap-3 rounded-xl p-3 animate-fade-up">
          <div className="surface-2 flex h-10 w-10 items-center justify-center rounded-lg">
            <FileText className="h-5 w-5 text-brand-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-ink-900 dark:text-white truncate text-sm font-semibold">{selectedFile.name}</p>
            <p className="text-muted text-xs">{formatBytes(selectedFile.size)}</p>
          </div>
          {loading ? (
            <span className="text-brand-600 text-xs font-medium">Analyzing…</span>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-accent-500" />
          )}
          {!loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="text-muted hover:text-ink-900 dark:hover:text-white p-1"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
