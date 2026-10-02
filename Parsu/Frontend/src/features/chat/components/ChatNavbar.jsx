import React, { useState } from 'react';
import { Link } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
  RiMenuLine,
  RiShareLine,
  RiCheckLine,
  RiSpyLine,
  RiSparkling2Line,
  RiArrowLeftLine,
  RiAddLine
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { CircleButton, PillGroup, PillBadge } from '../../Components/PillButton';
import PrimaryButton from '../../Components/PrimaryButton';
import { addToast } from '../../../utils/toast.slice';

/**
 * Main AI Chatbot Navbar — styled faithfully to ChatGPT's header design.
 * Features:
 * - Left: Clean Parsu AI brand pill (+ optional back navigation)
 * - Center: Conversation title (truncated) or Temporary Chat pill
 * - Right: Custom action slot + ChatGPT-style Share pill + Guest Auth / Profile + Mobile New Chat
 */
export default function ChatNavbar({
  onOpenSidebar,
  title,
  chatId,
  onShare,
  showShareButton = true,
  backLink,
  backText,
  rightSlot
}) {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

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

  return (
    <header className="h-14 bg-transparent shrink-0 z-30 border-b border-zinc-200/50 dark:border-white/[0.06] px-3.5 sm:px-6 flex items-center justify-between transition-colors select-none">
      
      {/* ── Left Section: Mobile Menu Icon / Desktop Brand Pill & Back Link ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        
        {/* On mobile: If both menu and back button exist, show both in a unified PillGroup */}
        {backLink ? (
          <PillGroup className="lg:hidden">
            <CircleButton
              onClick={onOpenSidebar}
              title="Open menu"
              ariaLabel="Open menu"
            >
              <RiMenuLine size={17} />
            </CircleButton>
            <CircleButton
              to={backLink}
              title={backText ? `Back to ${backText}` : 'Back'}
              ariaLabel={backText ? `Back to ${backText}` : 'Back'}
            >
              <RiArrowLeftLine size={17} />
            </CircleButton>
          </PillGroup>
        ) : (
          /* On mobile: Standalone circular menu button */
          <CircleButton
            onClick={onOpenSidebar}
            className="lg:hidden"
            title="Open menu"
            ariaLabel="Open menu"
          >
            <RiMenuLine size={18} className="shrink-0" />
          </CircleButton>
        )}

        {/* On desktop: Back button if present (clean circular icon button, no redundant text) */}
        {backLink && (
          <CircleButton
            to={backLink}
            className="hidden lg:flex"
            title={backText ? `Back to ${backText}` : 'Back'}
            ariaLabel={backText ? `Back to ${backText}` : 'Back'}
          >
            <RiArrowLeftLine size={17} />
          </CircleButton>
        )}

        {/* On desktop: Parsu AI Brand Pill */}
        <Link
          to={user ? "/ai" : "/"}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-300/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-100/80 dark:bg-white/[0.05] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer group shrink-0"
          title="Parsu AI"
        >
          <ParsuLogo size={18} className="text-zinc-900 dark:text-white group-hover:scale-105 transition-transform shrink-0" />
          <span className="font-bold text-xs tracking-tight text-zinc-900 dark:text-white">Parsu</span>
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--accent-cyan)] text-zinc-950 shadow-2xs">
            AI
          </span>
        </Link>
      </div>

      {/* ── Center Section: Conversation Title or Temporary Chat Pill ── */}
      <div className="flex-1 flex items-center justify-center px-2 min-w-0">
        {incognito ? (
          <PillBadge variant="purple" title="Temporary Chat">
            <RiSpyLine size={14} className="shrink-0" />
            <span className="truncate">Temporary Chat</span>
          </PillBadge>
        ) : title ? (
          <PillBadge
            className="max-w-[85vw] sm:max-w-[420px]"
            title={typeof title === 'string' ? title : ''}
          >
            <h1 className="text-xs sm:text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate tracking-tight text-center">
              {title}
            </h1>
          </PillBadge>
        ) : null}
      </div>

      {/* ── Right Section: Custom Slot + Share Button + Guest Auth + Mobile New Chat ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* Optional Right Action Slot (e.g. Create Post or Status pills) */}
        {rightSlot}

        {/* Share Button (PillBadge) */}
        {showShareButton && (
          <PillBadge
            onClick={handleShareClick}
            variant={isCopied ? 'emerald' : 'default'}
            className="cursor-pointer font-semibold py-1.5 px-3"
            title="Share chat link"
          >
            {isCopied ? (
              <RiCheckLine size={14} className="shrink-0 text-emerald-500" />
            ) : (
              <RiShareLine size={14} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
            )}
            <span className="hidden xs:inline">{isCopied ? 'Copied!' : 'Share'}</span>
          </PillBadge>
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
            <PrimaryButton
              to="/auth?mode=register"
              size="xs"
              icon={RiSparkling2Line}
              iconPosition="right"
            >
              Sign up
            </PrimaryButton>
          </div>
        )}

        {/* On mobile: New Chat button at the far right end */}
        <CircleButton
          to="/ai"
          className="lg:hidden"
          title="New Chat"
          ariaLabel="New Chat"
        >
          <RiAddLine size={18} className="shrink-0" />
        </CircleButton>
      </div>

    </header>
  );
}
