import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSelector } from 'react-redux';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const SyntaxTheme = {
  'code[class*="language-"]': { color: 'var(--text-main)', background: 'transparent' },
  'token.comment': { color: 'var(--text-dim)' },
  'token.keyword': { color: 'var(--cyan-main)', fontWeight: 'bold' },
  'token.string': { color: 'var(--sky-main)' },
  'token.number': { color: 'var(--cyan-main)' },
  'token.function': { color: 'var(--sky-main)' },
  'token.operator': { color: 'var(--cyan-main)' },
  'token.punctuation': { color: 'var(--text-dim)' },
};

const MarkdownRenderer = ({ content }) => {
  const theme = useSelector((s) => s.chat.theme);
  
  return (
    <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="border-2 border-black bg-black/10 my-4 overflow-hidden rounded">
                <div className="bg-black/20 px-3 py-1 border-b-2 border-black flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>{match[1]} output</span>
                </div>
                <SyntaxHighlighter
                  style={SyntaxTheme}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ background: 'transparent', padding: '1rem', margin: 0, fontSize: '0.8rem' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-black/20 text-[var(--cyan-main)] px-1 px-0.5 rounded font-bold" {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-3 text-[var(--text-main)] leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="text-[var(--cyan-main)] font-black">{children}</strong>,
          a: ({ children, href }) => <a href={href} target="_blank" className="text-[var(--cyan-main)] underline font-bold px-1">{children}</a>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

