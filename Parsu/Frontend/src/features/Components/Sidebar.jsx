import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import {
  RiSearchLine,
  RiAddLine,
  RiLineChartLine,
  RiMoreFill,
  RiHistoryLine,
  RiCompass3Line,
  RiGlobalLine,
  RiSettings4Line,
  RiDeleteBinLine,
  RiSunLine,
  RiMoonClearLine,
  RiApps2Line,
  RiCloseLine,
  RiGhostLine,
  RiPushpin2Fill,
  RiPencilLine,
  RiCheckLine,
  RiSideBarLine
} from '@remixicon/react';
import gsap from 'gsap';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { setUser } from '../auth/auth.slice';
import ParsuLogo from './ParsuLogo';
import { useChat } from '../chat/hook/useChat';
import { useAuth } from '../auth/hook/useAuth';
import { toggleSidebarCollapse } from '../chat/chat.slice';
import { SidebarSkeleton } from '../chat/components/Skeletons';
import ConfirmationModal from './ConfirmationModal';
import PrimaryButton from './PrimaryButton';
import { RiLoginCircleLine, RiSparkling2Line } from '@remixicon/react';
import { triggerBlobSidebarNav, triggerBlobChatSelect, triggerBlobChatDeleteHover, triggerBlobChatDeleted } from '../../utils/blobReactions';
import { renameChat, togglePinChat } from '../auth/service/settings.api';
import { addToast } from '../../utils/toast.slice';
import GlobalSearchModal from '../chat/components/GlobalSearchModal';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const user = useSelector(state => state.auth.user);
  const chats = useSelector(state => state.chat.chats);
  const loading = useSelector(state => state.chat.loading);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { handleGetChats, handleDeleteChat, isCreating } = useChat();
  const { handleLogout } = useAuth();
  const [modalType, setModalType] = useState(null); // 'delete'
  const [targetId, setTargetId] = useState(null);
  // Incognito mode â€” chats won't be saved
  const [incognito, setIncognito] = useState(() => localStorage.getItem('parsu_incognito') === '1');
  // Per-item inline rename state: { id, val }
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  // Local pin overrides for optimistic UI
  const [pinnedIds, setPinnedIds] = useState({});
  // Mobile long-press action menu & modal rename states
  const [mobileActionThread, setMobileActionThread] = useState(null);
  const [renameModalThread, setRenameModalThread] = useState(null);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressActiveRef = useRef(false);

  // Clear long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleChatTouchStart = (thread, e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressActiveRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(40); } catch (_) {}
      }
      setMobileActionThread(thread);
    }, 450);
  };

  const handleChatTouchMove = (e) => {
    if (!longPressTimerRef.current) return;
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    // If movement exceeds 8px (scrolling), cancel long press
    if (dx > 8 || dy > 8) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleChatTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  const isFirstMount = useRef(true);

  // GSAP Smooth stagger reveal of inner items when mobile drawer opens
  useEffect(() => {
    if (window.innerWidth < 1024 && isOpen && drawerRef.current) {
      const items = drawerRef.current.querySelectorAll('.drawer-stagger-item');
      if (items.length > 0) {
        gsap.killTweensOf(items);
        gsap.fromTo(
          items,
          { opacity: 0, x: -14 },
          { opacity: 1, x: 0, duration: 0.32, stagger: 0.025, ease: 'power2.out', delay: 0.05 }
        );
      }
    }
  }, [isOpen]);

  // Helper to auto-close mobile drawer upon clicking any link or action
  const closeMobileSidebar = () => {
    if (typeof setIsOpen === 'function' && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Native View Transitions API for circular reveal animation
  const toggleTheme = (e) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    
    // Fallback: If browser lacks View Transitions support
    if (!document.startViewTransition) {
        setTheme(nextTheme);
        return;
    }

    // Set origin coordinates for expanding circular transition
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);

    document.startViewTransition(() => {
        // flushSync forces React state update synchronously for startViewTransition
        flushSync(() => {
            setTheme(nextTheme);
        });
    });
  };

  useEffect(() => {
    if (user) {
      handleGetChats();
    }
  }, [user]);

  const menuItems = [
    { icon: RiSearchLine, label: 'Search', action: 'search', isProtected: false },
    { icon: RiHistoryLine, label: 'Chats', path: '/library', active: location.pathname === '/library', isProtected: true },
    { icon: RiApps2Line, label: 'Social Hub', path: '/social-connections', active: location.pathname === '/social-connections', isProtected: true },
    { icon: RiSettings4Line, label: 'Settings', path: '/settings', active: location.pathname.startsWith('/settings'), isProtected: true },
  ];

  const handleNavClick = (e, item) => {
    if (item.isProtected && !user) {
      e.preventDefault();
      navigate('/auth');
    }
  };

  // Keyboard shortcut to toggle sidebar collapse (Ctrl+\ or Ctrl+B) or open search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.key.toLowerCase() === 'b')) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
        e.preventDefault();
        dispatch(toggleSidebarCollapse());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  // Touch swipe gesture handling for mobile navigation drawer
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, isValid: false });

  useEffect(() => {
    // Only active on mobile viewports (< 1024px)
    const handleTouchStart = (e) => {
      if (window.innerWidth >= 1024) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const target = e.target;

      // Exclusion: Ignore touches on inputs, textareas, buttons, selectors, or interactive elements
      if (
        target &&
        (target.closest('input, textarea, button, select, [contenteditable="true"], pre, code, [role="button"], .no-swipe') ||
         target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.tagName === 'BUTTON' ||
         target.tagName === 'SELECT')
      ) {
        touchStartRef.current.isValid = false;
        return;
      }

      // If drawer is closed: only trigger when starting from the left edge region (<= 75px)
      if (!isOpen && touch.clientX > 75) {
        touchStartRef.current.isValid = false;
        return;
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        isValid: true,
      };
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current.isValid) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      touchStartRef.current.isValid = false;

      // Ignore if vertical scrolling was the dominant motion
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.75) {
        return;
      }

      // Quick flick or substantial swipe distance
      const isQuickFlick = deltaTime < 400 && Math.abs(deltaX) > 40;
      const isLongSwipe = Math.abs(deltaX) > 65;

      if (isQuickFlick || isLongSwipe) {
        if (!isOpen && deltaX > 0) {
          // Swipe from left to right -> open drawer
          setIsOpen(true);
        } else if (isOpen && deltaX < 0) {
          // Swipe from right to left -> close drawer
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      <aside
        ref={drawerRef}
        data-lenis-prevent="true"
        className={`fixed top-0 left-0 z-[9990] h-[100dvh] flex flex-col bg-white dark:bg-[var(--bg-secondary)] text-zinc-600 dark:text-zinc-400 shrink-0 border-r border-zinc-200/80 dark:border-white/[0.08] shadow-2xl lg:shadow-none
          transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none lg:pointer-events-auto'}
          lg:translate-x-0
          ${isSidebarCollapsed ? 'w-[280px] xs:w-[290px] p-3 sm:p-3.5 lg:w-16 lg:px-2 lg:py-3' : 'w-[280px] xs:w-[290px] lg:w-56 p-3 sm:p-3.5'}`}
      >
        {/* Sidebar Header: Brand Mark, Name & Controls */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-between lg:justify-center' : 'justify-between'} px-1 pt-0.5 pb-3 mb-2 border-b border-zinc-200/80 dark:border-white/[0.08] shrink-0 drawer-stagger-item`}>
          {/* Logo & Brand text (shown on mobile, or on desktop when expanded) */}
          <Link
            to={user ? "/ai" : "/"}
            onClick={closeMobileSidebar}
            className={`flex items-center gap-2 group cursor-pointer overflow-hidden ${isSidebarCollapsed ? 'lg:hidden' : 'flex'}`}
          >
            <ParsuLogo className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-900 dark:text-white group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-extrabold text-[16px] sm:text-[17px] tracking-tight text-zinc-900 dark:text-white">
                PARSU
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider text-black bg-[var(--accent-cyan)] shadow-xs">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Toggle Button when collapsed: show Parsu logo by default, reveal sidebar open icon on hover */}
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapse())}
              className="hidden lg:flex relative w-10 h-10 rounded-xl items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer group"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              {/* Collapsed default state: Parsu logo */}
              <ParsuLogo size={22} className="text-zinc-900 dark:text-white group-hover:opacity-0 transition-opacity duration-150 absolute" />
              {/* On hover: Sidebar open icon */}
              <RiSideBarLine size={19} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-zinc-900 dark:text-white" />
            </button>
          )}

          {/* Desktop Collapse Button when expanded */}
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapse())}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <RiSideBarLine size={18} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Close navigation"
            aria-label="Close navigation"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-3 drawer-stagger-item">
          {menuItems.map((item, idx) => (
            item.action === 'search' ? (
              <button
                key={idx}
                type="button"
                title={item.label}
                onMouseEnter={() => triggerBlobSidebarNav(item.label)}
                onClick={() => {
                  triggerBlobSidebarNav(item.label);
                  closeMobileSidebar();
                  setIsSearchOpen(true);
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'px-3 lg:px-0 lg:justify-center' : 'px-3 justify-start'} py-2 rounded-xl transition-all duration-200 group cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[var(--bg-surface-hover)] hover:text-zinc-900 dark:hover:text-white`}
              >
                <item.icon size={19} className="shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                <span className={`${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3 truncate`}>{item.label}</span>
              </button>
            ) : (
              <Link
                key={idx}
                to={item.path}
                title={item.label}
                onMouseEnter={() => triggerBlobSidebarNav(item.label)}
                onClick={(e) => {
                  triggerBlobSidebarNav(item.label);
                  handleNavClick(e, item);
                  closeMobileSidebar();
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'px-3 lg:px-0 lg:justify-center' : 'px-3 justify-start'} py-2 rounded-xl transition-all duration-200 group cursor-pointer text-sm font-medium
                  ${item.active ? 'bg-zinc-100 dark:bg-[var(--bg-surface)] text-zinc-900 dark:text-white border border-zinc-200/90 dark:border-white/[0.08] shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[var(--bg-surface-hover)] hover:text-zinc-900 dark:hover:text-white'}`}
              >
                <item.icon size={19} className={`shrink-0 ${item.active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`} />
                <span className={`${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3 truncate`}>{item.label}</span>
              </Link>
            )
          ))}
        </nav>

        {/* New Chat + Incognito Row */}
        <div className={`flex ${isSidebarCollapsed ? 'flex-row lg:flex-col lg:items-center' : 'flex-row'} gap-1.5 mb-3 drawer-stagger-item`}>
          <button
            onMouseEnter={() => triggerBlobSidebarNav('new chat')}
            onClick={() => {
              triggerBlobSidebarNav('new chat');
              closeMobileSidebar();
              navigate('/ai');
            }}
            title="New Chat"
            className={`${isSidebarCollapsed ? 'flex-1 px-3 py-2 lg:flex-none lg:w-10 lg:h-10 lg:p-0 lg:justify-center' : 'flex-1 px-3 py-2'} flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-[var(--bg-surface)] hover:bg-zinc-200/70 dark:hover:bg-[var(--bg-surface-hover)] border border-zinc-200/90 dark:border-white/[0.08] text-zinc-900 dark:text-white transition-all group cursor-pointer text-left text-sm font-medium`}
          >
            <RiAddLine size={19} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white shrink-0" />
            <span className={`${isSidebarCollapsed ? 'block lg:hidden' : 'block'}`}>New Chat</span>
          </button>

          {/* Incognito toggle */}
          <button
            title={incognito ? 'Incognito ON â€” chats not saved' : 'Enable Incognito'}
            onClick={() => {
              const next = !incognito;
              setIncognito(next);
              localStorage.setItem('parsu_incognito', next ? '1' : '0');
              window.dispatchEvent(new CustomEvent('parsu_incognito_change', { detail: next }));
            }}
            className={[
              `flex items-center justify-center ${isSidebarCollapsed ? 'w-9 h-9 lg:w-10 lg:h-10' : 'w-9 h-9'} rounded-xl transition-all cursor-pointer shrink-0`,
              incognito
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:text-zinc-900 dark:hover:text-white'
            ].join(' ')}
          >
            <RiGhostLine size={17} />
          </button>
        </div>

        {/* Incognito active banner (full width in expanded mode or mobile) */}
        {incognito && (
          <div className={`mx-1 mb-3 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 ${isSidebarCollapsed ? 'block lg:hidden' : 'block'}`}>
            <RiGhostLine size={13} className="text-purple-500 dark:text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Incognito active</span>
          </div>
        )}

        {/* Recent Section (expanded mode & mobile) */}
        <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${isSidebarCollapsed ? 'block lg:hidden' : 'flex'} drawer-stagger-item`}>
          <div className="px-3 mb-2 shrink-0">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Recent</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4 pr-1">
            {!user ? (
              <div className="p-3 mx-1 my-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/90 dark:border-white/[0.08] text-center shadow-2xs">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">Sign in to save and access your past chats.</p>
                <PrimaryButton 
                  to="/auth" 
                  onClick={closeMobileSidebar}
                  size="xs"
                  fullWidth
                >
                  Sign In
                </PrimaryButton>
              </div>
            ) : loading && chats.length === 0 ? (
              <SidebarSkeleton />
            ) : (
              <>
                {isCreating && (
                    <div className="px-3 py-1.5 animate-pulse">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                    </div>
                )}
                {/* Sort pinned first */}
                {chats.slice(0, 10)
                  .slice()
                  .sort((a, b) => {
                    const ap = pinnedIds[a._id] !== undefined ? pinnedIds[a._id] : (a.isPinned || false);
                    const bp = pinnedIds[b._id] !== undefined ? pinnedIds[b._id] : (b.isPinned || false);
                    return (bp ? 1 : 0) - (ap ? 1 : 0);
                  })
                  .map((thread) => {
                  const isThisPinned = pinnedIds[thread._id] !== undefined ? pinnedIds[thread._id] : (thread.isPinned || false);
                  const isThisRenaming = renamingId === thread._id;
                  return (
                  <div key={thread._id} className="group relative flex items-center w-full">
                    {isThisRenaming ? (
                      // Inline rename mode
                      <div 
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800/90 border border-[var(--accent-cyan)]/60 rounded-xl"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                      >
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              if (renameVal.trim() && renameVal.trim() !== thread.title) {
                                try { 
                                  await renameChat(thread._id, renameVal.trim()); 
                                  handleGetChats();
                                  dispatch(addToast({ type: 'success', message: 'Chat renamed' }));
                                } catch { 
                                  dispatch(addToast({ type: 'error', message: 'Rename failed' })); 
                                }
                              }
                              setRenamingId(null);
                            }
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 min-w-0 bg-transparent text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none"
                        />
                        <button 
                          type="button"
                          onClick={async () => {
                            if (renameVal.trim() && renameVal.trim() !== thread.title) {
                              try { 
                                await renameChat(thread._id, renameVal.trim()); 
                                handleGetChats();
                                dispatch(addToast({ type: 'success', message: 'Chat renamed' }));
                              } catch { 
                                dispatch(addToast({ type: 'error', message: 'Rename failed' })); 
                              }
                            }
                            setRenamingId(null);
                          }} 
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md cursor-pointer transition-colors"
                          title="Save"
                        >
                          <RiCheckLine size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setRenamingId(null)} 
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                          title="Cancel"
                        >
                          <RiCloseLine size={14} />
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={`/chat/${thread._id}`}
                        onMouseEnter={() => triggerBlobChatSelect()}
                        onTouchStart={(e) => handleChatTouchStart(thread, e)}
                        onTouchMove={handleChatTouchMove}
                        onTouchEnd={handleChatTouchEnd}
                        onTouchCancel={handleChatTouchEnd}
                        onContextMenu={(e) => {
                          if (window.innerWidth < 1024) {
                            e.preventDefault();
                          }
                        }}
                        onClick={(e) => {
                          if (isLongPressActiveRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            isLongPressActiveRef.current = false;
                            return;
                          }
                          triggerBlobChatSelect();
                          closeMobileSidebar();
                        }}
                        style={{ WebkitTouchCallout: 'none' }}
                        className={`w-full flex items-start gap-2 text-left px-3 py-2 rounded-xl text-[13px] transition-all font-medium cursor-pointer select-none
                        ${location.pathname === `/chat/${thread._id}` 
                          ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-[var(--bg-surface)] shadow-xs border border-zinc-200/90 dark:border-white/[0.08]' 
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        {isThisPinned && (
                          <RiPushpin2Fill size={12} className="text-[var(--accent-cyan)] shrink-0 mt-0.5" />
                        )}
                        <span className="break-words whitespace-normal leading-snug flex-1">
                          {thread.title || 'Untitled Chat'}
                        </span>
                      </Link>
                    )}

                    {/* Per-item action buttons â€” visible on hover on desktop */}
                    {!isThisRenaming && (
                      <div className="hidden lg:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-150 absolute right-1.5 top-1.5 bg-white/95 dark:bg-[var(--bg-surface)]/95 backdrop-blur-md px-1 py-0.5 rounded-lg shadow-sm border border-zinc-200/80 dark:border-white/10 z-10 pointer-events-none group-hover:pointer-events-auto">
                        {/* Pin */}
                        <button
                          type="button"
                          title={isThisPinned ? 'Unpin' : 'Pin'}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await togglePinChat(thread._id);
                              setPinnedIds(prev => ({ ...prev, [thread._id]: !isThisPinned }));
                              dispatch(addToast({ type: 'success', message: isThisPinned ? 'Chat unpinned' : 'Chat pinned' }));
                            } catch { 
                              dispatch(addToast({ type: 'error', message: 'Failed to update pin' }));
                            }
                          }}
                          className={`p-1 rounded-md cursor-pointer transition-colors ${
                            isThisPinned 
                              ? 'text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10' 
                              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
                          }`}
                        >
                          <RiPushpin2Fill size={12} />
                        </button>
                        {/* Rename */}
                        <button
                          type="button"
                          title="Rename"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRenameVal(thread.title || '');
                            setRenamingId(thread._id);
                          }}
                          className="p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          <RiPencilLine size={12} />
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          onMouseEnter={() => triggerBlobChatDeleteHover()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerBlobChatDeleteHover();
                            setTargetId(thread._id);
                            setModalType('delete');
                          }}
                          className="p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <RiDeleteBinLine size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
                {chats.length > 0 && (
                  <Link
                    to="/library"
                    onClick={closeMobileSidebar}
                    className="px-3 py-1.5 text-[11px] font-bold text-[var(--accent-cyan)] hover:text-[var(--accent-cyan-hover)] uppercase tracking-wider block w-fit transition-colors cursor-pointer"
                  >
                    View All
                  </Link>
                )}
                {chats.length === 0 && !loading && (
                  <div className="px-3 py-2 text-[11px] text-zinc-500">No recent chats</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Collapsed Rail Shortcut to Library (desktop only) */}
        {isSidebarCollapsed && (
          <div className="hidden lg:flex flex-col items-center flex-1 py-2">
            <Link
              to="/library"
              title="Recent Chats (Library)"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <RiHistoryLine size={19} />
            </Link>
          </div>
        )}

        {/* Footer Area */}
        <div className="mt-auto space-y-2 pt-2.5 pb-4 sm:pb-2 border-t border-zinc-200/80 dark:border-white/[0.08] shrink-0 drawer-stagger-item">
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'px-3 lg:px-0 lg:justify-center' : 'px-3 justify-start'} py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all group cursor-pointer`}
          >
            {theme === 'dark' ? (
                <>
                  <RiSunLine size={18} className="text-zinc-400 group-hover:text-amber-400 shrink-0" />
                  <span className={`text-sm font-medium ${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3`}>Light Mode</span>
                </>
            ) : (
                <>
                  <RiMoonClearLine size={18} className="text-zinc-500 group-hover:text-indigo-600 shrink-0" />
                  <span className={`text-sm font-medium ${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3`}>Dark Mode</span>
                </>
            )}
          </button>

          {/* User Profile or Guest Login CTA */}
          {user ? (
            <div className={`flex items-center ${isSidebarCollapsed ? 'px-1 lg:p-0 lg:justify-center' : 'px-2'} pb-1`}>
              <Link 
                to="/settings"
                title={`Profile & Settings (${user?.username || 'User'})`}
                className="flex items-center gap-2 group w-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/[0.04] p-1.5 rounded-xl transition-colors"
              >
                {user?.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt={user.username} 
                    className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {user?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'block lg:hidden' : 'block'}`}>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-[var(--accent-cyan)] transition-colors">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Settings & Profile</p>
                </div>
              </Link>
            </div>
          ) : (
            <div className={`${isSidebarCollapsed ? 'px-1 lg:p-0 lg:flex lg:justify-center' : 'px-1'} pb-1`}>
              <PrimaryButton
                to="/auth"
                title="Log In / Sign Up"
                size="sm"
                fullWidth={!isSidebarCollapsed}
                icon={RiLoginCircleLine}
                iconPosition="left"
              >
                <span className={isSidebarCollapsed ? 'block lg:hidden' : 'block'}>Sign In</span>
              </PrimaryButton>
            </div>
          )}
        </div>
      </aside>

      <ConfirmationModal 
        isOpen={modalType === 'delete'}
        onClose={() => setModalType(null)}
        onConfirm={() => {
            if (targetId) {
              handleDeleteChat(targetId);
              triggerBlobChatDeleted();
            }
        }}
        title="Delete Chat"
        message="This chat session and its messages will be permanently deleted."
      />

      {/* Mobile Long-Press Action Sheet */}
      {mobileActionThread && (
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileActionThread(null)}
          />
          
          {/* Action Sheet Panel */}
          <div className="relative w-full bg-white dark:bg-[var(--bg-surface)] border-t border-zinc-200/90 dark:border-white/10 rounded-t-3xl p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 ease-out select-none">
            {/* Drag Handle Indicator */}
            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
            
            {/* Chat Title Header */}
            <div className="text-center mb-5 px-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                Chat Options
              </p>
              <h4 className="text-[14px] font-semibold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                {mobileActionThread.title || 'Untitled Chat'}
              </h4>
            </div>

            {/* Options List */}
            <div className="space-y-1.5">
              {/* Pin / Unpin Button */}
              {(() => {
                const isThisPinned = pinnedIds[mobileActionThread._id] !== undefined
                  ? pinnedIds[mobileActionThread._id]
                  : (mobileActionThread.isPinned || false);
                return (
                  <button
                    type="button"
                    onClick={async () => {
                      const threadId = mobileActionThread._id;
                      setMobileActionThread(null);
                      try {
                        await togglePinChat(threadId);
                        setPinnedIds(prev => ({ ...prev, [threadId]: !isThisPinned }));
                        dispatch(addToast({ type: 'success', message: isThisPinned ? 'Chat unpinned' : 'Chat pinned to top' }));
                      } catch {
                        dispatch(addToast({ type: 'error', message: 'Failed to update pin' }));
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] active:bg-zinc-100 dark:active:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 text-sm font-semibold transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-200/60 dark:bg-white/[0.06] flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
                      <RiPushpin2Fill size={18} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="block">{isThisPinned ? 'Unpin from Top' : 'Pin to Top'}</span>
                      <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                        {isThisPinned ? 'Remove from top of list' : 'Keep this chat at the top'}
                      </span>
                    </div>
                  </button>
                );
              })()}

              {/* Rename / Edit Button */}
              <button
                type="button"
                onClick={() => {
                  const thread = mobileActionThread;
                  setMobileActionThread(null);
                  setRenameModalThread(thread);
                  setRenameVal(thread.title || '');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] active:bg-zinc-100 dark:active:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 text-sm font-semibold transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-200/60 dark:bg-white/[0.06] flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                  <RiPencilLine size={18} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="block">Rename Chat</span>
                  <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                    Change the title of this conversation
                  </span>
                </div>
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  const threadId = mobileActionThread._id;
                  setMobileActionThread(null);
                  setTargetId(threadId);
                  setModalType('delete');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 active:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <RiDeleteBinLine size={18} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="block">Delete Chat</span>
                  <span className="text-[11px] font-normal text-red-500/80">
                    Permanently delete this chat
                  </span>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setMobileActionThread(null)}
              className="w-full mt-4 py-3 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 font-semibold text-sm active:bg-zinc-200 dark:active:bg-white/[0.1] transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rename Chat Modal (for mobile & desktop dialog use) */}
      {renameModalThread && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setRenameModalThread(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[var(--bg-surface)] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Rename Chat</h3>
              <button 
                type="button"
                onClick={() => setRenameModalThread(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RiCloseLine size={18} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const trimmed = renameVal.trim();
              if (trimmed && trimmed !== renameModalThread.title) {
                try {
                  await renameChat(renameModalThread._id, trimmed);
                  handleGetChats();
                  dispatch(addToast({ type: 'success', message: 'Chat renamed' }));
                } catch {
                  dispatch(addToast({ type: 'error', message: 'Failed to rename chat' }));
                }
              }
              setRenameModalThread(null);
            }}>
              <input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                placeholder="Enter chat title..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--accent-cyan)] transition-colors mb-5"
              />
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setRenameModalThread(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-cyan)] text-black font-bold text-sm hover:bg-[var(--accent-cyan-hover)] transition-colors shadow-sm cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay with Smooth Fade Transition */}
      <div
        ref={overlayRef}
        onClick={() => setIsOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-[9985] transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Close navigation backdrop"
      />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Sidebar;
