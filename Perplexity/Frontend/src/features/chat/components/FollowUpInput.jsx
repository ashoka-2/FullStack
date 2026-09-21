import { 
    RiAddLine, 
    RiUploadCloudLine, 
    RiMicLine, 
    RiArrowUpLine, 
    RiCloseLine, 
    RiAttachment2,
    RiFileTextLine,
    RiImageLine,
    RiVideoLine,
    RiFilePdfLine,
    RiPlayListAddLine,
    RiExpandUpDownLine,
    RiContractUpDownLine,
    RiCodeSSlashLine
} from '@remixicon/react';
import ModelSelectorDropdown from './ModelSelectorDropdown';
import AttachmentPreviewStrip from './AttachmentPreviewStrip';
import MessageQueueTray from './MessageQueueTray';
import { triggerBlobInteraction, triggerBlobTyping } from '../../../utils/blobReactions';
import { useRef, useState, useEffect } from 'react';

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
    onDeleteQueuedMessage
}) => {
    // Separate refs for each file type
    const videoInputRef = useRef(null);
    const docInputRef = useRef(null);

    // Textarea resizing & code formatting state
    const textareaRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);

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

    // Auto-grow textarea with content up to threshold or expanded height
    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        const targetMin = isExpanded ? 240 : 44;
        const targetMax = isExpanded ? 520 : 240;
        const scrollH = textareaRef.current.scrollHeight;
        const nextH = Math.min(Math.max(scrollH, targetMin), targetMax);
        textareaRef.current.style.height = `${nextH}px`;
    }, [input, isExpanded]);

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
        if (file.isLink) return <RiAttachment2 size={12} className="text-[#60A6AF]" />;
        const name = file.name?.toLowerCase() || '';
        if (name.match(/\.(mp4|webm|mov|avi|mkv)$/)) return <RiVideoLine size={12} className="text-purple-400" />;
        if (name.match(/\.(pdf)$/)) return <RiFilePdfLine size={12} className="text-red-400" />;
        if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return <RiImageLine size={12} className="text-emerald-400" />;
        return <RiFileTextLine size={12} className="text-[#60A6AF]" />;
    };

    return (
        <div className="absolute bottom-0 left-0 w-full lg:pl-56 bg-gradient-to-t from-[#f4f5f7] dark:from-[#050505] via-[#f4f5f7]/95 dark:via-[#050505]/95 to-transparent z-40 pb-6 md:pb-8 pointer-events-none transition-all flex flex-col justify-end">
            {/* Queued Messages Tray & Stop Generating */}
            <MessageQueueTray 
                queue={queue}
                isResponding={isResponding}
                onStopGenerating={onStopGenerating}
                onEditQueuedMessage={onEditQueuedMessage}
                onDeleteQueuedMessage={onDeleteQueuedMessage}
            />

            <div className="max-w-[800px] mx-auto px-4 md:px-6 pointer-events-auto w-full">
                <div className="w-full bg-white dark:bg-[#121212] border border-zinc-200/90 dark:border-[#2d2e2e] focus-within:border-zinc-300 dark:focus-within:border-zinc-700 rounded-[28px] px-6 py-4 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
                    
                    {/* Rich Attachment Preview Strip */}
                    <AttachmentPreviewStrip files={files} onRemove={removeFile} />

                    {/* Multi-line or Code Information & Quick Expand Header */}
                    {(isCodeContent || (input && input.split('\n').length > 2)) && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 select-none animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                                {isCodeContent && (
                                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#20b8cd]/15 text-[#148393] dark:text-[#5ce1f2] border border-[#20b8cd]/25">
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
                                onClick={() => setIsExpanded(prev => !prev)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-[#20b8cd] hover:text-[#1892a3] dark:hover:text-[#6ee6f5] transition-colors cursor-pointer"
                                title={isExpanded ? "Collapse input size" : "Expand input size to see and edit full prompt"}
                            >
                                {isExpanded ? (
                                    <>
                                        <RiContractUpDownLine size={13} />
                                        <span>Collapse size</span>
                                    </>
                                ) : (
                                    <>
                                        <RiExpandUpDownLine size={13} />
                                        <span>Expand size</span>
                                    </>
                                )}
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
                        className={`w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 custom-scrollbar mb-3 py-1 transition-all resize-y ${
                            isCodeContent 
                                ? 'font-mono text-[14px] md:text-[15px] leading-relaxed' 
                                : 'font-sans font-medium text-[18px] md:text-[20px]'
                        } ${
                            isExpanded ? 'min-h-[220px] md:min-h-[280px] max-h-[75vh]' : 'min-h-[44px] max-h-[240px]'
                        } cursor-text`}
                    />

                    <div className="flex items-center justify-between">
                        {/* Left Side Actions */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 text-[13px] font-bold transition-all border border-zinc-200 dark:border-transparent dark:hover:border-zinc-700"
                                >
                                    <RiAddLine size={18} />
                                    <span>Attach</span>
                                </button>
                                
                                {isUploadMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-4 w-56 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">
                                        {/* Upload Photo */}
                                        <button 
                                            onClick={() => { fileInputRef.current.click(); setIsUploadMenuOpen(false); }} 
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold transition-all group cursor-pointer"
                                        >
                                            <RiImageLine size={18} className="text-emerald-400 group-hover:text-emerald-300" />
                                            <span>Upload Photo</span>
                                        </button>
                                        {/* Upload Video */}
                                        <button 
                                            onClick={() => { videoInputRef.current.click(); setIsUploadMenuOpen(false); }} 
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold transition-all group cursor-pointer"
                                        >
                                            <RiVideoLine size={18} className="text-purple-400 group-hover:text-purple-300" />
                                            <span>Upload Video</span>
                                        </button>
                                        {/* Upload Document */}
                                        <button 
                                            onClick={() => { docInputRef.current.click(); setIsUploadMenuOpen(false); }} 
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold transition-all group cursor-pointer"
                                        >
                                            <RiFilePdfLine size={18} className="text-red-400 group-hover:text-red-300" />
                                            <span>Upload Document</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <ModelSelectorDropdown
                                selectedModel={selectedModel}
                                onModelChange={onModelChange}
                            />
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            {/* Increase/Decrease Input Size Toggle Button */}
                            <button 
                                type="button"
                                onClick={() => setIsExpanded(prev => !prev)}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${
                                    isExpanded 
                                        ? 'text-[#20b8cd] bg-[#20b8cd]/15 dark:bg-[#20b8cd]/25' 
                                        : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                                title={isExpanded ? "Collapse input height" : "Expand input height to view full code/prompt"}
                            >
                                {isExpanded ? <RiContractUpDownLine size={18} /> : <RiExpandUpDownLine size={18} />}
                            </button>

                            <button className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-100 transition-colors">
                                <RiMicLine size={20} />
                            </button>
                            <button 
                                onClick={onSubmit}
                                disabled={!input.trim() && files.length === 0}
                                className={`px-3 py-1.5 h-9 flex items-center justify-center rounded-full transition-all gap-1.5 text-xs font-bold ${
                                    input.trim() || files.length > 0 
                                        ? isResponding
                                            ? 'bg-[#20b8cd] hover:bg-[#1ca6b9] text-zinc-950 shadow-md cursor-pointer'
                                            : 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 cursor-pointer' 
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 opacity-50 cursor-not-allowed'
                                }`}
                                title={isResponding ? "Add message to queue" : "Send message"}
                            >
                                {isResponding ? (
                                    <>
                                        <RiPlayListAddLine size={15} />
                                        <span>Queue</span>
                                    </>
                                ) : (
                                    <RiArrowUpLine size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Hidden file inputs for each type */}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
                    <input type="file" ref={videoInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" multiple />
                    <input type="file" ref={docInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md,.doc,.docx" multiple />

                </div>
            </div>
        </div>
    );
};

export default FollowUpInput;
