import React from 'react';
import { 
    RiAddLine, 
    RiUploadCloudLine, 
    RiLinksLine, 
    RiMicLine, 
    RiArrowUpLine, 
    RiCloseLine, 
    RiAttachment2,
    RiFileTextLine
} from '@remixicon/react';

const FollowUpInput = ({ 
    input, 
    setInput, 
    onSubmit,
    files, 
    removeFile, 
    isUploadMenuOpen, 
    setIsUploadMenuOpen, 
    setIsLinkInputOpen, 
    isLinkInputOpen, 
    linkInput, 
    setLinkInput, 
    handleAddLink, 
    fileInputRef, 
    handleFileUpload 
}) => {

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                // Let the browser insert a newline
                return;
            }
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <div className="absolute bottom-0 left-0 w-full lg:pl-56 bg-linear-to-t from-[#050505] via-[#050505]/95 to-transparent z-40 pb-6 md:pb-8 pointer-events-none transition-all">
            <div className="max-w-fluid mx-auto px-4 md:px-6 pointer-events-auto">
                <div className="w-full bg-[#121212] border border-[#2d2e2e] focus-within:border-zinc-700 rounded-[28px] px-6 py-4 transition-all duration-300 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
                    
                    {/* File Pills */}
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 animate-in slide-in-from-bottom-2">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-white/5 rounded-xl">
                                    {file.isLink ? <RiAttachment2 size={12} className="text-[#60A6AF]" /> : <RiFileTextLine size={12} className="text-[#60A6AF]" />}
                                    <span className="text-[11px] font-bold text-zinc-400 truncate max-w-[120px]">{file.name}</span>
                                    <RiCloseLine size={14} className="text-zinc-700 hover:text-red-400 cursor-pointer ml-1" onClick={() => removeFile(i)} />
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea 
                        rows="1"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up"
                        className="w-full bg-transparent border-none outline-none text-zinc-100 text-[18px] md:text-[20px] placeholder:text-zinc-600 font-medium py-1 resize-none min-h-[40px] max-h-[160px] custom-scrollbar mb-3"
                    />

                    <div className="flex items-center justify-between">
                        {/* Left Side Actions */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-[13px] font-bold transition-all border border-transparent hover:border-zinc-700"
                                >
                                    <RiAddLine size={18} />
                                    <span>Attach</span>
                                </button>
                                
                                {isUploadMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-4 w-56 bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                                        <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 text-zinc-300 text-[13px] font-bold transition-all group">
                                            <RiUploadCloudLine size={18} className="text-zinc-500 group-hover:text-[#60A6AF]" />
                                            <span>Upload file</span>
                                        </button>
                                        <button onClick={() => { setIsLinkInputOpen(true); setIsUploadMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 text-zinc-300 text-[13px] font-bold transition-all group">
                                            <RiLinksLine size={18} className="text-zinc-500 group-hover:text-[#60A6AF]" />
                                            <span>Add link</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-zinc-600 hover:text-zinc-100 transition-colors">
                                <RiMicLine size={20} />
                            </button>
                            <button 
                                onClick={onSubmit}
                                disabled={!input.trim() && files.length === 0}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${input.trim() || files.length > 0 ? 'bg-white text-black shadow-lg' : 'bg-zinc-800 text-zinc-600 opacity-50'}`}
                            >
                                <RiArrowUpLine size={20} />
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />

                    {isLinkInputOpen && (
                        <form onSubmit={handleAddLink} className="mt-4 border-t border-zinc-900/50 pt-4 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                                <RiLinksLine size={18} className="text-[#60A6AF]" />
                                <input autoFocus value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="Paste link..." className="bg-transparent border-none outline-none text-zinc-100 text-sm flex-1 font-medium" />
                                <RiCloseLine size={20} className="text-zinc-500 hover:text-white cursor-pointer" onClick={() => setIsLinkInputOpen(false)} />
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowUpInput;
