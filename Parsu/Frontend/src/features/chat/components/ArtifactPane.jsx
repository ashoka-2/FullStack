import React, { useEffect, useRef, useState } from 'react';
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
} from '@remixicon/react';

const MIME_BY_KIND = {
  html: 'text/html;charset=utf-8',
  markdown: 'text/markdown;charset=utf-8',
  code: 'text/plain;charset=utf-8',
};

const ArtifactPane = ({ artifact, mode, onModeChange, fullscreen, onFullscreenChange, width = 660, onResize, onClose }) => {
  const frameRef = useRef(null);
  const markdownRef = useRef(null);
  const resizeStart = useRef(null);
  const [loadedContent, setLoadedContent] = useState('');
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const kind = artifact?.kind || 'html';
  const image = artifact?.image || {};
  const imageUrl = artifact?.url || image.url || image.thumbnail || '';
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
  if (!artifact) return null;

  const label = artifact.name || ({ html: 'Generated HTML', markdown: 'Markdown document', pdf: 'PDF document', code: 'Generated code' }[kind] || 'Generated file');
  const content = artifact.content || loadedContent || '';
  const canSwitch = kind === 'html' || kind === 'markdown' || kind === 'code';
  const canDownload = Boolean(imageUrl || content);
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

  const download = () => {
    const fileUrl = kind === 'image' ? imageUrl : artifact.url;
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = label || 'generated-file';
      if (!fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:')) link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      return;
    }
    const mimeType = MIME_BY_KIND[kind] || 'text/plain;charset=utf-8';
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = label;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async () => {
    const copyValue = content || imageUrl;
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

  const panel = (
    <aside style={{ '--artifact-pane-width': `${width}px` }} className={`artifact-pane ${fullscreen ? 'artifact-pane-fullscreen fixed inset-0 z-[10010]' : 'absolute inset-0 z-50'} flex min-w-0 flex-col`} aria-label={`${label} viewer`}>
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
      <header className="artifact-header flex min-h-14 shrink-0 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {kind === 'pdf' ? <RiFilePdfLine size={17} aria-hidden="true" /> : kind === 'markdown' ? <RiFileTextLine size={17} aria-hidden="true" /> : kind === 'image' ? <RiImageLine size={17} aria-hidden="true" /> : <RiCodeSSlashLine size={17} aria-hidden="true" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{label}</p>
            {kind === 'pdf' && <p className="text-xs text-[var(--text-secondary)]">PDF document</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canSwitch && <div role="tablist" aria-label="Artifact view" className="artifact-view-toggle inline-flex rounded-full p-1">
            <button type="button" role="tab" aria-selected={mode === 'code'} onClick={() => onModeChange('code')} className={`artifact-tab ${mode === 'code' ? 'is-selected' : ''}`}><RiCodeSSlashLine size={14} aria-hidden="true" /><span>Code</span></button>
            <button type="button" role="tab" aria-selected={mode === 'preview'} onClick={() => onModeChange('preview')} className={`artifact-tab ${mode === 'preview' ? 'is-selected' : ''}`}><RiEyeLine size={14} aria-hidden="true" /><span>Preview</span></button>
          </div>}
          {(content || imageUrl) && <button type="button" className="artifact-icon-button" onClick={copy} title={kind === 'image' ? 'Copy image URL' : 'Copy content'} aria-label={kind === 'image' ? 'Copy image URL' : 'Copy content'}><RiFileCopyLine size={17} /></button>}
          {kind === 'markdown' && <button type="button" className="artifact-icon-button" onClick={makePdf} title="Print or save as PDF" aria-label="Print or save as PDF"><RiFilePdfLine size={17} /></button>}
          {kind === 'pdf' && <button type="button" className="artifact-icon-button" onClick={makePdf} title="Print PDF" aria-label="Print PDF"><RiFilePdfLine size={17} /></button>}
          {canDownload && <button type="button" className="artifact-icon-button" onClick={download} title={`Download ${kind}`} aria-label={`Download ${kind}`}><RiDownloadLine size={17} /></button>}
          <button type="button" className="artifact-icon-button" onClick={() => onFullscreenChange(!fullscreen)} title={fullscreen ? 'Exit full screen' : 'Full screen'} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? <RiFullscreenExitLine size={17} /> : <RiFullscreenLine size={17} />}</button>
          <button type="button" className="artifact-icon-button" onClick={onClose} title="Close viewer" aria-label="Close viewer"><RiCloseLine size={18} /></button>
        </div>
      </header>
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
        <iframe ref={frameRef} title={label} src={artifact.url} className="artifact-scroll-region artifact-pdf-frame" />
      ) : kind === 'html' && mode === 'preview' ? (
        <iframe ref={frameRef} title={`${label} preview`} sandbox="allow-scripts" srcDoc={content} className="artifact-scroll-region artifact-html-frame" />
      ) : kind === 'markdown' && mode === 'preview' ? (
        <div className="artifact-scroll-region artifact-markdown prose prose-sm dark:prose-invert max-w-none">
          <div ref={markdownRef}><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>
        </div>
      ) : (
      <pre className="artifact-scroll-region artifact-code"><code>{content}</code></pre>
      )}
    </aside>
  );

  return fullscreen ? createPortal(panel, document.body) : panel;
};

export default ArtifactPane;
