'use client';

import { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { generateCurl, generateFetch, generatePython, CodeGenInput } from '../lib/code-gen';

interface CodeSnippetBoxProps {
  request: CodeGenInput;
  title?: string;
}

export function CodeSnippetBox({ request, title = 'Gerador de Código' }: CodeSnippetBoxProps) {
  const [lang, setLang] = useState<'curl' | 'fetch' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const snippet =
    lang === 'curl'
      ? generateCurl(request)
      : lang === 'fetch'
      ? generateFetch(request)
      : generatePython(request);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-black/50 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] bg-black/40">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-zinc-300">{title}</span>
          <div className="flex items-center gap-1 ml-2">
            {(
              [
                { id: 'curl', label: 'cURL' },
                { id: 'fetch', label: 'JS fetch' },
                { id: 'python', label: 'Python' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLang(tab.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                  lang === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center gap-1 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
        {snippet}
      </pre>
    </div>
  );
}
