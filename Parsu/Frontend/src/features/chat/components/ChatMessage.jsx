import React, { useState, useEffect, useRef } from 'react';
import { 
  RiFileCopyLine, 
  RiRefreshLine, 
  RiThumbUpLine, 
  RiThumbUpFill,
  RiThumbDownLine,
  RiThumbDownFill,
  RiVolumeUpLine,
  RiVolumeUpFill,
  RiVolumeMuteLine,
  RiCheckLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiPinterestLine,
  RiTiktokLine,
  RiYoutubeLine,
  RiImageLine,
  RiVideoLine,
  RiFilePdfLine,
  RiShareLine,
  RiCloseLine,
  RiSparklingLine,
  RiMagicLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiAlertLine,
  RiGlobalLine,
  RiCompass3Line,
  RiDownloadLine,
    RiEyeLine,
    RiFileTextLine
} from '@remixicon/react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { publishMedia, generateCaption } from '../../auth/service/social.api';
import { sendFeedback } from '../service/chat.api';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import { EmbeddedMapCard } from './EmbeddedMapCard';
import { ImageGalleryBlock } from './ImageGalleryBlock';
import ImageGenerationBlock from './ImageGenerationBlock';
import { ProductCardsBlock } from './ProductCardsBlock';
import GUIDES from '../../guide/guides.registry';
import { useGuideEngine } from '../../guide/useGuideEngine';

