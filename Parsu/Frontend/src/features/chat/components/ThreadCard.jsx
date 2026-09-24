import React from 'react';
import { Link } from 'react-router';
import { RiShareLine } from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { triggerBlobChatSelect, triggerBlobChatDeleteHover } from '../../../utils/blobReactions';
import { DeleteButton } from '../../Components/rare-ui/DeleteButton';

const ThreadCard = ({ thread, viewMode, onDelete }) => {
    const handleConfirmDelete = () => {
        triggerBlobChatDeleteHover();
        if (onDelete) {
            onDelete(thread.id);
        }
    };

    if (viewMode === 'grid') {
        return (
            <Link 
                to={`/chat/${thread.id}`}
                onMouseEnter={() => triggerBlobChatSelect()}
                onClick={() => triggerBlobChatSelect()}
                className="group flex flex-col p-5 bg-white dark:bg-[var(--bg-primary)] border border-zinc-200/90 dark:border-white/5 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/10 shadow-2xs transition-all text-left relative"
            >
                <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">
                        {thread.date}
                    </div>
                    {/* Rare-UI Animated Delete Button */}
                    <div
                        className="relative z-10 shrink-0"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onMouseEnter={() => triggerBlobChatDeleteHover()}
                    >
                        <DeleteButton
                            className="h-8.5 rounded-xl"
                            onConfirm={handleConfirmDelete}
                        />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[var(--color-clear-hanada)] transition-colors line-clamp-1 mb-2">
                    {thread.title}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-2">
                    {thread.desc}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-zinc-200/60 dark:border-zinc-900/50 pt-4 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="flex -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-teal-600 border border-[#050505]" />
                        <div className="w-5 h-5 rounded-full bg-emerald-600 border border-[#050505]" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Thread History</span>
                </div>
            </Link>
        );
    }

    return (
        <Link 
            to={`/chat/${thread.id}`}
            onMouseEnter={() => triggerBlobChatSelect()}
            onClick={() => triggerBlobChatSelect()}
            className="group flex items-center justify-between p-4 bg-white dark:bg-[var(--bg-primary)] border border-zinc-200/90 dark:border-white/5 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/10 shadow-2xs transition-all cursor-pointer gap-3"
        >
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-[var(--color-clear-hanada)] transition-colors shrink-0">
                    <ParsuLogo size={18} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-[var(--color-clear-hanada)] transition-colors">{thread.title}</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">{thread.date} · Thread</p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button 
                    type="button"
                    className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer hidden sm:block" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    title="Share chat"
                >
                    <RiShareLine size={18} />
                </button>

                {/* Rare-UI Animated Delete Button */}
                <div
                    className="relative z-10 shrink-0"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onMouseEnter={() => triggerBlobChatDeleteHover()}
                >
                    <DeleteButton
                        className="h-8.5 rounded-xl"
                        onConfirm={handleConfirmDelete}
                    />
                </div>
            </div>
        </Link>
    );
};

export default ThreadCard;
