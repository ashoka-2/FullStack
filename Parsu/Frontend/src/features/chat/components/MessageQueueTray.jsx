import React, { useState } from 'react';
import { 
    RiStopCircleLine, 
    RiTimeLine, 
    RiEditLine, 
    RiDeleteBinLine, 
    RiAttachment2, 
    RiCpuLine, 
    RiArrowRightLine,
    RiLoader4Line,
    RiArrowUpSLine,
    RiArrowDownSLine
} from '@remixicon/react';

/**
 * MessageQueueTray
 * Shows queued messages while AI is responding, allows user to edit/delete queued messages,
 * supports minimize/maximize toggle, and provides a Stop Generating button to cancel current AI output.
 */
export default function MessageQueueTray({ 
    queue = [], 
    onEditQueuedMessage, 
    onDeleteQueuedMessage, 
    isResponding = false,
    onStopGenerating 
}) {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isResponding && (!queue || queue.length === 0)) return null;

    return (
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 mb-2 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">
            {/* Top Bar: Responding Indicator + Stop Generation Button */}
            {isResponding && (
                <div className="flex items-center justify-between gap-3 px-4 py-2 mb-2 rounded-2xl bg-[#fafafa]/95 dark:bg-[var(--bg-surface)]/95 border border-zinc-200/80 dark:border-white/10 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                            AI is generating response...
                        </span>
                        {queue.length > 0 && (
                            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                {queue.length} in queue
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {queue.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                                title={isMinimized ? "Expand queue list" : "Minimize queue list"}
                            >
                                <span>{isMinimized ? "Expand Queue" : "Minimize"}</span>
                                {isMinimized ? <RiArrowDownSLine size={14} /> : <RiArrowUpSLine size={14} />}
                            </button>
                        )}

                        {onStopGenerating && (
                            <button
                                type="button"
                                onClick={onStopGenerating}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                title="Stop current AI response"
                            >
                                <RiStopCircleLine size={15} />
                                <span>Stop Responding</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* If not responding but queue has items, show simple header with minimize toggle */}
            {!isResponding && queue.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                        <RiTimeLine size={14} className="text-cyan-500" />
                        <span>Queued Messages ({queue.length})</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <span>{isMinimized ? "Show" : "Hide"}</span>
                        {isMinimized ? <RiArrowDownSLine size={14} /> : <RiArrowUpSLine size={14} />}
                    </button>
                </div>
            )}

            {/* Queue List Cards (visible when not minimized) */}
            {queue.length > 0 && !isMinimized && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                    {queue.map((item, index) => (
                        <div 
                            key={item.id || index}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#171819]/95 border border-cyan-500/30 dark:border-cyan-500/20 shadow-sm backdrop-blur-md transition-all"
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {index + 1}
                                </span>
                                
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                        {item.text || "Attached files query"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                                        {item.files?.length > 0 && (
                                            <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                                <RiAttachment2 size={11} />
                                                {item.files.length} file(s)
                                            </span>
                                        )}
                                        {item.model?.name && (
                                            <span className="flex items-center gap-1 text-cyan-500">
                                                <RiCpuLine size={11} />
                                                {item.model.name}
                                            </span>
                                        )}
                                        <span>• Next in line</span>
                                    </div>
                                </div>
                            </div>

                            {/* Queue Item Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => onEditQueuedMessage(item, index)}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                                    title="Edit prompt"
                                >
                                    <RiEditLine size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeleteQueuedMessage(index, item)}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                    title="Delete from queue"
                                >
                                    <RiDeleteBinLine size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
