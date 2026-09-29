import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
  RiSideBarLine,
  RiEditBoxLine,
  RiShareLine,
  RiCheckLine,
  RiVoiceprintLine,
  RiSpyLine,
  RiSparkling2Line
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { toggleSidebarCollapse } from '../chat.slice';
import { addToast } from '../../../utils/toast.slice';

/**
 * Main AI Chatbot Navbar — styled faithfully to ChatGPT's header design.
 * Features:
 * - Left: Mobile drawer toggle / Desktop sidebar collapse toggle + Instant New Chat button + Parsu AI brand
 * - Center: Conversation title (truncated) or Temporary Chat pill
 * - Right: ChatGPT-style Share pill button + Jarvis Voice Agent mode + Guest Auth buttons
 */
export default function ChatNavbar({
  onOpenSidebar,
  title,
  chatId,
  onShare,
  onOpenVoice,
  showVoiceButton = true,
  showShareButton = true
}) {
  const { user } = useSelector(state => state.auth);
  const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isCopied, setIsCopied] = useState(false);
  const [incognito] = useState(() => localStorage.getItem('parsu_incognito') === '1');

  const handleShareClick = () => {
    if (onShare) {
      onShare();
      return;
    }

    if (!chatId) {
      dispatch(addToast({ type: 'info', message: 'Send a message first to generate a shareable link.' }));
      return;
    }

    const shareUrl = `${window.location.origin}/chat/${chatId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        dispatch(addToast({ type: 'success', message: 'Chat link copied to clipboard!' }));
        setTimeout(() => setIsCopied(false), 2500);
      }).catch(() => {
        dispatch(addToast({ type: 'error', message: 'Failed to copy link' }));
      });
    }
  };

  const handleNewChat = () => {
    navigate('/ai');
  };

  return (
    <header className="h-14 bg-white/80 dark:bg-[#0B0B0B]/80 backdrop-blur-md shrink-0 z-30 border-b border-zinc-200/80 dark:border-white/[0.07] px-3 sm:px-5 flex items-center justify-between transition-colors select-none">
      
      {/* ── Left Section: Sidebar Toggle + New Chat + Brand ── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        
        {/* Mobile Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <RiSideBarLine size={19} />
        </button>

        {/* Desktop Sidebar Toggle when rail is collapsed */}
        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={() => dispatch(toggleSidebarCollapse())}
            className="hidden lg:flex p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <RiSideBarLine size={19} />
          </button>
        )}

        {/* New Chat Button (ChatGPT-style icon) */}
        <button
          type="button"
          onClick={handleNewChat}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0"
          title="New chat"
          aria-label="New chat"
        >
          <RiEditBoxLine size={18} />
        </button>

        {/* ChatGPT-style Brand Pill */}
        <Link
          to={user ? "/ai" : "/"}
          className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer group shrink-0"
        >
          <ParsuLogo size={20} className="text-zinc-900 dark:text-white group-hover:scale-105 transition-transform shrink-0" />
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">Parsu</span>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[var(--accent-cyan)] text-zinc-950 shadow-2xs">
            AI
          </span>
        </Link>
      </div>

      {/* ── Center Section: Conversation Title or Temporary Chat Pill ── */}
      <div className="flex-1 flex items-center justify-center px-2 min-w-0 max-w-[480px]">
        {incognito ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-in fade-in">
            <RiSpyLine size={14} className="shrink-0" />
            <span className="truncate">Temporary Chat</span>
          </div>
        ) : title ? (
          <h1 
            className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate max-w-full text-center tracking-tight"
            title={title}
          >
            {title}
          </h1>
        ) : null}
      </div>

      {/* ── Right Section: Share Button + Voice Mode + Auth ── */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Share Button (ChatGPT-style pill) */}
        {showShareButton && (
          <button
            type="button"
            onClick={handleShareClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
              isCopied
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-white/10'
            }`}
            title="Share chat link"
            aria-label="Share chat"
          >
            {isCopied ? <RiCheckLine size={14} className="shrink-0 text-emerald-500" /> : <RiShareLine size={14} className="shrink-0 text-zinc-500 dark:text-zinc-400" />}
            <span className="hidden xs:inline">{isCopied ? 'Copied!' : 'Share'}</span>
          </button>
        )}

        {/* Voice Agent Button (Jarvis mode) */}
        {showVoiceButton && onOpenVoice && (
          <button
            type="button"
            onClick={onOpenVoice}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[var(--accent-cyan)] hover:brightness-110 active:scale-95 text-zinc-950 flex items-center justify-center transition-all cursor-pointer shadow-md shadow-[var(--accent-cyan)]/25 shrink-0"
            title="Start voice mode — Jarvis agent"
            aria-label="Voice mode"
          >
            <RiVoiceprintLine size={16} />
          </button>
        )}

        {/* Guest Auth Buttons if logged out */}
        {!user && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/auth"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=register"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-cyan)] text-zinc-950 hover:bg-[var(--accent-cyan-hover)] transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>Sign up</span>
              <RiSparkling2Line size={13} />
            </Link>
          </div>
        )}
      </div>

    </header>
  );
}
