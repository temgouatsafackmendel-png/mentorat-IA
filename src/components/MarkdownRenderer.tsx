import React, { useState } from 'react';
import {
  Check,
  Copy,
  HelpCircle,
  CornerDownRight,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onReplyToQuestion?: (questionText: string) => void;
  onRequestHint?: () => void;
  onExplainCode?: (codeSnippet: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onReplyToQuestion,
  onRequestHint,
  onExplainCode,
}) => {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(index);
    setTimeout(() => setCopiedBlock(null), 1800);
  };

  const segments = content.split(/(```[\s\S]*?```)/g);

  const renderInlineFormatting = (text: string) => {
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code
            key={idx}
            className="font-mono text-[13px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-300 border border-slate-200/60 dark:border-slate-700/60"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return (
          <strong
            key={idx}
            className="font-semibold text-slate-900 dark:text-white"
          >
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return (
          <em key={idx} className="italic text-slate-800 dark:text-slate-200">
            {token.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={idx}>{token}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-4 text-[15px] leading-[1.75] text-slate-700 dark:text-slate-300">
      {segments.map((segment, segIdx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const lines = segment.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : 'code';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={segIdx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden my-4 shadow-2xs"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 text-xs text-slate-400 font-mono">
                <span className="uppercase tracking-wider text-[11px] text-slate-400">
                  {lang}
                </span>
                <div className="flex items-center gap-3">
                  {onExplainCode && (
                    <button
                      type="button"
                      onClick={() => onExplainCode(codeBody)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Analyser ligne par ligne</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeBody, segIdx)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedBlock === segIdx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="p-4 text-[13px] leading-relaxed font-mono text-slate-100 overflow-x-auto">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        const blocks = segment.trim().split(/\n\n+/);
        return (
          <React.Fragment key={segIdx}>
            {blocks.map((block, bIdx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;

              if (trimmed === '---') {
                return (
                  <hr
                    key={bIdx}
                    className="border-slate-200/80 dark:border-slate-800/80 my-4"
                  />
                );
              }

              // Signature Socratic Question Callout (> ...)
              if (trimmed.startsWith('>')) {
                const quoteLines = trimmed
                  .split('\n')
                  .map((l) => l.replace(/^>\s?/, ''));
                const plainQuestion = quoteLines
                  .join(' ')
                  .replace(/\*\*Question Socratique\s*:\*\*/i, '')
                  .trim();

                return (
                  <div
                    key={bIdx}
                    className="rounded-2xl border border-indigo-200/90 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/25 p-4 sm:p-5 text-slate-900 dark:text-slate-100 my-3 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1.5 text-[15px] leading-relaxed">
                        {quoteLines.map((ql, qIdx) => (
                          <p key={qIdx}>{renderInlineFormatting(ql)}</p>
                        ))}
                      </div>
                    </div>

                    {/* Contextual Fitts's Law Actions Directly Inside the Socratic Callout */}
                    {(onReplyToQuestion || onRequestHint) && (
                      <div className="flex flex-wrap items-center gap-2 pl-10 pt-1">
                        {onReplyToQuestion && (
                          <button
                            type="button"
                            onClick={() => onReplyToQuestion(plainQuestion)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>Formuler mon hypothèse</span>
                          </button>
                        )}
                        {onRequestHint && (
                          <button
                            type="button"
                            onClick={onRequestHint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>Débloquer un indice</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={bIdx}
                    className="font-display text-base font-semibold text-slate-900 dark:text-white pt-1"
                  >
                    {renderInlineFormatting(trimmed.replace(/^###\s+/, ''))}
                  </h4>
                );
              }

              const lines = trimmed.split('\n');
              const isList = lines.every(
                (l) => /^(-|\*|\d+\.)\s+/.test(l.trim())
              );
              if (isList) {
                return (
                  <ul key={bIdx} className="space-y-1.5 pl-4">
                    {lines.map((line, lIdx) => {
                      const cleanLine = line
                        .trim()
                        .replace(/^(-|\*|\d+\.)\s+/, '');
                      return (
                        <li
                          key={lIdx}
                          className="text-slate-700 dark:text-slate-300 list-disc marker:text-indigo-500 pl-1"
                        >
                          {renderInlineFormatting(cleanLine)}
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              return (
                <p key={bIdx} className="leading-[1.75]">
                  {renderInlineFormatting(trimmed)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
