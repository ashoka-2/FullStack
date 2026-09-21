import React from 'react';
import { 
    RiCloseLine, 
    RiFilePdfLine, 
    RiFileTextLine, 
    RiFileWordLine,
    RiVideoLine, 
    RiImageLine, 
    RiCodeSSlashLine, 
    RiAttachment2 
} from '@remixicon/react';

/**
 * Format bytes into human readable string (KB, MB)
 */
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * AttachmentPreviewStrip
 * Renders small preview cards above the chat input field for images, videos, documents, and code.
 */
export default function AttachmentPreviewStrip({ files = [], onRemove }) {
    if (!files || files.length === 0) return null;

    return (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 custom-scrollbar animate-in slide-in-from-bottom-2 duration-200">
            {files.map((file, index) => {
                const name = file.name || 'File';
                const lower = name.toLowerCase();
                const isImage = lower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/) || file.type?.startsWith('image/');
                const isVideo = lower.match(/\.(mp4|webm|mov|avi|mkv)$/) || file.type?.startsWith('video/');
                const isPdf = lower.endsWith('.pdf');
                const isDoc = lower.match(/\.(doc|docx)$/);
                const isCode = lower.match(/\.(js|jsx|ts|tsx|py|html|css|json|sql|java|cpp|c|go|rs|php|rb|sh)$/);

                // Create a temporary object URL for local image preview
                let previewSrc = file.previewUrl || file.url;
                if (!previewSrc && file.fileObject && isImage) {
                    try {
                        previewSrc = URL.createObjectURL(file.fileObject);
                    } catch (e) {
                        previewSrc = null;
                    }
                }

                return (
                    <div 
                        key={index}
                        className="relative group shrink-0 transition-transform duration-150 hover:scale-[1.02]"
                    >
                        {/* ─── 1. Image Thumbnail Preview ─── */}
                        {isImage && previewSrc ? (
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-white/10 shadow-sm bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <img 
                                    src={previewSrc} 
                                    alt={name} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white bg-black/60 px-1 py-0.5 rounded truncate backdrop-blur-xs text-center">
                                    {name}
                                </span>
                            </div>
                        ) : isVideo ? (
                            /* ─── 2. Video Preview Card ─── */
                            <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-2xl overflow-hidden border border-purple-500/30 dark:border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/30 p-2 flex flex-col justify-between shadow-sm">
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                    <RiVideoLine size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
                                    {file.fileObject?.size && (
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400">{formatBytes(file.fileObject.size)}</p>
                                    )}
                                </div>
                            </div>
                        ) : isPdf ? (
                            /* ─── 3. PDF Document Card ─── */
                            <div className="relative w-32 h-16 sm:w-36 sm:h-20 rounded-2xl overflow-hidden border border-red-500/30 dark:border-red-500/20 bg-red-500/5 dark:bg-red-950/25 p-2.5 flex flex-col justify-between shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                        <RiFilePdfLine size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">PDF</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={name}>{name}</p>
                                    {file.fileObject?.size && (
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">{formatBytes(file.fileObject.size)}</p>
                                    )}
                                </div>
                            </div>
                        ) : isDoc ? (
                            /* ─── 4. Word Document Card ─── */
                            <div className="relative w-32 h-16 sm:w-36 sm:h-20 rounded-2xl overflow-hidden border border-blue-500/30 dark:border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/25 p-2.5 flex flex-col justify-between shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                        <RiFileWordLine size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">DOC</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={name}>{name}</p>
                                    {file.fileObject?.size && (
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">{formatBytes(file.fileObject.size)}</p>
                                    )}
                                </div>
                            </div>
                        ) : isCode ? (
                            /* ─── 5. Code Snippet Card ─── */
                            <div className="relative w-28 h-16 sm:w-32 sm:h-20 rounded-2xl overflow-hidden border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/25 p-2.5 flex flex-col justify-between shadow-sm">
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <RiCodeSSlashLine size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Code</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
                                    {file.fileObject?.size && (
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">{formatBytes(file.fileObject.size)}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ─── 6. Generic File Card ─── */
                            <div className="relative w-28 h-16 sm:w-32 sm:h-20 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800/60 p-2.5 flex flex-col justify-between shadow-sm">
                                <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                    <RiFileTextLine size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">File</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
                                    {file.fileObject?.size && (
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">{formatBytes(file.fileObject.size)}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Remove (X) Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(index);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900/90 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer z-10"
                            title="Remove attachment"
                        >
                            <RiCloseLine size={13} className="stroke-[2.5]" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
