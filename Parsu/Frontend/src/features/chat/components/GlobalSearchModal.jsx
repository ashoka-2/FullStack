import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import {
  RiSearchLine,
  RiCloseLine,
  RiMessage2Line,
  RiHistoryLine,
  RiArrowRightLine,
  RiLoader4Line,
  RiChat1Line
} from '@remixicon/react';
import { useChat } from '../hook/useChat';

/**
 * GlobalSearchModal
 * Spotlight-style search modal for searching both conversations and message contents.
 * Opens from the sidebar "Search" button or via Cmd+K / Ctrl+K shortcut.
 */
export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [globalMessageResults, setGlobalMessageResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const chats = useSelector(state => state.chat.chats || []);
  const user = useSelector(state => state.auth.user);
  const { handleSearchMessagesGlobally } = useChat();

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setGlobalMessageResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global Cmd+K shortcut and Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter local chats matching query instantly
  const matchedChats = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return chats.filter(chat => {
      const titleMatch = chat.title?.toLowerCase().includes(trimmed);
      const firstMsgMatch = chat.messages?.[0]?.content?.toLowerCase().includes(trimmed);
      return titleMatch || firstMsgMatch;
    }).slice(0, 8);
  }, [chats, query]);

  // Debounced search for deep message contents
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !user) {
      setGlobalMessageResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const results = await handleSearchMessagesGlobally(trimmed);
        setGlobalMessageResults(Array.isArray(results) ? results.slice(0, 10) : []);
      } catch (err) {
        setGlobalMessageResults([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, user]);

  if (!isOpen) return null;

  const handleSelectChat = (chatId) => {
    onClose();
    navigate(`/chat/${chatId}`);
  };

  const handleSelectMessage = (chatId, messageId) => {
    onClose();
    navigate(`/chat/${chatId}#msg-${messageId}`);
  };

  const hasAnyResults = matchedChats.length > 0 || globalMessageResults.length > 0;
  const isQueryActive = Boolean(query.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
    >
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      />

      {/* Spotlight Search Dialog */}
      <div
        className="relative w-full max-w-2xl bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-zinc-200/80 dark:border-white/[0.08] shrink-0">
          <RiSearchLine size={20} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, topics, or message contents..."
            className="flex-1 bg-transparent text-sm sm:text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />

          {isSearchingGlobal && (
            <RiLoader4Line size={18} className="animate-spin text-[var(--accent-cyan)] shrink-0" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title="Clear search"
            >
              <RiCloseLine size={18} />
            </button>
          )}

          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar space-y-4">
          {!isQueryActive ? (
            <div className="py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-400 dark:text-zinc-500">
                <RiSearchLine size={22} />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Quick Search</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Type keywords to find conversation titles, past solutions, or exact sentences saved in your history.
              </p>
            </div>
          ) : !hasAnyResults && !isSearchingGlobal ? (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No results found</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                No conversations or messages matched "{query}".
              </p>
            </div>
          ) : (
            <>
              {/* Matched Conversations */}
              {matchedChats.length > 0 && (
                <div>
                  <div className="px-2 mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <RiHistoryLine size={13} className="text-[var(--accent-cyan)]" />
                    <span>Conversations ({matchedChats.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedChats.map(chat => (
                      <button
                        key={chat._id}
                        type="button"
                        onClick={() => handleSelectChat(chat._id)}
                        className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200/70 dark:border-white/[0.06] transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-zinc-200/60 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 group-hover:text-[var(--accent-cyan)] transition-colors">
                            <RiChat1Line size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[var(--accent-cyan)] transition-colors">
                              {chat.title || 'Untitled Conversation'}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {chat.messages?.[0]?.content || 'Chat session'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white shrink-0">
                          <span className="text-[10px] text-zinc-400 hidden sm:inline">
                            {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString() : ''}
                          </span>
                          <RiArrowRightLine size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Inside Messages */}
              {globalMessageResults.length > 0 && (
                <div>
                  <div className="px-2 mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <RiMessage2Line size={13} className="text-purple-400" />
                    <span>Inside Messages ({globalMessageResults.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {globalMessageResults.map(msg => (
                      <button
                        key={msg._id}
                        type="button"
                        onClick={() => handleSelectMessage(msg.chat, msg._id)}
                        className="w-full flex flex-col p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200/70 dark:border-white/[0.06] transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 w-full">
                          <span className="truncate max-w-[70%] font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-[var(--accent-cyan)] transition-colors">
                            {msg.chatTitle || 'Chat'}
                          </span>
                          <span className="text-[10px]">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                          {msg.content}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-[#0E0E0E] border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
          <span>Navigate with click or tap</span>
          <span className="hidden sm:inline">Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}
