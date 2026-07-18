import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Trash2, Bot, User, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/Feedback';
import { useToast } from '../lib/toast';
import { getChatMessages, saveChatMessage, clearChat, askAssistant, getResumes } from '../lib/data';
import type { ChatMessage, Resume } from '../lib/types';
import { classNames, relativeTime } from '../lib/utils';

const SUGGESTIONS = [
  'How can I improve my resume?',
  'What skills should I learn next?',
  'How do I prepare for an interview?',
  'What career path fits me?',
];

export function ChatPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [contextResumeId, setContextResumeId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void init();
  }, []);

  const init = async () => {
    try {
      const [msgs, rs] = await Promise.all([getChatMessages(), getResumes()]);
      setMessages(msgs);
      setResumes(rs);
      if (rs.length > 0) setContextResumeId(rs[0].id);
    } catch (e) {
      toast.error('Could not load chat', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput('');
    try {
      const userMsg = await saveChatMessage('user', trimmed, contextResumeId);
      setMessages((p) => [...p, userMsg]);
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const contextResume = resumes.find((r) => r.id === contextResumeId) || null;
      const reply = await askAssistant(trimmed, contextResume?.content_text || null, history);
      const assistantMsg = await saveChatMessage('assistant', reply, contextResumeId);
      setMessages((p) => [...p, assistantMsg]);
    } catch (e) {
      toast.error('Chat failed', (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const clear = async () => {
    try {
      await clearChat();
      setMessages([]);
      toast.success('Conversation cleared');
    } catch (e) {
      toast.error('Could not clear', (e as Error).message);
    }
  };

  const contextResume = resumes.find((r) => r.id === contextResumeId) || null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-800 text-ink-900 dark:text-white">AI Career Assistant</h1>
            <p className="text-muted text-xs">Answers grounded in your resume</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Context selector */}
      {resumes.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <FileText className="text-muted h-4 w-4 shrink-0" />
          <select
            value={contextResumeId || ''}
            onChange={(e) => setContextResumeId(e.target.value || null)}
            className="surface-2 text-ink-900 dark:text-white rounded-lg border px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
          >
            <option value="">No resume context</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>{r.file_name}</option>
            ))}
          </select>
          {contextResume && <span className="text-muted text-xs">· {contextResume.file_name}</span>}
        </div>
      )}

      {/* Messages */}
      <Card className="mt-4 flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center"><Spinner size={28} /></div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <EmptyState
                icon={Bot}
                title="Ask me anything about your career"
                description="I can help with your resume, interview prep, skills, job search, and more."
              />
              <div className="mt-5 grid w-full max-w-md gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="surface-2 hover:border-brand-400 text-ink-700 dark:text-ink-200 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all hover:-translate-y-0.5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          {sending && (
            <div className="flex items-start gap-2.5">
              <div className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="surface-2 rounded-2xl rounded-tl-sm px-4 py-3">
                <Spinner size={16} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-ink-200 dark:border-ink-700 border-t p-3 sm:p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about your resume, an interview, or your next career step…"
              rows={1}
              className="surface-2 text-ink-900 dark:text-white placeholder:text-muted max-h-32 flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
            <Button type="submit" loading={sending} className="shrink-0">
              {!sending && <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-muted mt-2 text-center text-[10px]">
            Advice is AI-generated and grounded in your resume. Verify before relying on it.
          </p>
        </div>
      </Card>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={classNames('flex items-start gap-2.5 animate-fade-up', isUser && 'flex-row-reverse')}>
      <div className={classNames(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        isUser ? 'surface-2' : 'gradient-brand'
      )}>
        {isUser ? <User className="text-ink-600 dark:text-ink-300 h-4 w-4" /> : <Bot className="h-4 w-4 text-white" />}
      </div>
      <div className={classNames('max-w-[80%] sm:max-w-[75%]')}>
        <div className={classNames(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line',
          isUser
            ? 'gradient-brand text-white rounded-tr-sm'
            : 'surface-2 text-ink-800 dark:text-ink-100 rounded-tl-sm'
        )}>
          {message.content}
        </div>
        <p className={classNames('text-muted mt-1 text-[10px]', isUser ? 'text-right' : 'text-left')}>
          {relativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
