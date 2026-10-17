import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RiCloseLine,
  RiCodeSSlashLine,
  RiEyeLine,
  RiFileCopyLine,
  RiCheckLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiFolderLine,
  RiFileTextLine,
  RiSparklingLine
} from '@remixicon/react';

export default function SkillFileEditorDrawer({
  isOpen,
  file,
  onClose,
  onChange,
  onDelete
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'preview'
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localPath, setLocalPath] = useState('');
  const [localContent, setLocalContent] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (file) {
      setLocalPath(file.path || file.name || '');
      setLocalContent(file.content || '');
      // If it's a markdown or HTML file, default to code but preview is available
      setActiveTab('code');
    }
  }, [file]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const ext = (localPath.split('.').pop() || '').toLowerCase();
  const isMarkdown = ext === 'md' || ext === 'markdown';
  const isHtml = ext === 'html' || ext === 'htm';
  const canPreview = isMarkdown || isHtml;

  const handleContentChange = (newContent) => {
    setLocalContent(newContent);
    onChange({
      ...file,
      path: localPath,
      name: localPath.split('/').pop() || localPath,
      content: newContent,
      size: newContent.length
    });
  };

  const handlePathChange = (newPath) => {
    setLocalPath(newPath);
    onChange({
      ...file,
      path: newPath,
      name: newPath.split('/').pop() || newPath,
      content: localContent,
      size: localContent.length
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([localContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = localPath.split('/').pop() || 'skill_file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = localContent.split('\n').length;
  const charCount = localContent.length;

  const drawerContent = (
    <div className="skill-file-editor-portal">
      {/* Backdrop for overlay */}
      <div
        className="fixed inset-0 z-[10005] bg-zinc-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Panel / Fullscreen Modal */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Editing ${localPath}`}
        className={`fixed z-[10010] flex flex-col bg-white dark:bg-zinc-950 shadow-2xl transition-all duration-300 ease-out ${
          fullscreen
            ? 'inset-0 w-screen h-[100dvh] border-0'
            : 'inset-y-0 right-0 w-full sm:w-[580px] md:w-[680px] lg:w-[760px] xl:w-[820px] border-l border-zinc-200/90 dark:border-white/10'
        }`}
      >
        {/* Panel Header */}
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 bg-zinc-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              {localPath.includes('/') ? <RiFolderLine size={16} /> : <RiFileTextLine size={16} />}
            </span>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={localPath}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="folder/filename.ext"
                title="Edit file path or name"
                className="w-full text-xs sm:text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent outline-none focus:ring-1 focus:ring-cyan-500/50 rounded px-1.5 py-0.5"
              />
              <p className="text-[10px] text-zinc-400 px-1.5 truncate">
                {isMarkdown ? 'Markdown Document' : isHtml ? 'HTML Template' : 'Code / Rule File'} · {Math.round(charCount / 1024)} KB
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Code vs Preview Tabs */}
            {canPreview && (
              <div className="flex items-center rounded-full bg-zinc-100 dark:bg-white/[0.06] p-0.5 mr-1 border border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                    activeTab === 'code'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <RiCodeSSlashLine size={13} /> Code
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <RiEyeLine size={13} /> Preview
                </button>
              </div>
            )}

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy code"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
            >
              {copied ? <RiCheckLine size={15} className="text-emerald-500" /> : <RiFileCopyLine size={15} />}
            </button>

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download file"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
            >
              <RiDownloadLine size={15} />
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
            >
              {fullscreen ? <RiFullscreenExitLine size={15} className="text-cyan-500" /> : <RiFullscreenLine size={15} />}
            </button>

            {/* Delete file button */}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="Delete this file"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <RiDeleteBinLine size={15} />
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              title="Close panel"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition cursor-pointer ml-1"
            >
              <RiCloseLine size={18} />
            </button>
          </div>
        </header>

        {/* Panel Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col p-4 sm:p-6">
          {activeTab === 'preview' && canPreview ? (
            <div className="flex-1 rounded-[20px] border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-zinc-900/60 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
              {isMarkdown ? (
                <article className="prose prose-zinc dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {localContent || '*Empty markdown document*'}
                  </ReactMarkdown>
                </article>
              ) : isHtml ? (
                <iframe
                  title="HTML Preview"
                  sandbox="allow-scripts"
                  srcDoc={localContent}
                  className="w-full h-full min-h-[450px] rounded-[12px] bg-white border border-zinc-200"
                />
              ) : null}
            </div>
          ) : (
            <div className="flex-1 flex flex-col rounded-[20px] border border-zinc-200/90 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/70 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <RiSparklingLine size={13} className="text-cyan-500" />
                  Live Code Editor
                </span>
                <span>Press Tab for 2-space indentation</span>
              </div>

              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    const val = e.target.value;
                    const nextVal = val.substring(0, start) + '  ' + val.substring(end);
                    handleContentChange(nextVal);
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                      }
                    }, 0);
                  }
                }}
                placeholder="Write or edit code, markdown conventions, or rules here..."
                className="flex-1 w-full min-h-[350px] font-mono text-[12px] sm:text-[13px] leading-relaxed bg-transparent text-zinc-900 dark:text-zinc-100 outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <footer className="flex items-center justify-between border-t border-zinc-200/80 dark:border-white/[0.08] px-4 sm:px-6 py-3 bg-zinc-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>{lineCount} lines</span>
            <span>·</span>
            <span>{charCount} characters</span>
            <span>·</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">Auto-synced with skill</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent-cyan)] text-zinc-950 text-xs font-semibold shadow-xs hover:brightness-105 transition cursor-pointer"
          >
            <RiCheckLine size={14} /> Done Editing
          </button>
        </footer>
      </aside>
    </div>
  );

  return mounted && typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}
