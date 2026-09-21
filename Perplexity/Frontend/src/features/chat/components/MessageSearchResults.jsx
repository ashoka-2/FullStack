import React from 'react';
import { RiMessage2Line, RiHistoryLine } from '@remixicon/react';
import { useNavigate } from 'react-router';

// Renders chat messages matched from global search query
const MessageSearchResults = ({ searchQuery, isSearchingGlobal, globalSearchResults }) => {
    const navigate = useNavigate();

    // Hide section if query is empty
    if (!searchQuery?.trim()) return null;

    return (
        <div className="mt-16 border-t border-zinc-200 dark:border-white/5 pt-10">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <RiMessage2Line className="text-[#60A6AF]" /> Inside Messages
            </h2>
            
            {isSearchingGlobal ? (
                <div className="text-sm font-medium text-zinc-500 animate-pulse">Searching message contents on server...</div>
            ) : globalSearchResults.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {globalSearchResults.map(msg => (
                        <button
                            key={msg._id}
                            // Direct jump to message via URL hash
                            onClick={() => navigate(`/chat/${msg.chat}#msg-${msg._id}`)}
                            className="flex flex-col text-left p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl hover:border-[#60A6AF]/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-all group w-full overflow-hidden"
                        >
                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 w-full truncate">
                                <RiHistoryLine size={12} className="group-hover:text-[#60A6AF] transition-colors shrink-0" />
                                From: {msg.chatTitle}
                            </span>
                            <p className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200 leading-[1.6] line-clamp-3 break-words whitespace-pre-wrap w-full">
                                {msg.content}
                            </p>
                            <span className="text-[10px] text-zinc-400 mt-4 font-semibold opacity-70 block w-full">
                                {new Date(msg.createdAt).toLocaleDateString()}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-zinc-500 text-sm font-medium bg-zinc-50 dark:bg-[#121212] p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/50">
                    No exact conversation sentences found matching "{searchQuery}".
                </div>
            )}
        </div>
    );
};

export default MessageSearchResults;
