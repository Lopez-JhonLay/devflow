import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Clock3, FileText, Loader2, TriangleAlert } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { useUpdateProjectDocumentation } from '@/hooks/use-projects';

type MarkdownEditorProps = {
  projectId: string;
  initialContent: string;
  variant?: 'card' | 'plain';
};

const EMPTY_DOCUMENTATION = `# Project Notes

Write setup steps, architecture notes, API decisions, or deployment reminders here.

\`\`\`ts
function helloDevFlow() {
  return 'Document as you build.';
}
\`\`\`
`;

export function MarkdownEditor({ projectId, initialContent, variant = 'card' }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const hasUserEditedRef = useRef(false);
  const lastSaveAttemptRef = useRef(initialContent);
  const debouncedContent = useDebounce(content, 1500);
  const {
    mutate: saveDocumentation,
    isPending: isSaving,
    isError: hasSaveError,
    reset: resetSaveStatus,
  } = useUpdateProjectDocumentation(projectId);
  const hasUnsavedChanges = content !== lastSavedContent;

  useEffect(() => {
    if (
      !hasUserEditedRef.current ||
      isSaving ||
      debouncedContent === lastSavedContent ||
      debouncedContent === lastSaveAttemptRef.current
    ) {
      return;
    }

    lastSaveAttemptRef.current = debouncedContent;
    saveDocumentation(debouncedContent, {
      onSuccess: (documentation) => {
        setLastSavedContent(documentation.content);
      },
    });
  }, [debouncedContent, isSaving, lastSavedContent, saveDocumentation]);

  const saveStatus = useMemo(() => {
    if (isSaving) {
      return { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: 'Saving...' };
    }

    if (hasSaveError) {
      return { icon: <TriangleAlert className="h-4 w-4" />, label: 'Save failed' };
    }

    if (hasUnsavedChanges) {
      return { icon: <Clock3 className="h-4 w-4" />, label: 'Unsaved changes' };
    }

    return { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Saved' };
  }, [hasSaveError, hasUnsavedChanges, isSaving]);

  const contentNode = (
    <>
      <div className={variant === 'card' ? 'border-b border-border p-5' : 'pb-5'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Editor</h3>
            <p className="mt-1 text-sm text-muted-foreground">Markdown notes autosave after 1.5 seconds of inactivity.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {saveStatus.icon}
            {saveStatus.label}
          </div>
        </div>
      </div>
      <div className={variant === 'card' ? 'p-5' : ''}>
        <div className="grid min-h-130 grid-cols-1 overflow-hidden rounded-[28px] border border-border lg:grid-cols-2">
          <div className="flex min-h-105 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex h-11 items-center gap-2 border-b border-border bg-muted/40 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <FileText className="h-4 w-4" />
              Editor
            </div>
            <textarea
              value={content}
              spellCheck={false}
              className="min-h-105 flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 text-card-foreground outline-none placeholder:text-muted-foreground"
              placeholder={EMPTY_DOCUMENTATION}
              onChange={(event) => {
                hasUserEditedRef.current = true;
                if (hasSaveError) {
                  resetSaveStatus();
                }
                setContent(event.target.value);
              }}
            />
          </div>

          <div className="flex min-h-105 flex-col">
            <div className="flex h-11 items-center gap-2 border-b border-border bg-muted/40 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Preview
            </div>
            <div className="markdown-preview min-h-105 flex-1 overflow-y-auto bg-card p-5 text-card-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {content || '_Start typing to preview your documentation._'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (variant === 'plain') {
    return contentNode;
  }

  return (
    <Card className="border border-border shadow-sm">
      {contentNode}
    </Card>
  );
}