const CodeBlock = React.memo(({ code, language, messageId, chatId, ...props }) => {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [docked, setDocked] = useState(null);
    const [localCode, setLocalCode] = useState(code);
    const blockRef = useRef(null);

    useEffect(() => {
        setLocalCode(code);
    }, [code]);

    // Reactively update code display if user edited and saved it in the artifact preview drawer
    useEffect(() => {
        const handleArtifactSaved = (e) => {
            if (e.detail?.messageId && e.detail.messageId === messageId && typeof e.detail.code === 'string') {
                setLocalCode(e.detail.code);
            }
        };
        window.addEventListener('parsu:artifact-saved', handleArtifactSaved);
        return () => window.removeEventListener('parsu:artifact-saved', handleArtifactSaved);
    }, [messageId]);

    const activeCode = localCode ?? code;
    const safeCode = typeof activeCode === 'string' ? activeCode : String(activeCode || '');
    const lines = safeCode.split('\n');
    const totalLines = lines.length;
    const isHtmlDocument = /html/i.test(language || '') || (/<(!DOCTYPE\s+html|html|head|body|div\s+id=)/i.test(safeCode) && /<\/(html|body|div)>/i.test(safeCode));
    const isSvgDocument = /svg/i.test(language || '') || (/<svg\b[\s\S]*<\/svg>/i.test(safeCode));
    const isMarkdownDocument = /^(md|markdown)$/i.test(language || '');
    const hasVisualPreview = isHtmlDocument || isMarkdownDocument || isSvgDocument;

    // For code blocks with more than 16 lines, collapse by default with zero vertical scroll trap
    const COLLAPSED_LIMIT = 16;
    const isLarge = totalLines > COLLAPSED_LIMIT;
    const displayedCode = isLarge && !isExpanded ? lines.slice(0, COLLAPSED_LIMIT).join('\n') : safeCode;


    const handleCopy = () => {
        // Always copy the 100% complete code
        navigator.clipboard.writeText(safeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const extension = isHtmlDocument ? 'html' : isMarkdownDocument ? 'md' : isSvgDocument ? 'svg' : (language || 'txt').toLowerCase().replace(/[^a-z0-9]/g, '') || 'txt';
        const mimeType = isHtmlDocument ? 'text/html' : isMarkdownDocument ? 'text/markdown' : isSvgDocument ? 'image/svg+xml' : 'text/plain';
        const url = URL.createObjectURL(new Blob([safeCode], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `parsu-code.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePreview = () => {
        const kind = isHtmlDocument ? 'html' : isMarkdownDocument ? 'markdown' : 'code';
        const defaultName = isHtmlDocument ? 'generated-page.html' : isMarkdownDocument ? 'document.md' : isSvgDocument ? 'graphic.svg' : `file.${(language || 'code').toLowerCase()}`;
        window.dispatchEvent(new CustomEvent('parsu:open-artifact', { detail: {
            kind,
            content: safeCode,
            name: defaultName,
            language: language || (isHtmlDocument ? 'html' : isMarkdownDocument ? 'markdown' : 'code'),
            messageId,
            chatId,
            mode: hasVisualPreview ? 'preview' : 'code',
        } }));
    };


    useEffect(() => {
        const block = blockRef.current;
        const scroller = block?.closest('[data-lenis-prevent]');
        if (!block || !scroller) return;
        const updateDock = () => {
            const blockRect = block.getBoundingClientRect();
            const scrollRect = scroller.getBoundingClientRect();
            const toolbarHeight = 44;
            const visible = blockRect.top < scrollRect.top && blockRect.bottom > scrollRect.top + toolbarHeight;
            setDocked(visible ? { top: scrollRect.top, left: blockRect.left, width: blockRect.width } : null);
        };
        updateDock();
        scroller.addEventListener('scroll', updateDock, { passive: true });
        window.addEventListener('resize', updateDock);
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateDock) : null;
        observer?.observe(block);
        return () => {
            scroller.removeEventListener('scroll', updateDock);
            window.removeEventListener('resize', updateDock);
            observer?.disconnect();
        };
    }, [safeCode]);

    const codeToolbar = (
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#1e1e24] border-b border-zinc-800 text-zinc-200 rounded-t-[20px] select-none">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">{language || 'code'}</span>
                <span className="text-[10px] text-zinc-400 font-mono">({totalLines} lines)</span>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={handlePreview}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-[var(--accent)] transition-colors text-xs font-medium cursor-pointer"
                    title={hasVisualPreview ? (isMarkdownDocument ? 'Preview Markdown' : 'Preview Live Output') : 'Open in Code Drawer'}
                >
                    {isMarkdownDocument ? <RiFileTextLine size={13} /> : hasVisualPreview ? <RiEyeLine size={13} /> : <RiCodeSSlashLine size={13} />}
                    <span className="hidden sm:inline text-[11px]">{hasVisualPreview ? 'Preview' : 'Open Drawer'}</span>
                </button>
                <button
                    type="button"
                    onClick={handleDownload}
                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Download code"
                >
                    <RiDownloadLine size={14} />
                </button>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer text-xs"
                    title="Copy full code snippet"
                >
                    {copied ? (
                        <>
                            <span className="text-[10px] font-bold text-emerald-400">Copied!</span>
                            <RiCheckLine size={14} className="text-emerald-400" />
                        </>
                    ) : (
                        <RiFileCopyLine size={14} />
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div ref={blockRef} className="relative group my-4 sm:my-6 rounded-[20px] border border-zinc-800 bg-[#121214] text-zinc-100 max-w-full overflow-hidden shadow-md">
            <div className={docked ? 'invisible pointer-events-none' : 'sticky top-0 z-20'}>{codeToolbar}</div>
            {docked && createPortal(<div style={{ top: docked.top, left: docked.left, width: docked.width }} className="fixed z-[80] shadow-xl">{codeToolbar}</div>, document.body)}
            {/* When collapsed (!isExpanded): overflow-y-hidden so mouse wheel scrolls chat naturally */}
            <div className={`relative overflow-x-auto ${isExpanded ? 'overflow-y-auto max-h-[620px] custom-scrollbar' : 'overflow-y-hidden max-h-[380px]'} w-full rounded-b-[20px]`}>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language || 'text'}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '1.25rem',
                        background: 'transparent',
                        fontSize: '12.5px',
                        lineHeight: '1.65',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        borderRadius: '0 0 1.25rem 1.25rem'
                    }}
                    {...props}
                >
                    {displayedCode}
                </SyntaxHighlighter>

                {isLarge && !isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#121214] via-[#121214]/95 to-transparent flex items-end justify-center pb-3 pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => setIsExpanded(true)}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#151515] text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                        >
                            <span>Show all {totalLines} lines</span>
                            <span className="text-[10px] opacity-75 font-mono">(+{totalLines - COLLAPSED_LIMIT} hidden)</span>
                        </button>
                    </div>
                )}
            </div>

            {isLarge && isExpanded && (
                <div className="flex justify-center py-2 px-4 bg-[#121214] border-t border-zinc-800/60">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
                    >
                        <span>Collapse code ({totalLines} lines)</span>
                    </button>
                </div>
            )}
        </div>
    );
});

const SOCIAL_PLATFORMS_LIST = [
    { id: 'instagram', name: 'Instagram', icon: RiInstagramLine, color: '#E1306C' },
    { id: 'facebook', name: 'Facebook', icon: RiFacebookCircleLine, color: '#1877F2' },
    { id: 'twitter', name: 'Twitter / X', icon: RiTwitterXLine, color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: RiLinkedinBoxLine, color: '#0077B5' },
    { id: 'pinterest', name: 'Pinterest', icon: RiPinterestLine, color: '#E60023' },
    { id: 'tiktok', name: 'TikTok', icon: RiTiktokLine, color: '#00f2ea' },
    { id: 'youtube', name: 'YouTube', icon: RiYoutubeLine, color: '#FF0000' }
];

const ActivityTrace = ({ steps = [], prompt = '' }) => {
    const visibleSteps = steps.slice(-5);
    const safePrompt = String(prompt || '').trim();
    return (
        <section className="my-2.5 w-full max-w-2xl rounded-[20px] sm:rounded-[24px] border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/50" role="status" aria-live="polite" aria-label="Assistant activity">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                        <RiSparklingLine size={14} />
                    </span>
                    <span>Assistant Reasoning & Workflows</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Live Trace</span>
            </div>
            {safePrompt && <p className="mt-2 line-clamp-1 break-words text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">“{safePrompt}”</p>}
            {visibleSteps.length > 0 && (
                <ol className="mt-3 flex flex-col gap-2">
                    {visibleSteps.map(step => {
                        const isSkill = step.id === 'skill';
                        return (
                            <li key={step.id} className={`flex items-center gap-2.5 text-[11px] sm:text-xs ${step.status === 'active' ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                {step.status === 'active' ? (
                                    <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin" />
                                ) : (
                                    <RiCheckLine size={14} className="shrink-0 text-[var(--accent-cyan)]" />
                                )}
                                <span className={isSkill ? 'font-semibold text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20' : ''}>
                                    {step.label}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
};

const detectCodeLanguage = (str) => {
    if (typeof str !== 'string') return 'code';
    if (/^\s*(import|const|let|var|function|export|document\.|window\.|console\.)/m.test(str)) return 'javascript';
    if (/^\s*(def |class .*:\s*$|import .*|from .* import |print\()/m.test(str)) return 'python';
    if (/^\s*(<(!DOCTYPE|html|div|span|p|a|script|style)|<\/[a-z]+>)/im.test(str)) return 'html';
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE)\b/im.test(str)) return 'sql';
    if (/^\s*(#include|int main|std::|void )/m.test(str)) return 'cpp';
    if (/^\s*(\{[\s\S]*\}|\[[\s\S]*\])$/.test(str.trim()) && (str.includes('":') || str.includes('",'))) return 'json';
    return 'code';
};

const openArtifact = (detail) => window.dispatchEvent(new CustomEvent('parsu:open-artifact', { detail }));

const isRawCodeBlock = (text) => {
    if (typeof text !== 'string') return false;
    if (text.includes('```')) return false;
    return (
        text.includes('\n') && (
            /^(import|export|const|let|var|function|class|def|public|private|protected|interface|type|return|<[a-zA-Z]+|\/\/|\/\*|#include|package|func|select|from|where)\b/im.test(text) ||
            /[{}();=>\[\]]/.test(text)
        )
    );
};

const isVisualSearchPrompt = (text = '') => {
    const asksForPhotos = /\b(show|see|display|give|send|find|look for)\b.{0,50}\b(images?|photos?|pictures?|pics?)\b|\b(images?|photos?|pictures?|pics?)\s+of\b/i.test(text);
    const asksToGenerate = /\b(create|make|generate|draw|design)\b.{0,40}\b(image|picture|photo|artwork)\b/i.test(text);
    const plansATrip = /\bitinerary\b|\bplaces? to (visit|see)\b|\btravel plan\b|\b(plan|planning).{0,35}\btrip\b|\btrip\b.{0,35}\b(plan|itinerary)\b/i.test(text);
    return (asksForPhotos && !asksToGenerate) || plansATrip;
};

const normalizeVisualAnswer = (text = '', prompt = '', includeGalleries = true) => {
    const tripRequest = /\bitinerary\b|\bplaces? to (visit|see)\b|\btravel plan\b|\b(plan|planning).{0,35}\btrip\b|\btrip\b.{0,35}\b(plan|itinerary)\b/i.test(prompt);
    const cleanQuery = value => String(value || '').replace(/^\s*(?:query|q|search)\s*:\s*/i, '').replace(/[\x5B\x5D`*_]/g, ' ').replace(/\s+/g, ' ').trim();
    let galleries = [];

    if (tripRequest) {
        const destinationMatch = prompt.match(/\bto\s+([^,.?!]+?)(?=\s+(?:for|from|with|on|during|itinerary|trip|travel|route)\b|[,.?!]|$)/i)
            || prompt.match(/\b(?:in|around|near)\s+([^,.?!]+?)(?=\s+(?:for|from|with|on|during|itinerary|trip|travel|route)\b|[,.?!]|$)/i);
        const destination = destinationMatch?.[1]?.replace(/\b(?:places? to (?:visit|see)|itinerary|travel plan|trip|route)\b.*$/i, '').trim() || '';
        const galleryBlocks = [...text.matchAll(/```\s*gallery\b\s*([\s\S]*?)(?:```|$)/gi)].map(match => match[1]);
        const markerQueries = [...text.matchAll(/\[Image:\s*([^\]]{2,140})\]/gi)].map(match => match[1]);
        const declaredQueries = galleryBlocks.flatMap(block => {
            const markers = [...block.matchAll(/\[Image:\s*([^\]]{2,140})\]/gi)].map(match => match[1]);
            return markers.length ? markers : [...block.matchAll(/(?:query|q|search)\s*:\s*([^\n\r]+)/gi)].map(match => match[1]);
        });
        const detailsByName = new Map();
        for (const line of text.split(/\r?\n/)) {
            const match = line.match(/^\s*(?:(?:\d{1,2}[.)])\s*|[-*]\s*)?\*\*([^*]{2,100})\*\*\s*(?:[:—–-]\s*(.*))?$/)
                || line.match(/^\s*(?:\d{1,2}[.)]|[-*])\s+([A-Z][^:—–-]{2,80})\s*[:—–-]\s*(.*)$/);
            if (!match || /^(?:day\s*\d+|itinerary|getting around|where to stay|travel tips?)\b/i.test(match[1])) continue;
            let rawTitle = match[1];
            let rawDetails = match[2] || '';
            if (!rawDetails && rawTitle.includes(':')) {
                const splitAt = rawTitle.indexOf(':');
                rawDetails = rawTitle.slice(splitAt + 1);
                rawTitle = rawTitle.slice(0, splitAt);
            }
            const placeTitle = cleanQuery(rawTitle).replace(/[:—–-]+$/, '').trim();
            detailsByName.set(placeTitle.toLowerCase(), cleanQuery(rawDetails).slice(0, 260));
        }
        const explicit = galleryBlocks.map(block => {
            const read = key => cleanQuery(block.match(new RegExp(`^\\s*${key}\\s*:\\s*(.*)$`, 'im'))?.[1] || '');
            return { query: read('query') || read('q') || read('search'), title: read('title'), details: read('details') };
        });
        const discovered = [...markerQueries, ...declaredQueries].map(cleanQuery).filter(Boolean).map(query => {
            const title = query.split(',')[0].trim();
            return { query, title, details: detailsByName.get(title.toLowerCase()) || '' };
        });
        const all = [...explicit, ...discovered];
        for (const [title, details] of detailsByName) all.push({ query: title, title, details });
        const seen = new Set();
        galleries = all.map(place => {
            const title = cleanQuery(place.title || place.query.split(',')[0]).replace(/[:—–-]+$/, '').trim();
            let query = cleanQuery(place.query || title);
            if (destination && !query.toLowerCase().includes(destination.toLowerCase())) query = `${query}, ${destination}`;
            return { query: query.slice(0, 170), title, details: cleanQuery(place.details || detailsByName.get(title.toLowerCase()) || '').slice(0, 260) };
        }).filter(place => {
            const key = place.title.toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 20);
        if (!galleries.length && destination) galleries = [{ query: `${destination} places to visit`.slice(0, 170), title: destination, details: '' }];
    } else {
        const subject = prompt
            .replace(/^\s*(please\s+)?(show|see|display|give|send|find|look for)\s+(me\s+)?/i, '')
            .replace(/\b(a few|few|some)\s+(images?|photos?|pictures?|pics?)\s+(of\s+)?/i, '')
            .replace(/^\s*(?:a|an|the)\s+/i, '')
            .replace(/\s+(so i can visit|that i can visit|please)\s*[?.!]*$/i, '')
            .replace(/\s+(?:images?|photos?|pictures?|pics?)\s*[?.!]*$/i, '')
            .replace(/[?.!]+$/g, '')
            .trim();
        if (subject) galleries = [{ query: cleanQuery(subject).slice(0, 170), title: cleanQuery(subject), details: '' }];
    }

    const answer = text
        .replace(/```(?:html|xhtml)\b[\s\S]*?```/gi, '')
        .replace(/<!doctype\s+html[\s\S]*?<\/html\s*>/gi, '')
        .replace(/```\s*gallery\b\s*[\s\S]*?(?:```|$)/gi, '')
        .replace(/^\s*(?:gallery\s+)?query\s*:\s*.+$/gim, '')
        .replace(/^\s*\[Image:\s*[^\]]+\]\s*$/gim, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    const cleanAnswer = answer
        .replace(/\*{0,2}\s*`gallery\b[^`]*`\s*\*{0,2}/gi, '')
        .replace(/`gallery\s+(?:query|q|search)\s*:[^`]*`/gi, '')
        .replace(/^\s*gallery\s+(?:query|q|search)\s*:[^\r\n]*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    const safeAnswer = cleanAnswer || (tripRequest ? 'Here are some places to explore.' : 'Here are some photos.');
    const galleryBlocks = includeGalleries ? galleries.map(place => `\`\`\`gallery\nquery: ${place.query}\ntitle: ${place.title}\ndetails: ${place.details}\nmode: ${tripRequest ? 'place' : 'search'}\n\`\`\``) : [];
    return [safeAnswer, ...galleryBlocks].join('\n\n');
};

const ChatMessage = ({ msg, isLatest, isNewMessage, previousMessage }) => {
    const isUser = msg.role === 'user' || (msg.role !== 'assistant' && msg.role !== 'ai');
    const requestText = String(previousMessage?.content || '');
    const requestsDocument = !isUser && previousMessage?.role === 'user'
        && /\b(create|generate|make|write|export|save|prepare|turn this into)\b/i.test(requestText)
        && /\b(pdf|markdown|md)\b|\.md\b/i.test(requestText);
    const requestedDocumentFormat = /\bpdf\b/i.test(requestText) ? 'pdf' : 'markdown';
    const requestedMarkdown = msg.content?.match(/```(?:markdown|md)\s*\r?\n([\s\S]*?)```/i)?.[1]?.trim();
    const dispatch = useDispatch();
    const activitySteps = useSelector(state => state.chat.activitySteps);
    const isGenerating = useSelector(state => state.chat.isGenerating);
    const { launchGuide } = useGuideEngine();
    const [copied, setCopied] = useState(false);

    // Feedback State ('like' | 'dislike' | null)
    const [feedback, setFeedback] = useState(msg.feedback || null);

    // Text-to-speech Speaking State
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Social Sharing Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
    const [postMode, setPostMode] = useState('together'); // 'together' | 'separately'
    // Caption Text for social sharing
    const [captionText, setCaptionText] = useState(
        (msg.content && msg.content !== 'Sent an image' && msg.content !== 'Sent a video' && !msg.content.startsWith('Sent ')) 
            ? msg.content 
            : ''
    );
    const [isPosting, setIsPosting] = useState(false);
    const [publishFeedback, setPublishFeedback] = useState(null);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const shareModalRef = useRef(null);

    // Dismiss share modal on outside click or Escape
    useEffect(() => {
        if (!isShareModalOpen) return;
        function handleOutsideClick(e) {
            if (shareModalRef.current && !shareModalRef.current.contains(e.target)) {
                setIsShareModalOpen(false);
            }
        }
        function handleKeyDown(e) {
            if (e.key === 'Escape') setIsShareModalOpen(false);
        }
        document.addEventListener('mousedown', handleOutsideClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isShareModalOpen]);

    useEffect(() => {
        const panel = shareModalRef.current;
        if (!isShareModalOpen || !panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const tween = gsap.fromTo(panel, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
        return () => tween.kill();
    }, [isShareModalOpen]);
    // HeroUI Pro AI Showcase interactive states
    const [isToolsExpanded, setIsToolsExpanded] = useState(false);
    const [isApprovalOpen, setIsApprovalOpen] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState(null); // 'approved' | 'rejected' | null
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);

    // Extract all attached media items
    const allMediaItems = [];
    if (msg.files && Array.isArray(msg.files) && msg.files.length > 0) {
        allMediaItems.push(...msg.files.filter(f => f?.url));
    } else if (msg.file?.url) {
        allMediaItems.push(msg.file);
    }

    const hasMedia = allMediaItems.length > 0;
    const isMultipleMedia = allMediaItems.length > 1;

    useEffect(() => {
        if (!captionText && msg.content && msg.content !== 'Sent an image' && msg.content !== 'Sent a video' && !msg.content.startsWith('Sent ')) {
            setCaptionText(msg.content);
        }
    }, [msg.content, captionText]);

    useEffect(() => {
        if (msg.feedback !== undefined) {
            setFeedback(msg.feedback);
        }
    }, [msg.feedback]);

    // Cancel speech if another message starts speaking
    useEffect(() => {
        const handleCancelSpeech = (e) => {
            if (e.detail?.activeId !== msg._id && isSpeaking) {
                setIsSpeaking(false);
            }
        };
        window.addEventListener('cancel_all_message_speech', handleCancelSpeech);
        return () => window.removeEventListener('cancel_all_message_speech', handleCancelSpeech);
    }, [isSpeaking, msg._id]);

    // Handle like / dislike response rating
    const handleFeedback = async (type) => {
        const nextFeedback = feedback === type ? null : type;
        setFeedback(nextFeedback);

        if (nextFeedback === 'like') {
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'love', speech: "Glad you liked this answer! â¤ï¸âœ¨", duration: 2500, revert: true }
                })
            );
            dispatch(addToast({ message: "Marked as good response! AI will prioritize this quality.", type: "success" }));
        } else if (nextFeedback === 'dislike') {
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'sad', speech: "Noted! I'll improve the next response. ðŸ¥º", duration: 2500, revert: true }
                })
            );
            dispatch(addToast({ message: "Marked as bad response. AI will refine its answers next time.", type: "info" }));
        }

        if (msg._id && !String(msg._id).startsWith('temp-') && !String(msg._id).startsWith('streaming-')) {
            try {
                await sendFeedback(msg._id, nextFeedback);
            } catch (err) {
                console.warn("Feedback sync failed:", err);
            }
        }
    };

    // Sync isSpeaking state with other messages and global cancel events
    useEffect(() => {
        const handleCancelSpeech = (e) => {
            if (!e.detail?.activeId || e.detail.activeId !== msg._id) {
                setIsSpeaking(false);
            }
        };
        const handleGlobalStop = () => {
            setIsSpeaking(false);
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
        window.addEventListener('cancel_all_message_speech', handleCancelSpeech);
        window.addEventListener('ai_stream_stop', handleGlobalStop);
        return () => {
            window.removeEventListener('cancel_all_message_speech', handleCancelSpeech);
            window.removeEventListener('ai_stream_stop', handleGlobalStop);
        };
    }, [msg._id]);

    // Handle Text-to-Speech playback & mascot speech sync
    const handleToggleSpeech = () => {
        if (!('speechSynthesis' in window)) {
            dispatch(addToast({ message: "Speech Synthesis is not supported in this browser.", type: "warning" }));
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            try { window.speechSynthesis.pause(); } catch {}
            try { window.speechSynthesis.resume(); } catch {}
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
            return;
        }

        window.speechSynthesis.cancel();
        try { window.speechSynthesis.pause(); } catch {}
        try { window.speechSynthesis.resume(); } catch {}
        window.speechSynthesis.cancel();
        window.dispatchEvent(new CustomEvent('cancel_all_message_speech', { detail: { activeId: msg._id } }));

        // Strip markdown syntax for natural reading
        const rawText = msg.content || "";
        const cleanText = rawText
            .replace(/```[\s\S]*?```/g, "Code block omitted.")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/https?:\/\/\S+/g, "link")
            .replace(/[*_~#\[\]()]/g, "")
            .trim();

        if (!cleanText) return;

        // Detect if text contains Hindi (Devanagari script \u0900-\u097F)
        const hasHindi = /[\u0900-\u097F]/.test(cleanText);

        const utterance = new SpeechSynthesisUtterance(cleanText);

        const savedVoiceURI = localStorage.getItem("parsu_tts_voice") || localStorage.getItem("perplexity_tts_voice");
        const savedRate = parseFloat(localStorage.getItem("parsu_tts_rate") || localStorage.getItem("perplexity_tts_rate") || "1");
        const savedPitch = parseFloat(localStorage.getItem("parsu_tts_pitch") || localStorage.getItem("perplexity_tts_pitch") || "1");

        const voices = window.speechSynthesis.getVoices();

        if (hasHindi) {
            // Explicitly set language tag to Hindi (India)
            utterance.lang = "hi-IN";
            // Look for a native Hindi voice installed on the device (e.g., Google à¤¹à¤¿à¤¨à¥à¤¦à¥€, Microsoft Kalpana/Swara/Hemant)
            const hindiVoice = voices.find(v => 
                v.lang === "hi-IN" || 
                v.lang === "hi_IN" || 
                v.lang?.toLowerCase().startsWith("hi") || 
                v.name?.toLowerCase().includes("hindi") ||
                v.name?.toLowerCase().includes("kalpana") ||
                v.name?.toLowerCase().includes("swara") ||
                v.name?.toLowerCase().includes("hemant")
            );
            if (hindiVoice) {
                utterance.voice = hindiVoice;
            }
            // Omitting an incompatible English voice allows the browser to synthesize Hindi without being muted
        } else {
            utterance.lang = "en-US";
            if (savedVoiceURI && voices.length > 0) {
                const matchedVoice = voices.find(v => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                    if (matchedVoice.lang) utterance.lang = matchedVoice.lang;
                }
            }
        }

        utterance.rate = isNaN(savedRate) ? 1 : savedRate;
        utterance.pitch = isNaN(savedPitch) ? 1 : savedPitch;

        utterance.onstart = () => {
            setIsSpeaking(true);
            window.dispatchEvent(new CustomEvent('blob_speech_state', {
                detail: { speaking: true, text: "Speaking AI response... ðŸ”Š" }
            }));
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleCopy = () => {
        if (msg.content) {
            navigator.clipboard.writeText(msg.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const togglePlatform = (pId) => {
        if (selectedPlatforms.includes(pId)) {
            if (selectedPlatforms.length > 1) {
                setSelectedPlatforms(selectedPlatforms.filter(p => p !== pId));
            }
        } else {
            setSelectedPlatforms([...selectedPlatforms, pId]);
        }
    };

    const handleGenerateAiCaption = async () => {
        try {
            setIsGeneratingCaption(true);
            const mediaUrls = allMediaItems.map(m => m.url);
            const res = await generateCaption({
                mediaUrls,
                context: msg.content || captionText,
                platform: selectedPlatforms.join(', ')
            });
            if (res.success && res.caption) {
                setCaptionText(res.caption);
                window.dispatchEvent(
                    new CustomEvent('blob_trigger_mood', {
                        detail: { 
                            mood: 'love', 
                            speech: 'Crafted a viral caption with hashtags for you! ðŸª„âœ¨', 
                            duration: 3500, 
                            revert: true 
                        }
                    })
                );
            }
        } catch (err) {
            console.error("Failed to generate AI caption:", err);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleUniversalPublish = async () => {
        if (selectedPlatforms.length === 0 || allMediaItems.length === 0) return;

        try {
            setIsPosting(true);
            setPublishFeedback(null);

            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { 
                        mood: 'hmm', 
                        speech: `Publishing to ${selectedPlatforms.map(p => p.toUpperCase()).join(', ')}... â³`, 
                        duration: 3500, 
                        revert: true 
                    }
                })
            );

            const mediaUrls = allMediaItems.map(m => m.url);
            const res = await publishMedia({
                platforms: selectedPlatforms,
                mediaUrls,
                caption: captionText || (isMultipleMedia ? "Album posted via Parsu AI" : "Posted via Parsu AI"),
                postMode,
                messageId: msg._id
            });

            setPublishFeedback(res);

            if (res.results?.successful?.length > 0) {
                const names = res.results.successful.map(s => s.platform).join(', ');
                window.dispatchEvent(
                    new CustomEvent('blob_trigger_mood', {
                        detail: { 
                            mood: 'happy', 
                            speech: `Live on ${names}! ðŸŽ‰ðŸš€`, 
                            duration: 4000, 
                            celebrate: true, 
                            revert: true 
                        }
                    })
                );
            } else if (res.results?.notConnected?.length > 0) {
                window.dispatchEvent(
                    new CustomEvent('blob_trigger_mood', {
                        detail: { 
                            mood: 'surprised', 
                            speech: `Account not connected yet! Connect in Social Hub âš¡`, 
                            duration: 3500, 
                            revert: true 
                        }
                    })
                );
            }
        } catch (err) {
            console.error("Publish error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to post";
            setPublishFeedback({
                error: errorMsg
            });
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'surprised', speech: `Publish failed! ${errorMsg.slice(0, 30)}`, duration: 3500, revert: true }
                })
            );
        } finally {
            setIsPosting(false);
        }
    };

    const isGalleryResponse = !isUser && previousMessage?.role === 'user' && isVisualSearchPrompt(previousMessage.content || '');
    const contentToRender = isGalleryResponse
        ? normalizeVisualAnswer(msg.content || '', previousMessage.content || '', !msg.isStreaming)
        : msg.content;

    // A map block must appear ONLY when the AI sends one. Do not auto-inject maps.
    const detectedMapLocation = null;

    // Successful posted platforms from DB or recent action
    const existingPosts = msg.socialPosts || [];

    return (
        <div id={`msg-${msg._id}`} className="flex flex-col gap-6 animate-in fade-in duration-500">
            {isUser ? (
                <div className="flex flex-col items-end gap-3 pr-1">
                    {/* Media Display Section */}
                    {hasMedia && (
                        <div className="max-w-[340px] md:max-w-[440px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in duration-300 bg-zinc-950">
                            
                            {/* MULTI-MEDIA ALBUM / GRID */}
                            {isMultipleMedia ? (
                                <div className="relative">
                                    <div className={`grid gap-1 bg-zinc-900 ${allMediaItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                        {allMediaItems.slice(0, 4).map((item, idx) => {
                                            const isVideo = item.fileType === 'video' || item.mimetype?.startsWith('video/') || /\.(mp4|mov|webm)(\?|$)/i.test(item.url);
                                            return (
                                                <div key={idx} className="relative aspect-square overflow-hidden bg-black flex items-center justify-center">
                                                    {isVideo ? (
                                                        <video src={item.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                                                    )}
                                                    {idx === 3 && allMediaItems.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-lg font-bold">
                                                            +{allMediaItems.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="px-3 py-1.5 bg-zinc-900/90 text-zinc-300 text-[11px] font-semibold flex items-center justify-between border-t border-zinc-800">
                                        <span>ðŸ“ Album ({allMediaItems.length} items)</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Ready to publish</span>
                                    </div>
                                </div>
                            ) : (
                                /* SINGLE MEDIA ITEM */
                                (() => {
                                    const single = allMediaItems[0];
                                    const isVideo = single.fileType === 'video' || single.mimetype?.startsWith('video/') || /\.(mp4|mov|webm)(\?|$)/i.test(single.url);
                                    const isDoc = single.fileType === 'document' || single.mimetype === 'application/pdf' || /\.(pdf|txt|md|doc|docx)(\?|$)/i.test(single.url) || /\.(pdf|txt|md|doc|docx)$/i.test(single.name || '');
                                    const isPdf = single.mimetype === 'application/pdf' || /\.pdf(\?|$)/i.test(single.url || '') || /\.pdf$/i.test(single.name || '');
                                    const isMarkdown = /\.(md|markdown)(\?|$)/i.test(single.url || '') || /\.(md|markdown)$/i.test(single.name || '');

                                    if (isVideo) {
                                        return (
                                            <div>
                                                <video src={single.url} controls playsInline className="w-full h-auto max-h-[360px] bg-black" />
                                                <div className="px-3.5 py-1.5 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center gap-1.5">
                                                    <RiVideoLine size={15} className="text-purple-400" />
                                                    <span className="truncate">{single.name || "Video"}</span>
                                                </div>
                                            </div>
                                        );
                                    } else if (isDoc) {
                                        return (
                                            <a 
                                                href={single.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                onClick={(event) => {
                                                    if (!isPdf && !isMarkdown) return;
                                                    event.preventDefault();
                                                    window.dispatchEvent(new CustomEvent('parsu:open-artifact', { detail: {
                                                        kind: isPdf ? 'pdf' : 'markdown',
                                                        url: single.url,
                                                        name: single.name || (isPdf ? 'document.pdf' : 'document.md'),
                                                        content: '',
                                                    } }));
                                                }}
                                                className="flex items-center gap-3 p-3.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
                                                title="Open document in the side viewer"
                                            >
                                                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
                                                    {isPdf ? <RiFilePdfLine size={24} /> : <RiFileTextLine size={24} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">{single.name || (isPdf ? 'PDF Document' : 'Document')}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                        <span>Open in side viewer</span>
                                                    </p>
                                                </div>
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <div>
                                                <button type="button" className="block w-full cursor-zoom-in" aria-label={`Open ${single.name || 'attached image'} in side viewer`} onClick={() => openArtifact({
                                                    kind: 'image', url: single.url, name: single.name || 'attached-image',
                                                    title: single.name || 'Attached image', source: 'Chat attachment',
                                                    image: { url: single.url, title: single.name || 'Attached image', source: 'Chat attachment' },
                                                })}>
                                                    <img src={single.url} alt="Attached" className="w-full h-auto max-h-[380px] object-cover" />
                                                </button>
                                                <div className="px-3.5 py-1.5 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center gap-1.5">
                                                    <RiImageLine size={15} className="text-emerald-400" />
                                                    <span className="truncate">{single.name || "Photo"}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()
                            )}

                            {/* Share to Socials Action Bar */}
                            <div className="p-3 bg-[var(--bg-primary)] dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {existingPosts.map((p, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 dark:border-emerald-800/40">
                                            <RiCheckLine size={11} /> {p.platform}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setIsShareModalOpen(!isShareModalOpen)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 text-[11px] font-bold transition-all shadow-sm shadow-cyan-950/15 cursor-pointer ml-auto"
                                    title="Publish to connected social media platforms"
                                >
                                    <RiShareLine size={13} />
                                    <span>Share to Socials</span>
                                </button>
                            </div>

                            {/* Interactive Share to Socials Dropdown / Drawer */}
                            {isShareModalOpen && (
                                <div ref={shareModalRef} className="p-3.5 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-left">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                            <RiSparklingLine size={14} className="text-amber-500" />
                                            Target Platforms:
                                        </span>
                                        <button 
                                            onClick={() => setIsShareModalOpen(false)}
                                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                                        >
                                            <RiCloseLine size={16} />
                                        </button>
                                    </div>

                                    {/* Platform Selection Badges */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {SOCIAL_PLATFORMS_LIST.map((platform) => {
                                            const isSelected = selectedPlatforms.includes(platform.id);
                                            const Icon = platform.icon;
                                            return (
                                                <button
                                                    key={platform.id}
                                                    onClick={() => togglePlatform(platform.id)}
                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)] text-zinc-900 dark:text-white shadow-xs' 
                                                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    <Icon size={13} style={{ color: isSelected ? platform.color : undefined }} />
                                                    <span>{platform.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Carousel vs Separately Option (if multiple files) */}
                                    {isMultipleMedia && (
                                        <div className="flex items-center justify-between mb-3 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px]">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Upload Mode:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPostMode('together')}
                                                    className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                                        postMode === 'together' 
                                                            ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow' 
                                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    Carousel (Together)
                                                </button>
                                                <button
                                                    onClick={() => setPostMode('separately')}
                                                    className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                                        postMode === 'separately' 
                                                            ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow' 
                                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    Separately
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Caption Input with AI Generation Button */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                                Caption & Hashtags
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleGenerateAiCaption}
                                                disabled={isGeneratingCaption}
                                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                                                title="Generate viral caption using AI"
                                            >
                                                <RiMagicLine size={12} className={isGeneratingCaption ? "animate-spin text-pink-500" : "text-pink-500"} />
                                                <span>{isGeneratingCaption ? 'Generating...' : 'AI Generate Caption'}</span>
                                            </button>
                                        </div>
                                        <textarea
                                            value={captionText}
                                            onChange={(e) => setCaptionText(e.target.value)}
                                            placeholder="Write or refine caption with hashtags..."
                                            rows={2}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-cyan)] resize-none font-sans"
                                        />
                                    </div>

                                    {/* Feedback message display */}
                                    {publishFeedback && (
                                        <div className="mb-2 text-[11px] p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            {publishFeedback.results?.successful?.map((s, i) => (
                                                <p key={i} className="text-emerald-500 font-semibold">âœ“ Posted to {s.platform} (ID: {s.mediaId})</p>
                                            ))}
                                            {publishFeedback.results?.notConnected?.map((nc, i) => (
                                                <p key={i} className="text-amber-500 font-medium">âš ï¸ {nc.message}</p>
                                            ))}
                                            {publishFeedback.results?.failed?.map((f, i) => (
                                                <p key={i} className="text-red-500 font-medium">âŒ {f.platform}: {f.error}</p>
                                            ))}
                                            {publishFeedback.error && (
                                                <p className="text-red-500 font-medium">âŒ {publishFeedback.error}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleUniversalPublish}
                                        disabled={isPosting}
                                        className="w-full py-2 rounded-xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 font-bold text-xs shadow-md shadow-cyan-950/15 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        <RiShareLine size={14} />
                                        <span>{isPosting ? 'Publishing to Socials...' : `Publish to ${selectedPlatforms.length} Platform(s)`}</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    )}

                    <div className="bg-zinc-100 dark:bg-[var(--surface-2)] text-zinc-900 dark:text-[var(--fg)] px-4 md:px-5 py-2.5 md:py-3 rounded-[20px] md:rounded-[22px] text-[14px] md:text-[15px] border border-zinc-200/80 dark:border-[var(--border)] shadow-xs transition-all hover:bg-zinc-200/70 dark:hover:bg-[var(--surface-hover)] max-w-full text-left">
                        {typeof contentToRender === 'string' && contentToRender.includes('```') ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-100">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        pre: ({children}) => <>{children}</>,
                                        img: ({src, alt, ...props}) => <img src={src} alt={alt || ''} loading="lazy" className="rounded-xl max-w-full max-h-[420px] object-contain cursor-zoom-in" onClick={() => openArtifact({ kind: 'image', url: src, name: `${alt || 'image'}.jpg`, title: alt || 'Image', source: 'Chat response', image: { url: src, title: alt || 'Image' } })} onError={(event) => { event.currentTarget.style.display = 'none'; }} {...props} />,
                                        code({node, inline, className, children, ...props}) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const codeString = String(children).replace(/\n$/, '');
                                            return !inline && match ? (
                                                <CodeBlock 
                                                    code={codeString} 
                                                    language={match[1]} 
                                                    messageId={msg?._id}
                                                    chatId={msg?.chat || msg?.chatId}
                                                    {...props} 
                                                />
                                            ) : !inline ? (
                                                <CodeBlock 
                                                    code={codeString} 
                                                    language="code" 
                                                    messageId={msg?._id}
                                                    chatId={msg?.chat || msg?.chatId}
                                                    {...props} 
                                                />
                                            ) : (
                                                <code className={`${className} bg-zinc-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono`} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        p: ({children}) => <div className="whitespace-pre-wrap break-words leading-relaxed mb-2 last:mb-0 font-medium">{children}</div>
                                    }}
                                >
                                    {contentToRender}
                                </ReactMarkdown>
                            </div>
                        ) : typeof contentToRender === 'string' && isRawCodeBlock(contentToRender) ? (
                            <div className="w-full max-w-full overflow-hidden">
                                <CodeBlock code={contentToRender} language={detectCodeLanguage(contentToRender)} messageId={msg?._id} chatId={msg?.chat || msg?.chatId} />
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap break-words leading-relaxed font-medium">
                                {contentToRender}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 self-end rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 transition-colors"
                        title="Copy your prompt"
                        aria-label={copied ? 'Prompt copied' : 'Copy your prompt'}
                    >
                        {copied ? <><RiCheckLine size={15} className="text-emerald-500" /><span className="text-[11px] text-emerald-500">Copied</span></> : <RiFileCopyLine size={15} />}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {typeof contentToRender === 'string' && /experiencing high traffic right now|at capacity right now/i.test(contentToRender) ? (
                        <div className="p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/25 dark:border-amber-400/20 backdrop-blur-md space-y-3">
                            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                                <RiSparklingLine size={18} className="text-amber-500 animate-pulse" />
                                <span>Gemini High Traffic Notice</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">High Load</span>
                            </div>
                            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                {contentToRender}
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>ðŸ’¡ <strong>Tip:</strong> You can select another AI model from the bottom selector to continue immediately.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {/* HeroUI Pro AI Collapsible Tool Calls */}
                            {(msg.toolCalls?.length > 0 || (typeof contentToRender === 'string' && /tool call|sendEmail|streaming, grouped/i.test(contentToRender))) && (
                                <div className="mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsToolsExpanded(prev => !prev)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer select-none"
                                    >
                                        <span>{msg.toolCalls?.length || 2} tool calls</span>
                                        {isToolsExpanded ? <RiArrowUpSLine size={14} /> : <RiArrowDownSLine size={14} />}
                                    </button>
                                    {isToolsExpanded && (
                                        <div className="mt-2 p-3 rounded-2xl bg-zinc-50 dark:bg-[var(--bg-surface)] border border-zinc-200 dark:border-white/10 space-y-2 text-xs font-mono animate-in fade-in duration-200">
                                            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                                                <span className="flex items-center gap-1.5">âš¡ <strong className="text-zinc-900 dark:text-zinc-200">tavilySearch</strong>: <code>query: "Parsu AI updates"</code></span>
                                                <span className="text-emerald-500 font-bold text-[11px]">completed (142ms)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                                                <span className="flex items-center gap-1.5">âš¡ <strong className="text-zinc-900 dark:text-zinc-200">vectorMemoryQuery</strong>: <code>k: 5</code></span>
                                                <span className="text-emerald-500 font-bold text-[11px]">completed (98ms)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HeroUI Pro AI Approval Card */}
                            {(msg.needsApproval || (typeof contentToRender === 'string' && /approval needed|needs approval/i.test(contentToRender))) && (
                                <div className="my-2 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[var(--bg-surface)] overflow-hidden shadow-sm">
                                    <div 
                                        onClick={() => setIsApprovalOpen(prev => !prev)}
                                        className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/5 cursor-pointer select-none"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                            <RiAlertLine size={16} className="text-amber-500 shrink-0" />
                                            <span>Approval needed: sendEmail</span>
                                        </div>
                                        {isApprovalOpen ? <RiArrowUpSLine size={16} className="text-zinc-400" /> : <RiArrowDownSLine size={16} className="text-zinc-400" />}
                                    </div>
                                    {isApprovalOpen && (
                                        <div className="p-4 space-y-3">
                                            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-black/60 font-mono text-xs text-zinc-800 dark:text-cyan-300 overflow-x-auto border border-zinc-200/60 dark:border-white/5">
                                                {`{"to": "team@acme.com", "subject": "Launch update"}`}
                                            </div>
                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                {approvalStatus ? (
                                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                        {approvalStatus === 'approved' ? 'âœ“ Approved' : 'âœ— Rejected'}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setApprovalStatus('rejected');
                                                                dispatch(addToast({ type: 'warning', message: 'Action rejected by user.' }));
                                                            }}
                                                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setApprovalStatus('approved');
                                                                dispatch(addToast({ type: 'success', message: 'Action approved successfully.' }));
                                                            }}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 shadow-sm transition-all cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.isStreaming && isGenerating && <ActivityTrace steps={activitySteps} prompt={previousMessage?.content} />}

                            <div className="prose prose-emerald dark:prose-invert max-w-none text-zinc-950 dark:text-zinc-200 leading-[1.7] md:leading-[1.8] text-[15px] md:text-[17px] font-medium tracking-tight">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        pre: ({children}) => <>{children}</>,
                                        img: ({src, alt, ...props}) => <img src={src} alt={alt || ''} loading="lazy" className="rounded-xl max-w-full max-h-[420px] object-contain cursor-zoom-in" onClick={() => openArtifact({ kind: 'image', url: src, name: `${alt || 'image'}.jpg`, title: alt || 'Image', source: 'Chat response', image: { url: src, title: alt || 'Image' } })} onError={(event) => { event.currentTarget.style.display = 'none'; }} {...props} />,
                                        code({node, inline, className, children, ...props}) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const codeString = String(children).replace(/\n$/, '');
                                            const trimmedCode = codeString.trim();
                                            
                                            // Embedded Interactive Google Map: ONLY explicit ```map codeblock
                                            const isExplicitMap = !inline && match?.[1] && /^(map|maps|googlemap|googlemaps)$/i.test(match[1]);

                                            if (isExplicitMap) {
                                                return (
                                                    <div className="my-3 not-prose">
                                                        <EmbeddedMapCard 
                                                            location={trimmedCode} 
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Web Image Gallery: ```gallery ... ```
                                            if (match?.[1] && /^gallery$/i.test(match[1])) {
                                                const getGalleryField = key => trimmedCode.match(new RegExp(`^\\s*${key}\\s*:\\s*(.*)$`, 'im'))?.[1]?.trim() || '';
                                                const query = getGalleryField('query') || getGalleryField('q') || getGalleryField('search') || trimmedCode;
                                                return (
                                                    <ImageGalleryBlock
                                                        query={query}
                                                        title={getGalleryField('title')}
                                                        details={getGalleryField('details')}
                                                        mode={getGalleryField('mode') || 'search'}
                                                    />
                                                );
                                            }

                                            if (match?.[1] && /^imagegen$/i.test(match[1])) {
                                                const promptMatch = trimmedCode.match(/(?:prompt|description):\s*([\s\S]+)/i);
                                                const prompt = (promptMatch?.[1] || trimmedCode).trim();
                                                return prompt ? <ImageGenerationBlock prompt={prompt} /> : null;
                                            }

                                            // Product Cards with Details & Uses: ```cards ... ``` or ```product_cards ... ```
                                            if (match?.[1] && /^(cards|product_cards|products)$/i.test(match[1])) {
                                                return <ProductCardsBlock code={trimmedCode} />;
                                            }

                                            // Interactive AI Guided Walkthrough Card: ```guide ... ```
                                            if (match?.[1] && /^guide$/i.test(match[1])) {
                                                const guide = GUIDES[trimmedCode];
                                                if (!guide) return null;
                                                return (
                                                    <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg not-prose">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
                                                                <RiCompass3Line size={22} className="animate-pulse" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Interactive Walkthrough</span>
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">{guide.pageTitle || 'Live Tour'}</span>
                                                                </div>
                                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{guide.title}</h4>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => launchGuide(guide.id)}
                                                            className="px-4 py-2 rounded-xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
                                                        >
                                                            <span>Take Live Tour</span>
                                                            <RiSparklingLine size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            return !inline && match ? (
                                                <CodeBlock 
                                                    code={codeString} 
                                                    language={match[1]} 
                                                    messageId={msg?._id}
                                                    chatId={msg?.chat || msg?.chatId}
                                                    {...props} 
                                                />
                                            ) : (
                                                <code className={`${className} bg-zinc-200/70 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded text-sm text-zinc-900 dark:text-zinc-200 font-mono font-medium`} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        a: ({href, children, ...props}) => {
                                            const isGoogleMaps = href && /(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(href);
                                            const isPdfFile = href && /\.pdf(?:[?#]|$)/i.test(href);
                                            const isMarkdownFile = href && /\.(?:md|markdown)(?:[?#]|$)/i.test(href);
                                            if (isPdfFile || isMarkdownFile) {
                                                return <button type="button" onClick={() => openArtifact({ kind: isPdfFile ? 'pdf' : 'markdown', url: href, name: String(children).trim() || (isPdfFile ? 'document.pdf' : 'document.md') })} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3.5 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]">{isPdfFile ? <RiFilePdfLine size={17} aria-hidden="true" /> : <RiFileTextLine size={17} aria-hidden="true" />}<span>{children}</span></button>;
                                            }
                                            return (
                                                <a 
                                                    href={href} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className={`underline decoration-[var(--accent)] decoration-1 underline-offset-2 hover:text-[var(--accent)] font-medium transition-colors ${isGoogleMaps ? 'inline-flex items-center gap-1 text-[var(--accent)] font-bold' : 'text-zinc-900 dark:text-zinc-100'}`}
                                                    {...props}
                                                >
                                                    {children}
                                                    {isGoogleMaps && <RiCompass3Line size={13} className="shrink-0" />}
                                                </a>
                                            );
                                        },
                                        p: ({children}) => <div className="text-zinc-900 dark:text-zinc-200 leading-relaxed mb-6 last:mb-0 font-normal">{children}</div>,
                                        ul: ({children}) => <ul className="list-disc pl-5 space-y-3 mb-6 last:mb-0 text-zinc-900 dark:text-zinc-200 leading-relaxed">{children}</ul>,
                                        ol: ({children}) => <ol className="list-decimal pl-5 space-y-2 mb-6 last:mb-0 text-zinc-900 dark:text-zinc-200 leading-relaxed">{children}</ol>,
                                        li: ({children}) => <li className="text-zinc-900 dark:text-zinc-200 leading-relaxed pl-1">{children}</li>,
                                        strong: ({children}) => <strong className="font-bold text-zinc-950 dark:text-white">{children}</strong>,
                                        blockquote: ({children}) => (
                                            <blockquote className="border-l-4 border-[var(--accent)]/70 bg-zinc-100 dark:bg-zinc-800/40 rounded-r-xl px-4 py-2.5 my-4 italic text-zinc-800 dark:text-zinc-200">
                                                {children}
                                            </blockquote>
                                        ),
                                        h1: ({children}) => <h1 className="text-2xl md:text-3xl font-bold text-zinc-950 dark:text-white mt-10 mb-6 tracking-tight">{children}</h1>,
                                        h2: ({children}) => <h2 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white mt-8 mb-4 tracking-tight">{children}</h2>,
                                        h3: ({children}) => <h3 className="text-lg md:text-xl font-bold text-zinc-950 dark:text-white mt-6 mb-3 tracking-tight">{children}</h3>,
                                        table: ({children}) => (
                                            <div className="w-full overflow-x-auto my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 custom-scrollbar">
                                                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[360px]">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        th: ({children}) => (
                                            <th className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 font-bold text-xs text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">
                                                {children}
                                            </th>
                                        ),
                                        td: ({children}) => (
                                            <td className="px-3.5 py-2 text-xs border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                                                {children}
                                            </td>
                                        ),
                                    }}
                                >
                                    {contentToRender}
                                </ReactMarkdown>
                            </div>

                            {/* Auto-detected Interactive Map Card (if message mentions a map or maps link not in a codeblock) */}
                            {detectedMapLocation && (
                                <div className="mt-1">
                                    <EmbeddedMapCard location={detectedMapLocation} />
                                </div>
                            )}

                            {/* Web Sources â€” only shown when the backend returned real citations */}
                            {msg.sources?.length > 0 && (
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSourcesOpen(prev => !prev)}
                                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium transition-colors cursor-pointer select-none"
                                    >
                                        <span>{msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}</span>
                                        {isSourcesOpen ? <RiArrowUpSLine size={13} /> : <RiArrowDownSLine size={13} />}
                                    </button>
                                    {isSourcesOpen && (
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in duration-200">
                                            {msg.sources.map((src, idx) => (
                                                <a
                                                    key={idx}
                                                    href={src.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[var(--bg-surface)] border border-zinc-200 dark:border-white/10 hover:border-[var(--accent-cyan)]/40 transition-all flex flex-col gap-1 text-left group"
                                                >
                                                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-[var(--accent-cyan)] transition-colors">{src.title}</span>
                                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                        <RiGlobalLine size={11} className="text-[var(--accent-cyan)]" />
                                                        {src.domain}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                    {msg.content && (
                        <div className="flex items-center gap-3.5 sm:gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-900/50 opacity-60 hover:opacity-100 transition-opacity">
                            {requestsDocument && <button type="button" onClick={() => openArtifact({
                                kind: 'markdown',
                                content: requestedMarkdown || msg.content,
                                  name: 'generated-document.md',
                                  mode: 'preview',
                              })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                                {requestedDocumentFormat === 'pdf' ? <RiFilePdfLine size={15} /> : <RiFileTextLine size={15} />}
                                {requestedDocumentFormat === 'pdf' ? 'Open PDF export' : 'Open Markdown'}
                            </button>}
                            {/* Copy Message */}
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                                title="Copy response text"
                            >
                                {copied ? (
                                    <>
                                        <span className="text-[11px] font-bold text-emerald-500">Copied!</span>
                                        <RiCheckLine size={16} className="text-emerald-500" />
                                    </>
                                ) : (
                                    <RiFileCopyLine size={16} />
                                )}
                            </button>

                            {/* Speaker / Read Aloud Button */}
                            <button
                                onClick={handleToggleSpeech}
                                className={`flex items-center gap-1 p-1 rounded-md transition-all cursor-pointer ${
                                    isSpeaking 
                                        ? 'text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/15 ring-1 ring-[var(--accent-cyan)]/30 scale-105' 
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                }`}
                                title={isSpeaking ? "Stop Speaking" : "Read Aloud (Voice Output)"}
                            >
                                {isSpeaking ? (
                                    <>
                                        <RiVolumeUpFill size={16} className="text-[var(--accent-cyan)] animate-pulse" />
                                        <span className="text-[11px] font-bold text-[var(--accent-cyan)] hidden xs:inline">Speaking</span>
                                    </>
                                ) : (
                                    <RiVolumeUpLine size={16} />
                                )}
                            </button>

                            <div className="flex-1" />

                            {/* Like / Good Response Button */}
                            <button 
                                onClick={() => handleFeedback('like')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    feedback === 'like'
                                        ? 'text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/15 ring-1 ring-[var(--accent-cyan)]/40 scale-110 shadow-xs'
                                        : 'text-zinc-400 dark:text-zinc-500 hover:text-[var(--accent-cyan)] hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                                title={feedback === 'like' ? "Remove Like" : "Good response (AI will learn your preference)"}
                            >
                                {feedback === 'like' ? (
                                    <RiThumbUpFill size={16} className="text-[var(--accent-cyan)]" />
                                ) : (
                                    <RiThumbUpLine size={16} />
                                )}
                            </button>

                            {/* Dislike / Bad Response Button */}
                            <button 
                                onClick={() => handleFeedback('dislike')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    feedback === 'dislike'
                                        ? 'text-rose-500 bg-rose-500/15 ring-1 ring-rose-500/40 scale-110 shadow-xs'
                                        : 'text-zinc-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                                title={feedback === 'dislike' ? "Remove Dislike" : "Bad response (AI will improve next time)"}
                            >
                                {feedback === 'dislike' ? (
                                    <RiThumbDownFill size={16} className="text-rose-500" />
                                ) : (
                                    <RiThumbDownLine size={16} />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(ChatMessage);
