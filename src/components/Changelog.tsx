import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal, ScrollText, CheckCircle2 } from 'lucide-react';
import { useAdminTheme } from '../store/useAdminTheme';

// Import the raw markdown content using Vite's ?raw suffix
import changelogContent from '../../CHANGELOG.md?raw';

export default function Changelog() {
  const { theme } = useAdminTheme();
  const isDark = theme.dark;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
          <ScrollText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: theme.colors.ink }}>Notes de Mise à Jour</h2>
          <p className="text-sm mt-1" style={{ color: theme.colors.muted }}>
            Suivi des versions et de l'évolution de la plateforme EduForge.
          </p>
        </div>
      </div>

      <div 
        className="rounded-3xl p-6 sm:p-10 shadow-sm border" 
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* We use a custom wrapper to style the markdown cleanly using Tailwind typography patterns */}
        <div 
          className={`markdown-body prose prose-sm sm:prose-base max-w-none 
          ${isDark ? 'prose-invert prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-blue-400' 
                   : 'prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-blue-600'}`}
        >
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-black mb-6 pb-4 border-b border-slate-200 dark:border-slate-800" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-8 mb-3" {...props} />,
              ul: ({node, ...props}) => <ul className="space-y-2 mt-2 mb-6 list-none pl-0" {...props} />,
              li: ({node, children, ...props}) => (
                <li className="flex items-start gap-2.5" {...props}>
                  <CheckCircle2 className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                  <span>{children}</span>
                </li>
              ),
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />
            }}
          >
            {changelogContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
