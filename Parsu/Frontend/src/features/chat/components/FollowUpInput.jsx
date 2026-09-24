import { 
    RiAddLine, 
    RiUploadCloudLine, 
    RiMicLine, 
    RiMicFill,
    RiArrowUpLine, 
    RiCloseLine, 
    RiAttachment2,
    RiFileTextLine,
    RiImageLine,
    RiVideoLine,
    RiFilePdfLine,
    RiPlayListAddLine,
    RiFullscreenLine,
    RiFullscreenExitLine,
    RiCodeSSlashLine,
    RiGlobalLine
} from '@remixicon/react';
import ModelSelectorDropdown from './ModelSelectorDropdown';
import AttachmentPreviewStrip from './AttachmentPreviewStrip';
import MessageQueueTray from './MessageQueueTray';
import AddToChatSheet from './AddToChatSheet';
import { triggerBlobInteraction, triggerBlobTyping } from '../../../utils/blobReactions';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const FollowUpInput = ({ 
    input, 
    setInput, 
    onSubmit,
    files, 
    removeFile, 
    isUploadMenuOpen, 
    setIsUploadMenuOpen, 
    fileInputRef, 
    handleFileUpload,
    selectedModel,
    onModelChange,
    isResponding = false,
    queue = [],
    onStopGenerating,
    onEditQueuedMessage,
    onDeleteQueuedMessage,
    webSearch = true,
    onToggleWebSearch,
    memoryEnabled = true,
    onToggleMemory
}) => {
    // Separate refs for each file type
    const videoInputRef = useRef(null);
    const docInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const dispatch = useDispatch();
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);

    // Speech Recognition (Voice to text) & Live Caption
    const [isListening, setIsListening] = useState(false);
    const [liveCaption, setLiveCaption] = useState('');
    const recognitionRef = useRef(null);
    const baseInputRef = useRef('');

    const handleToggleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            dispatch(addToast({
                type: 'warning',
                message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.'
            }));
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            setIsListening(false);
            setLiveCaption('');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            // Smart language configuration: detect if user prefers Hindi or device language
            const savedVoiceURI = localStorage.getItem('parsu_tts_voice') || localStorage.getItem('perplexity_tts_voice') || '';
            const isHindiPreferred = savedVoiceURI.toLowerCase().includes('hindi') || 
                                     savedVoiceURI.toLowerCase().includes('hi-in') || 
                                     (navigator.language && navigator.language.startsWith('hi'));
            recognition.lang = isHindiPreferred ? 'hi-IN' : (navigator.language || 'en-US');

            // Capture existing input before recognition starts to prevent re-duplication
            baseInputRef.current = input ? input.trim() : '';

            recognition.onstart = () => {
                setIsListening(true);
                setLiveCaption('Listening to your speech... Speak now 🎙️');
                triggerBlobInteraction('curious');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                // Iterate through all accumulated results from 0 to length - 1
                // to prevent Chrome's non-monotonic event.resultIndex duplication bug
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                finalTranscript = finalTranscript.trim();
                interimTranscript = interimTranscript.trim();

                const fullLive = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
                if (fullLive) {
                    setLiveCaption(fullLive);
                }

                const base = baseInputRef.current;
                const currentSpoken = fullLive;

                if (currentSpoken) {
                    const combined = base ? `${base} ${currentSpoken}` : currentSpoken;
                    setInput(combined);
                    if (finalTranscript) {
                        triggerBlobTyping();
                    }
                }
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    dispatch(addToast({
                        type: 'error',
                        message: `Mic error: ${event.error || 'Check microphone permissions'}`
                    }));
                }
                setIsListening(false);
                setLiveCaption('');
            };

            recognition.onend = () => {
                setIsListening(false);
                setLiveCaption('');
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setIsListening(false);
            setLiveCaption('');
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Textarea resizing & code formatting state
    const textareaRef = useRef(null);
    const [isFullScreenEditor, setIsFullScreenEditor] = useState(false);

    // Detect whether pasted or typed content is code
    const isCodeContent = Boolean(
        input && (
            input.includes('```') ||
            (input.includes('\n') && (
                /^(import|export|const|let|var|function|class|def|public|private|protected|interface|type|return|<[a-zA-Z]+|\/\/|\/\*|#include|package|func|select|from|where)\b/im.test(input) ||
                /[{}();=>\[\]]/.test(input)
            ))
        )
    );

    // Auto-grow textarea naturally based on input text content
    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        const scrollH = textareaRef.current.scrollHeight;
        const nextH = Math.min(Math.max(scrollH, 40), 260);
        textareaRef.current.style.height = `${nextH}px`;
    }, [input]);

    const handleKeyDown = (e) => {
        // Tab key for code indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            setInput(newValue);

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
            });
            return;
        }

        if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                // Let the browser insert a newline
                return;
            }
            e.preventDefault();
            onSubmit(e);
        }
    };

    // Get file type icon
    const getFileIcon = (file) => {
        if (file.isLink) return <RiAttachment2 size={12} className="text-[var(--color-clear-hanada)]" />;
        const name = file.name?.toLowerCase() || '';
        if (name.match(/\.(mp4|webm|mov|avi|mkv)$/)) return <RiVideoLine size={12} className="text-purple-400" />;
        if (name.match(/\.(pdf)$/)) return <RiFilePdfLine size={12} className="text-red-400" />;
        if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return <RiImageLine size={12} className="text-emerald-400" />;
        return <RiFileTextLine size={12} className="text-[var(--color-clear-hanada)]" />;
    };

    return (
        <div className={`absolute bottom-0 left-0 w-full ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} bg-gradient-to-t from-[#f4f5f7] dark:from-[#050505] via-[#f4f5f7]/95 dark:via-[#050505]/95 to-transparent z-40 pb-6 md:pb-8 pointer-events-none transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-end`}>
            {/* Queued Messages Tray & Stop Generating */}
            <MessageQueueTray 
                queue={queue}
                isResponding={isResponding}
                onStopGenerating={onStopGenerating}
                onEditQueuedMessage={onEditQueuedMessage}
                onDeleteQueuedMessage={onDeleteQueuedMessage}
            />

            <div className="max-w-[800px] mx-auto px-2.5 sm:px-4 md:px-6 pointer-events-auto w-full">
                <div className="w-full bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/90 dark:border-[#2d2e2e] focus-within:border-zinc-300 dark:focus-within:border-zinc-700 rounded-[22px] sm:rounded-[28px] px-3.5 sm:px-6 py-3 sm:py-4 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
                    
                    {/* Rich Attachment Preview Strip */}
                    <AttachmentPreviewStrip files={files} onRemove={removeFile} />

                    {/* Live Voice Captioning Stream */}
                    {isListening && (
                        <div className="flex items-center gap-3 px-3.5 py-2 mb-2 rounded-xl bg-zinc-900/95 dark:bg-[#18181b]/95 border border-[var(--accent-cyan)]/40 text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="w-1 h-3 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:0ms]" />
                                <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:150ms]" />
                                <span className="w-1 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:300ms]" />
                                <span className="w-1 h-4 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:450ms]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                                    <span className="text-[10px] font-bold text-[var(--color-sky-haze)] uppercase tracking-wider">Live Speech Caption</span>
                                </div>
                                <p className="text-[13px] text-zinc-100 font-medium truncate italic mt-0.5">
                                    {liveCaption || 'Listening to your voice... Speak now'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleVoiceInput}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer shrink-0"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Multi-line or Code Information & Quick Fullscreen Header */}
                    {(isCodeContent || (input && input.split('\n').length > 2)) && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 select-none animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                                {isCodeContent && (
                                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 text-[var(--color-deep-hanada)] dark:text-[var(--color-sky-haze)] border border-[var(--accent-cyan)]/25">
                                        <RiCodeSSlashLine size={12} />
                                        Code format preserved
                                    </span>
                                )}
                                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                    {input.split('\n').length} lines • {input.length} characters
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFullScreenEditor(true)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-cyan)] hover:text-[var(--color-deep-hanada)] dark:hover:text-[var(--color-sky-haze)] transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                                title="Open full-screen prompt and code editor"
                            >
                                <RiFullscreenLine size={13} />
                                <span>Full screen</span>
                            </button>
                        </div>
                    )}

                    <textarea 
                        ref={textareaRef}
                        rows="1"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            triggerBlobTyping();
                        }}
                        onMouseEnter={() => triggerBlobInteraction('hover')}
                        onClick={() => triggerBlobInteraction('click')}
                        onFocus={() => triggerBlobInteraction('focus')}
                        onKeyDown={handleKeyDown}
                        spellCheck={!isCodeContent}
                        style={{
                            whiteSpace: 'pre-wrap',
                            tabSize: 2,
                            MozTabSize: 2
                        }}
                        placeholder={isResponding ? "Add a follow-up or code snippet to queue..." : "Ask a follow-up or paste code..."}
                        className={`w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 custom-scrollbar mb-2 sm:mb-3 py-1 transition-all resize-none ${
                            isCodeContent 
                                ? 'font-mono text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed' 
                                : 'font-sans font-medium text-[16px] sm:text-[18px] md:text-[20px]'
                        } min-h-[40px] max-h-[260px] cursor-text`}
                    />

                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        {/* Left Side Actions */}
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                            {/* Apple-style Circular Attach Button (+ icon only) */}
                            <div className="relative shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => setIsUploadMenuOpen(true)}
                                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer shrink-0"
                                    title="Add to chat (Photos, Videos, Files, Memory)"
                                    aria-label="Add to chat"
                                >
                                    <RiAddLine size={18} className="shrink-0" />
                                </button>
                                
                                {/* Premium 'Add to chat' Mobile Bottom Sheet & Desktop Modal */}
                                <AddToChatSheet
                                    isOpen={isUploadMenuOpen}
                                    onClose={() => setIsUploadMenuOpen(false)}
                                    onPickCamera={() => cameraInputRef.current?.click()}
                                    onPickPhotos={() => fileInputRef.current?.click()}
                                    onPickVideos={() => videoInputRef.current?.click()}
                                    onPickFiles={() => docInputRef.current?.click()}
                                    webSearch={webSearch}
                                    onToggleWebSearch={onToggleWebSearch}
                                    memoryEnabled={memoryEnabled}
                                    onToggleMemory={onToggleMemory}
                                />
                            </div>

                            {/* Web Search Toggle Pill Button (Desktop only on input bar; kept in sheet on mobile) */}
                            <button
                                type="button"
                                onClick={onToggleWebSearch}
                                className={`hidden sm:flex h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-full border items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                                    webSearch 
                                        ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)]/40 text-[var(--color-deep-hanada)] dark:text-[var(--color-sky-haze)] shadow-[0_0_12px_rgba(32,184,205,0.2)]' 
                                        : 'bg-zinc-100/90 dark:bg-white/[0.06] border-zinc-300 dark:border-white/15 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                                title={webSearch ? "Web Search: ON (Using Tavily for live internet facts)" : "Web Search: OFF (Pure AI model knowledge)"}
                            >
                                <RiGlobalLine size={14} className={webSearch ? "text-[var(--accent-cyan)]" : "text-zinc-400 dark:text-zinc-500"} />
                                <span className="text-[11px] sm:text-xs">Web</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[var(--accent-cyan)] animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                            </button>

                            {/* AI Model Selector */}
                            <ModelSelectorDropdown
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                                compact={true}
                            />
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* Full-Screen Prompt Editor Button if text or code is long */}
                            {(input.length > 50 || input.includes('\n')) && (
                                <button
                                    type="button"
                                    onClick={() => setIsFullScreenEditor(true)}
                                    className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                                    title="Open full-screen prompt and code editor"
                                >
                                    <RiFullscreenLine size={16} />
                                </button>
                            )}

                            <button 
                                type="button"
                                onClick={handleToggleVoiceInput}
                                className={`p-1.5 sm:p-2 rounded-full transition-all cursor-pointer ${
                                    isListening 
                                        ? 'text-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/30' 
                                        : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                                title={isListening ? "Listening... Click to stop" : "Voice input (Speech to text)"}
                            >
                                {isListening ? <RiMicFill size={18} className="text-rose-500" /> : <RiMicLine size={18} />}
                            </button>
                            <button 
                                onClick={onSubmit}
                                disabled={!input.trim() && files.length === 0}
                                className={`px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 flex items-center justify-center rounded-full transition-all gap-1 text-xs font-bold ${
                                    input.trim() || files.length > 0 
                                        ? isResponding
                                            ? 'bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 shadow-md cursor-pointer'
                                            : 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 cursor-pointer' 
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 opacity-50 cursor-not-allowed'
                                }`}
                                title={isResponding ? "Add message to queue" : "Send message"}
                            >
                                {isResponding ? (
                                    <>
                                        <RiPlayListAddLine size={14} />
                                        <span>Queue</span>
                                    </>
                                ) : (
                                    <RiArrowUpLine size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Hidden file inputs for each type */}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
                    <input type="file" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" capture="environment" />
                    <input type="file" ref={videoInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" multiple />
                    <input type="file" ref={docInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md,.doc,.docx" multiple />

                </div>
            </div>

            {/* Full-Screen Prompt & Code Editor Studio via React Portal */}
            {isFullScreenEditor && typeof document !== 'undefined' && createPortal(
                <div 
                    data-lenis-prevent="true"
                    className={`fixed inset-0 ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-56'} z-[9980] bg-[#0c0d10] text-zinc-100 flex flex-col pointer-events-auto select-auto animate-in fade-in zoom-in-95 duration-200 border-l border-zinc-800/80 shadow-2xl transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {/* Studio Header */}
                    <div className="h-14 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#111216] shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                                {isCodeContent ? <RiCodeSSlashLine size={18} /> : <RiFileTextLine size={18} />}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">Full-Screen Prompt Studio</h3>
                                <p className="text-[11px] text-zinc-400 font-mono">
                                    {input.split('\n').length} lines • {input.length} characters {isCodeContent ? '• Code format preserved' : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {input && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInput('');
                                        dispatch(addToast({ message: "Prompt cleared", type: "info" }));
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(input);
                                    dispatch(addToast({ message: "Prompt copied to clipboard!", type: "info" }));
                                }}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                            >
                                Copy
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFullScreenEditor(false)}
                                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                                title="Exit full-screen mode"
                            >
                                <RiFullscreenExitLine size={16} />
                                <span>Done</span>
                            </button>
                        </div>
                    </div>

                    {/* Textarea Area */}
                    <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col min-h-0 bg-[#0c0d10]">
                        <textarea
                            autoFocus
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                triggerBlobTyping();
                            }}
                            onKeyDown={handleKeyDown}
                            spellCheck={!isCodeContent}
                            style={{ whiteSpace: 'pre-wrap', tabSize: 2, MozTabSize: 2 }}
                            placeholder={isResponding ? "Add a follow-up or code snippet to queue..." : "Type or paste your prompt, code or instructions..."}
                            className="w-full flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm sm:text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 custom-scrollbar p-2"
                        />
                    </div>

                    {/* Live Voice Captioning Stream in Studio */}
                    {isListening && (
                        <div className="mx-4 sm:mx-6 mb-2 px-3.5 py-2 rounded-xl bg-zinc-900/95 border border-[var(--accent-cyan)]/40 text-white shadow-xl backdrop-blur-md flex items-center gap-3">
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="w-1 h-3 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:0ms]" />
                                <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:150ms]" />
                                <span className="w-1 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:300ms]" />
                                <span className="w-1 h-4 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:450ms]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-[var(--color-sky-haze)] uppercase tracking-wider block">Live Voice Caption</span>
                                <p className="text-[13px] text-zinc-100 font-medium truncate italic mt-0.5">
                                    {liveCaption || 'Listening to your voice... Speak now'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleVoiceInput}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer shrink-0"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {/* Rich Bottom Toolbar Options (Attach, Web Search, Models, Mic, Queue/Send) */}
                    <div className="border-t border-zinc-800/80 bg-[#111216] px-4 sm:px-6 py-3 shrink-0 flex flex-col gap-2.5">
                        {/* Attachments Preview Strip */}
                        <AttachmentPreviewStrip files={files} onRemove={removeFile} />

                        <div className="flex items-center justify-between gap-2">
                            {/* Left Side Actions */}
                            <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                                {/* Attach Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsUploadMenuOpen(true)}
                                    className="w-8.5 h-8.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                                    title="Add to chat (Photos, Videos, Files, Memory)"
                                    aria-label="Add to chat"
                                >
                                    <RiAddLine size={18} className="shrink-0" />
                                </button>

                                {/* Web Search Toggle */}
                                <button
                                    type="button"
                                    onClick={onToggleWebSearch}
                                    className={`h-8.5 px-3 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                                        webSearch 
                                            ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)]/40 text-[var(--color-sky-haze)] shadow-[0_0_12px_rgba(32,184,205,0.2)]' 
                                            : 'bg-white/[0.06] border-white/15 text-zinc-400 hover:text-zinc-200'
                                    }`}
                                    title={webSearch ? "Web Search: ON (Using Tavily for live internet facts)" : "Web Search: OFF (Pure AI model knowledge)"}
                                >
                                    <RiGlobalLine size={14} className={webSearch ? "text-[var(--accent-cyan)]" : "text-zinc-400"} />
                                    <span className="text-xs">Web</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[var(--accent-cyan)] animate-pulse' : 'bg-zinc-600'}`} />
                                </button>

                                {/* Model Selector */}
                                <ModelSelectorDropdown
                                    selectedModel={selectedModel}
                                    onModelChange={onModelChange}
                                    compact={true}
                                    placement="top"
                                />
                            </div>

                            {/* Right Side Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Microphone Button */}
                                <button
                                    type="button"
                                    onClick={handleToggleVoiceInput}
                                    className={`p-2 rounded-full transition-all cursor-pointer ${
                                        isListening 
                                            ? 'text-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/30' 
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                                    }`}
                                    title={isListening ? "Listening... Click to stop" : "Voice input (Speech to text)"}
                                >
                                    {isListening ? <RiMicFill size={19} className="text-rose-500" /> : <RiMicLine size={19} />}
                                </button>

                                {/* Send / Queue Button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        setIsFullScreenEditor(false);
                                        onSubmit(e);
                                    }}
                                    disabled={!input.trim() && files.length === 0}
                                    className={`px-4 py-2 h-9 flex items-center justify-center rounded-full transition-all gap-1.5 text-xs font-bold ${
                                        input.trim() || files.length > 0 
                                            ? isResponding
                                                ? 'bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 shadow-md cursor-pointer'
                                                : 'bg-white text-black hover:bg-zinc-200 shadow-lg hover:scale-105 cursor-pointer' 
                                            : 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
                                    }`}
                                    title={isResponding ? "Add message to queue" : "Send message"}
                                >
                                    {isResponding ? (
                                        <>
                                            <RiPlayListAddLine size={15} />
                                            <span>Queue</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send</span>
                                            <RiArrowUpLine size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default FollowUpInput;
