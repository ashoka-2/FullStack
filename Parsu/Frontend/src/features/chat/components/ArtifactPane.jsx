import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RiCodeSSlashLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiFilePdfLine,
  RiFileTextLine,
  RiFullscreenExitLine,
  RiFullscreenLine,
  RiCloseLine,
  RiEyeLine,
  RiImageLine,
  RiMore2Line,
  RiPrinterLine,
  RiEditLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiSaveLine,
  RiCheckLine,
} from '@remixicon/react';
import { updateMessageCode } from '../service/chat.api';

const MIME_BY_KIND = {
  html: 'text/html;charset=utf-8',
  markdown: 'text/markdown;charset=utf-8',
  code: 'text/plain;charset=utf-8',
};

const ArtifactPane = ({ artifact, mode, onModeChange, fullscreen, onFullscreenChange, width = 660, onResize, onClose }) => {
  const frameRef = useRef(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const markdownRef = useRef(null);
  const resizeStart = useRef(null);
  const [loadedContent, setLoadedContent] = useState('');
  const [imageUnavailable, setImageUnavailable] = useState(false);

  const kind = artifact?.kind || 'html';
  const image = artifact?.image || {};
  const imageUrl = artifact?.url || image.url || image.thumbnail || '';
  const initialContent = artifact?.content || loadedContent || '';

  // Storage key for local drafts and persistent session saves
  const artifactKey = useMemo(() => {
    return artifact?.messageId 
      ? `msg_${artifact.messageId}` 
      : (artifact?.id || artifact?._id || artifact?.name || 'artifact_preview');
  }, [artifact?.messageId, artifact?.id, artifact?._id, artifact?.name]);

  const draftKey = `parsu_artifact_draft_${artifactKey}`;
  const savedKey = `parsu_artifact_saved_${artifactKey}`;

  // Current editable content (source of truth for preview output and code view)
  const [currentCode, setCurrentCode] = useState(() => {
    try {
      const stored = sessionStorage.getItem(draftKey) || localStorage.getItem(draftKey);
      if (stored !== null && stored !== undefined && stored.length > 0) return stored;
    } catch {}
    return initialContent;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [autoSaved, setAutoSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  // Undo / Redo history references
  const historyRef = useRef([currentCode]);
  const historyIndexRef = useRef(0);
  const isNavigatingHistory = useRef(false);
  const debounceTimerRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);
  const preRef = useRef(null);


  // Load external markdown file if artifact has a remote url
  useEffect(() => {
    if (!artifact?.url || artifact.kind !== 'markdown' || artifact.content) {
      setLoadedContent('');
      return undefined;
    }
    const controller = new AbortController();
    fetch(artifact.url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Unable to load this Markdown file.');
        return response.text();
      })
      .then(setLoadedContent)
      .catch(error => { if (error.name !== 'AbortError') setLoadedContent('Unable to load this Markdown file.'); });
    return () => controller.abort();
  }, [artifact?.url, artifact?.kind, artifact?.content]);

  useEffect(() => setImageUnavailable(false), [imageUrl]);

  // Sync currentCode when artifact content or draft changes
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(draftKey) || localStorage.getItem(draftKey);
      if (stored !== null && stored !== undefined && stored.length > 0) {
        setCurrentCode(stored);
        historyRef.current = [stored];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        return;
      }
    } catch {}
    if (initialContent) {
      setCurrentCode(initialContent);
      historyRef.current = [initialContent];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [draftKey, initialContent]);

  if (!artifact) return null;

  const label = artifact.name || ({ html: 'Generated HTML', markdown: 'Markdown document', pdf: 'PDF document', code: 'Generated code' }[kind] || 'Generated file');
  const canSwitch = kind === 'html' || kind === 'markdown' || kind === 'code';
  const canDownload = Boolean(imageUrl || currentCode);

  const resizeMax = () => {
    const panelRowWidth = document.querySelector('.chat-shell > div')?.clientWidth;
    return Math.max(320, Math.floor((panelRowWidth || window.innerWidth) * 0.58));
  };

  const beginResize = event => {
    if (window.innerWidth < 1024 || !onResize) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resizeStart.current = { x: event.clientX, width };
  };
  const moveResize = event => {
    if (!resizeStart.current) return;
    const minWidth = 320;
    const maxWidth = resizeMax();
    const nextWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.current.width + resizeStart.current.x - event.clientX));
    onResize(nextWidth);
  };
  const stopResize = () => { resizeStart.current = null; };

  // Local auto-save
  const persistToLocal = (newText) => {
    try {
      sessionStorage.setItem(draftKey, newText);
      localStorage.setItem(draftKey, newText);
      setAutoSaved(true);
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  };

  // Push snapshot to undo stack
  const pushHistory = (newText) => {
    if (isNavigatingHistory.current) return;
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (history[history.length - 1] === newText) return;
    history.push(newText);
    if (history.length > 80) history.shift();
    historyRef.current = history;
    historyIndexRef.current = history.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  // User typing in code editor
  const handleCodeChange = (e) => {
    const nextVal = e.target.value;
    setCurrentCode(nextVal);
    setAutoSaved(false);
    persistToLocal(nextVal);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      pushHistory(nextVal);
    }, 350);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      isNavigatingHistory.current = true;
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      setCurrentCode(prev);
      persistToLocal(prev);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      setTimeout(() => { isNavigatingHistory.current = false; }, 40);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isNavigatingHistory.current = true;
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      setCurrentCode(next);
      persistToLocal(next);
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      setTimeout(() => { isNavigatingHistory.current = false; }, 40);
    }
  };

  // Save Code button: Persist to DB if message exists, else to session storage
  const handleSaveCode = async () => {
    setIsSaving(true);
    let savedInDb = false;

    if (artifact?.messageId) {
      try {
        const res = await updateMessageCode(artifact.messageId, currentCode, artifact.language || kind);
        if (res?.success) {
          savedInDb = true;
        }
      } catch (err) {
        console.warn("DB update failed, will persist in session storage:", err);
      }
    }

    // Always store in session and local storage
    try {
      sessionStorage.setItem(savedKey, currentCode);
      sessionStorage.setItem(draftKey, currentCode);
      localStorage.setItem(savedKey, currentCode);
    } catch {}

    // Dispatch event so active chat message updates reactively
    window.dispatchEvent(new CustomEvent('parsu:artifact-saved', {
      detail: {
        messageId: artifact.messageId,
        name: artifact.name,
        code: currentCode
      }
    }));

    setIsSaving(false);
    setSaveFeedback(savedInDb ? 'Saved to database' : 'Saved to session storage');
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  // Keyboard shortcuts inside editor
  const handleKeyDown = (e) => {
    // Tab key indentation (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const updated = val.substring(0, start) + '  ' + val.substring(end);
      setCurrentCode(updated);
      persistToLocal(updated);
      pushHistory(updated);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
      return;
    }

    // Ctrl+Z or Cmd+Z -> Undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z -> Redo
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Ctrl+S or Cmd+S -> Save Code
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSaveCode();
      return;
    }
  };

  // Synchronize scroll between line numbers and editor / pre viewer
  const handleEditorScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Allow scrolling from the line numbers gutter directly
  const handleGutterWheel = (e) => {
    const target = isEditing ? textareaRef.current : preRef.current;
    if (target) {
      target.scrollTop += e.deltaY;
    }
  };

  const codeLines = useMemo(() => {
    return (currentCode || '').split('\n');
  }, [currentCode]);

  const download = () => {
    const fileUrl = kind === 'image' ? imageUrl : artifact.url;
    if (fileUrl && !currentCode) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = label || 'generated-file';
      if (!fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:')) link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      return;
    }
    const mimeType = MIME_BY_KIND[kind] || 'text/plain;charset=utf-8';
    const url = URL.createObjectURL(new Blob([currentCode], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = label;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async () => {
    const copyValue = currentCode || imageUrl;
    if (copyValue) await navigator.clipboard.writeText(copyValue);
  };

  const makePdf = () => {
    if (kind === 'pdf' && frameRef.current?.contentWindow) {
      frameRef.current.contentWindow.focus();
      frameRef.current.contentWindow.print();
      return;
    }
    if (kind !== 'markdown' || !markdownRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.opener = null;
    const title = label.replace(/\.md$/i, '.pdf').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font:15px/1.65 system-ui,sans-serif;color:#171717;max-width:760px;margin:48px auto;padding:0 28px}h1,h2,h3{line-height:1.2;margin:1.5em 0 .6em}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f4f5;padding:16px;border-radius:12px}blockquote{border-left:3px solid #777;padding-left:16px;color:#555}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}img{max-width:100%}@page{margin:18mm}</style></head><body>${markdownRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 300);
  };

  const isSvg = /<svg\b[\s\S]*<\/svg>/i.test(currentCode);

  const panel = (
    <aside data-lenis-prevent="true" style={{ '--artifact-pane-width': `${width}px` }} className={`artifact-pane ${fullscreen ? 'artifact-pane-fullscreen fixed inset-0 z-[10010]' : 'absolute inset-0 z-50'} flex min-w-0 flex-col`} aria-label={`${label} viewer`}>
      {!fullscreen && <div
        className="artifact-resize-handle"
        role="separator"
        aria-label="Resize preview panel"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={320}
        aria-valuemax={resizeMax()}
        tabIndex={0}
        onPointerDown={beginResize}
        onPointerMove={moveResize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); onResize?.(Math.min(resizeMax(), width + 24)); }
          if (event.key === 'ArrowRight') { event.preventDefault(); onResize?.(Math.max(320, width - 24)); }
        }}
      />}

      {/* Main Drawer Header */}
      <header className="artifact-header flex min-h-14 shrink-0 items-center justify-between gap-3 px-4 border-b border-[var(--border)]">
        <div className="flex min-w-0 items-center gap-2">
          {kind === 'pdf' ? <RiFilePdfLine size={17} aria-hidden="true" /> : kind === 'markdown' ? <RiFileTextLine size={17} aria-hidden="true" /> : kind === 'image' ? <RiImageLine size={17} aria-hidden="true" /> : <RiCodeSSlashLine size={17} aria-hidden="true" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{label}</p>
            {kind === 'pdf' && <p className="text-xs text-[var(--text-secondary)]">PDF document</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 relative">
          {/* View Toggle Tabs: Code vs Live Output Preview */}
          {canSwitch && (
            <div role="tablist" aria-label="Artifact view" className="inline-flex rounded-full p-0.5 bg-[var(--surface-2)] border border-[var(--border)]">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'code'}
                onClick={() => onModeChange('code')}
                title="View Code"
                className={`p-1.5 rounded-full transition-all cursor-pointer ${mode === 'code' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs' : 'text-zinc-400 hover:text-[var(--fg)]'}`}
              >
                <RiCodeSSlashLine size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'preview'}
                onClick={() => {
                  onModeChange('preview');
                  setIsEditing(false);
                }}
                title="Live Output Preview"
                className={`p-1.5 rounded-full transition-all cursor-pointer ${mode === 'preview' ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs' : 'text-zinc-400 hover:text-[var(--fg)]'}`}
              >
                <RiEyeLine size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Preview buttons (desktop) — Note: strictly NO edit button in preview buttons */}
          <div className="hidden sm:flex items-center gap-1">
            {(currentCode || imageUrl) && (
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-zinc-400 hover:text-[var(--fg)] transition-colors cursor-pointer"
                onClick={copy}
                title={kind === 'image' ? 'Copy image URL' : 'Copy content'}
                aria-label={kind === 'image' ? 'Copy image URL' : 'Copy content'}
              >
                <RiFileCopyLine size={16} />
              </button>
            )}
            {(kind === 'markdown' || kind === 'pdf') && (
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-zinc-400 hover:text-[var(--fg)] transition-colors cursor-pointer"
                onClick={makePdf}
                title={kind === 'pdf' ? 'Print PDF' : 'Print or save as PDF'}
                aria-label="Print or save as PDF"
              >
                <RiPrinterLine size={16} />
              </button>
            )}
            {canDownload && (
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-zinc-400 hover:text-[var(--fg)] transition-colors cursor-pointer"
                onClick={download}
                title={`Download ${kind}`}
                aria-label={`Download ${kind}`}
              >
                <RiDownloadLine size={16} />
              </button>
            )}
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-zinc-400 hover:text-[var(--fg)] transition-colors cursor-pointer"
              onClick={() => onFullscreenChange(!fullscreen)}
              title={fullscreen ? 'Exit full screen' : 'Full screen'}
              aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {fullscreen ? <RiFullscreenExitLine size={16} /> : <RiFullscreenLine size={16} />}
            </button>
          </div>

          {/* Mobile responsive overflow menu */}
          <div className="sm:hidden relative">
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-zinc-400 hover:text-[var(--fg)] transition-colors cursor-pointer"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              title="More options"
              aria-label="More options"
            >
              <RiMore2Line size={17} />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-[20px] bg-[var(--surface)] border border-[var(--border)] p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                {(currentCode || imageUrl) && (
                  <button
                    type="button"
                    onClick={() => { copy(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[12px] hover:bg-[var(--surface-2)] text-[var(--fg)] transition-colors text-left"
                  >
                    <RiFileCopyLine size={15} className="text-[var(--accent)]" />
                    <span>Copy Content</span>
                  </button>
                )}
                {(kind === 'markdown' || kind === 'pdf') && (
                  <button
                    type="button"
                    onClick={() => { makePdf(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[12px] hover:bg-[var(--surface-2)] text-[var(--fg)] transition-colors text-left"
                  >
                    <RiPrinterLine size={15} className="text-[var(--accent)]" />
                    <span>Print / Save PDF</span>
                  </button>
                )}
                {canDownload && (
                  <button
                    type="button"
                    onClick={() => { download(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[12px] hover:bg-[var(--surface-2)] text-[var(--fg)] transition-colors text-left"
                  >
                    <RiDownloadLine size={15} className="text-[var(--accent)]" />
                    <span>Download</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { onFullscreenChange(!fullscreen); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-[12px] hover:bg-[var(--surface-2)] text-[var(--fg)] transition-colors text-left"
                >
                  {fullscreen ? <RiFullscreenExitLine size={15} className="text-[var(--accent)]" /> : <RiFullscreenLine size={15} className="text-[var(--accent)]" />}
                  <span>{fullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-zinc-400 hover:text-[var(--danger)] transition-colors cursor-pointer"
            onClick={onClose}
            title="Close viewer"
            aria-label="Close viewer"
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      </header>

      {/* Pane Content Stage */}
      {kind === 'image' && imageUrl ? (
        <div className="artifact-scroll-region artifact-image-view">
          <div className="artifact-image-stage">
            {imageUnavailable ? <p role="status" className="artifact-image-unavailable">This image is no longer available.</p> : <img
              src={imageUrl}
              alt={image.alt || image.title || artifact.title || label}
              onError={event => {
                if (image.thumbnail && !event.currentTarget.dataset.fallbackApplied) {
                  event.currentTarget.dataset.fallbackApplied = 'true';
                  event.currentTarget.src = image.thumbnail;
                }
                else setImageUnavailable(true);
              }}
            />}
          </div>
          <div className="artifact-image-details">
            <h2>{image.title || artifact.title || label}</h2>
            {(image.details || image.prompt || artifact.details) && <p>{image.details || image.prompt || artifact.details}</p>}
            {(image.source || artifact.source) && <span>Source: {image.source || artifact.source}</span>}
            {(image.contextUrl || artifact.contextUrl) && <a href={image.contextUrl || artifact.contextUrl} target="_blank" rel="noopener noreferrer">Open source</a>}
          </div>
        </div>
      ) : kind === 'pdf' && artifact.url ? (
        <iframe ref={frameRef} title={label} src={artifact.url} className="artifact-scroll-region artifact-pdf-frame w-full h-full border-0" />
      ) : mode === 'preview' ? (
        /* ─── LIVE OUTPUT VIEW (instantly reflects edited currentCode and scrolls with mouse) ─── */
        kind === 'html' ? (
          <div data-lenis-prevent="true" className="artifact-scroll-region artifact-html-wrapper w-full h-full flex-1 min-h-0 overflow-auto overscroll-contain">
            <iframe 
              ref={frameRef} 
              title={`${label} live output`} 
              sandbox="allow-scripts allow-modals allow-same-origin" 
              srcDoc={currentCode} 
              className="w-full h-full border-0 block bg-white" 
              style={{ minHeight: '100%', width: '100%' }}
            />
          </div>
        ) : kind === 'markdown' ? (
          <div data-lenis-prevent="true" className="artifact-scroll-region artifact-markdown prose prose-sm dark:prose-invert max-w-none p-5 sm:p-7 overflow-y-auto overflow-x-auto h-full flex-1 min-h-0 custom-scrollbar overscroll-contain">
            <div ref={markdownRef}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCode}</ReactMarkdown>
            </div>
          </div>
        ) : isSvg ? (
          <div 
            data-lenis-prevent="true"
            className="artifact-scroll-region flex items-center justify-center p-6 h-full w-full bg-zinc-950/20 overflow-auto flex-1 min-h-0 custom-scrollbar overscroll-contain" 
            dangerouslySetInnerHTML={{ __html: currentCode }} 
          />
        ) : (
          <div data-lenis-prevent="true" className="artifact-scroll-region p-6 overflow-auto h-full flex flex-col items-center justify-center text-center">
            <p className="text-xs text-zinc-400 mb-3">Live preview is active. Switch to Code to view or edit the source.</p>
            <button
              type="button"
              onClick={() => onModeChange('code')}
              className="px-4 py-2 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--accent)] border border-[var(--border)] transition-colors cursor-pointer"
            >
              Open in Code View
            </button>
          </div>
        )
      ) : (
        /* ─── CODE VIEW (with Edit, Undo, Redo, Auto-save & Save Code at Top Right) ─── */
        <div data-lenis-prevent="true" className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)]">
          {/* Code Subheader Toolbar — edit options strictly placed at top right */}
          <div className="flex shrink-0 items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-[var(--surface-1)] border-b border-[var(--border)] select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">{artifact?.language || kind || 'code'}</span>
              <span className="text-[11px] text-zinc-400 font-mono">({codeLines.length} lines)</span>
              {currentCode !== initialContent && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Edited</span>
              )}
            </div>

            {/* Top-Right Code Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {saveFeedback ? (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <RiCheckLine size={13} /> {saveFeedback}
                </span>
              ) : isEditing ? (
                <span className="text-[10px] text-zinc-400 hidden sm:flex items-center gap-1 mr-1">
                  <RiCheckLine size={12} className="text-emerald-400/90" /> Auto-saved
                </span>
              ) : null}

              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    aria-label="Undo"
                    className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <RiArrowGoBackLine size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                    aria-label="Redo"
                    className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <RiArrowGoForwardLine size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCode}
                    disabled={isSaving}
                    className="px-3 py-1 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Save code to database or session storage (Ctrl+S)"
                  >
                    <RiSaveLine size={13} />
                    <span>{isSaving ? 'Saving...' : 'Save Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  {currentCode !== initialContent && (
                    <button
                      type="button"
                      onClick={handleSaveCode}
                      disabled={isSaving}
                      className="px-2.5 py-1 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                      title="Save changes to database or session storage"
                    >
                      <RiSaveLine size={13} />
                      <span>Save Code</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    className="px-3 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-zinc-200 hover:text-[var(--accent)] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-[var(--border)]"
                    title="Edit code (enables Undo, Redo, and live typing)"
                  >
                    <RiEditLine size={13} />
                    <span>Edit</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Code Editor or View Stage (scrolls with mouse) */}
          <div data-lenis-prevent="true" className="flex-1 min-h-0 relative flex overflow-hidden w-full h-full">
            {/* Line Numbers Gutter */}
            <div 
              ref={lineNumbersRef}
              onWheel={handleGutterWheel}
              className="py-3 px-2 sm:px-3 text-right text-zinc-500 font-mono text-[11px] sm:text-xs select-none bg-[var(--surface-1)] border-r border-[var(--border)] leading-[1.65rem] shrink-0 font-medium overflow-hidden pointer-events-auto cursor-default"
              aria-hidden="true"
            >
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editor Textarea or Read-Only Code View */}
            {isEditing ? (
              <textarea
                ref={textareaRef}
                data-lenis-prevent="true"
                value={currentCode}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onScroll={handleEditorScroll}
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                placeholder="Type or paste code here..."
                className="flex-1 p-3 font-mono text-[11px] sm:text-xs leading-[1.65rem] bg-transparent text-zinc-100 resize-none outline-none focus:outline-none w-full h-full whitespace-pre overflow-auto custom-scrollbar font-medium overscroll-contain"
              />
            ) : (
              <pre 
                ref={preRef}
                data-lenis-prevent="true"
                onScroll={handleEditorScroll}
                className="flex-1 p-3 font-mono text-[11px] sm:text-xs leading-[1.65rem] bg-transparent text-zinc-100 overflow-auto custom-scrollbar font-medium whitespace-pre cursor-text select-text h-full overscroll-contain"
                onDoubleClick={() => setIsEditing(true)}
              >
                <code>{currentCode}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </aside>
  );

  return fullscreen ? createPortal(panel, document.body) : panel;
};

export default ArtifactPane;
