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
  RiNotification3Line,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiDeleteBinLine,
  RiSunLine,
  RiMoonClearLine,
  RiApps2Line,
  RiCloseLine,
  RiShieldUserLine,
  RiGhostLine,
  RiPushpin2Fill,
  RiPencilLine,
  RiCheckLine,
  RiSideBarLine
} from '@remixicon/react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { setUser } from '../auth/auth.slice';
import ParsuLogo from './ParsuLogo';
import { useChat } from '../chat/hook/useChat';
import { useAuth } from '../auth/hook/useAuth';
import { toggleSidebarCollapse } from '../chat/chat.slice';
import { SidebarSkeleton } from '../chat/components/Skeletons';
import ConfirmationModal from './ConfirmationModal';
import { RiLoginCircleLine, RiSparkling2Line } from '@remixicon/react';
import { triggerBlobSidebarNav, triggerBlobChatSelect, triggerBlobChatDeleteHover, triggerBlobChatDeleted } from '../../utils/blobReactions';
import { renameChat, togglePinChat } from '../auth/service/settings.api';
import { addToast } from '../../utils/toast.slice';

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
  // Incognito mode — chats won't be saved
  const [incognito, setIncognito] = useState(() => localStorage.getItem('parsu_incognito') === '1');
  // Per-item inline rename state: { id, val }
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  // Local pin overrides for optimistic UI
  const [pinnedIds, setPinnedIds] = useState({});
  const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);

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
    { icon: ParsuLogo, label: 'Search', path: '/ai', active: location.pathname === '/' || location.pathname === '/ai', isProtected: false },
    { icon: RiHistoryLine, label: 'Chats', path: '/library', active: location.pathname === '/library', isProtected: true },
    { icon: RiApps2Line, label: 'Social Hub', path: '/social-connections', active: location.pathname === '/social-connections', isProtected: true },
    { icon: RiSettings4Line, label: 'Settings', path: '/settings', active: location.pathname.startsWith('/settings'), isProtected: true },
    ...(user?.role === 'admin' ? [{ icon: RiShieldUserLine, label: 'Admin Portal', path: '/admin', active: location.pathname.startsWith('/admin'), isProtected: true }] : []),
  ];

  const handleNavClick = (e, item) => {
    if (item.isProtected && !user) {
      e.preventDefault();
      navigate('/auth');
    }
  };

  // Keyboard shortcut to toggle sidebar collapse (Ctrl+\ or Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        data-lenis-prevent="true"
        className={`fixed top-0 left-0 z-[9990] h-[100dvh] flex flex-col bg-[#0B0B0B] text-zinc-400 transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 border-r border-white/[0.08] shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isSidebarCollapsed ? 'w-[280px] xs:w-[290px] p-3 sm:p-3.5 lg:w-16 lg:px-2 lg:py-3' : 'w-[280px] xs:w-[290px] lg:w-56 p-3 sm:p-3.5'}`}
      >
        {/* Sidebar Header: Brand Mark, Name & Controls */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-between lg:justify-center' : 'justify-between'} px-1 pt-0.5 pb-3 mb-2 border-b border-white/[0.08] shrink-0`}>
          {/* Logo & Brand text (shown on mobile, or on desktop when expanded) */}
          <Link
            to={user ? "/ai" : "/"}
            onClick={closeMobileSidebar}
            className={`flex items-center gap-2 group cursor-pointer overflow-hidden ${isSidebarCollapsed ? 'lg:hidden' : 'flex'}`}
          >
            <ParsuLogo className="w-6 h-6 text-[var(--accent-cyan)] group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-extrabold text-[16px] sm:text-[17px] tracking-tight text-white">
                PARSU
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider text-black bg-[var(--accent-cyan)] shadow-xs">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Toggle Button when collapsed (centered in the 64px rail) */}
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapse())}
              className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <RiSideBarLine size={19} />
            </button>
          )}

          {/* Desktop Collapse Button when expanded */}
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapse())}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
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
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Close navigation"
            aria-label="Close navigation"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-3">
          {menuItems.map((item, idx) => (
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
                ${item.active ? 'bg-[#1F1F1F] text-white border border-white/[0.08] shadow-xs' : 'text-zinc-400 hover:bg-[#171717] hover:text-white'}`}
            >
              <item.icon size={19} className={`shrink-0 ${item.active ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
              <span className={`${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3 truncate`}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* New Chat + Incognito Row */}
        <div className={`flex ${isSidebarCollapsed ? 'flex-row lg:flex-col lg:items-center' : 'flex-row'} gap-1.5 mb-3`}>
          <button
            onMouseEnter={() => triggerBlobSidebarNav('new chat')}
            onClick={() => {
              triggerBlobSidebarNav('new chat');
              closeMobileSidebar();
              if (!user) { navigate('/auth'); return; }
              navigate('/ai');
            }}
            title="New Chat"
            className={`${isSidebarCollapsed ? 'flex-1 px-3 py-2 lg:flex-none lg:w-10 lg:h-10 lg:p-0 lg:justify-center' : 'flex-1 px-3 py-2'} flex items-center gap-2 rounded-xl bg-[#171717] hover:bg-[#222222] border border-white/[0.08] text-white transition-all group cursor-pointer text-left text-sm font-medium`}
          >
            <RiAddLine size={19} className="text-zinc-400 group-hover:text-white shrink-0" />
            <span className={`${isSidebarCollapsed ? 'block lg:hidden' : 'block'}`}>New Chat</span>
          </button>

          {/* Incognito toggle */}
          <button
            title={incognito ? 'Incognito ON — chats not saved' : 'Enable Incognito'}
            onClick={() => {
              const next = !incognito;
              setIncognito(next);
              localStorage.setItem('parsu_incognito', next ? '1' : '0');
              window.dispatchEvent(new CustomEvent('parsu_incognito_change', { detail: next }));
            }}
            className={[
              `flex items-center justify-center ${isSidebarCollapsed ? 'w-9 h-9 lg:w-10 lg:h-10' : 'w-9 h-9'} rounded-xl transition-all cursor-pointer shrink-0`,
              incognito
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : 'text-zinc-400 hover:bg-white/[0.08] hover:text-white'
            ].join(' ')}
          >
            <RiGhostLine size={17} />
          </button>
        </div>

        {/* Incognito active banner (full width in expanded mode or mobile) */}
        {incognito && (
          <div className={`mx-1 mb-3 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 ${isSidebarCollapsed ? 'block lg:hidden' : 'block'}`}>
            <RiGhostLine size={13} className="text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-purple-400">Incognito active</span>
          </div>
        )}

        {/* Recent Section (expanded mode & mobile) */}
        <div className={`flex-1 overflow-hidden flex flex-col min-h-0 ${isSidebarCollapsed ? 'block lg:hidden' : 'flex'}`}>
          <div className="px-3 mb-2 shrink-0">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Recent</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4 pr-1">
            {!user ? (
              <div className="p-3 mx-1 my-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center shadow-2xs">
                <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">Sign in to save and access your past chats.</p>
                <Link 
                  to="/auth" 
                  onClick={closeMobileSidebar}
                  className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 rounded-lg bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs hover:bg-[var(--accent-cyan-hover)] transition-all cursor-pointer"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            ) : loading && chats.length === 0 ? (
              <SidebarSkeleton />
            ) : (
              <>
                {isCreating && (
                    <div className="px-3 py-1.5 animate-pulse">
                        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
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
                  <div key={thread._id} className="group flex items-center gap-1">
                    {isThisRenaming ? (
                      // Inline rename mode
                      <div className="flex-1 flex items-center gap-1 px-2 py-1"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              if (renameVal.trim() && renameVal.trim() !== thread.title) {
                                try { await renameChat(thread._id, renameVal.trim()); }
                                catch { dispatch(addToast({ type: 'error', message: 'Rename failed' })); }
                              }
                              setRenamingId(null);
                            }
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 min-w-0 bg-zinc-800 border border-[var(--accent-cyan)]/50 rounded-md px-1.5 py-0.5 text-[12px] text-zinc-100 focus:outline-none"
                        />
                        <button onClick={async () => {
                          if (renameVal.trim() && renameVal.trim() !== thread.title) {
                            try { await renameChat(thread._id, renameVal.trim()); }
                            catch { dispatch(addToast({ type: 'error', message: 'Rename failed' })); }
                          }
                          setRenamingId(null);
                        }} className="p-0.5 text-emerald-400 cursor-pointer"><RiCheckLine size={13} /></button>
                      </div>
                    ) : (
                      <Link
                        to={`/chat/${thread._id}`}
                        onMouseEnter={() => triggerBlobChatSelect()}
                        onClick={() => { triggerBlobChatSelect(); closeMobileSidebar(); }}
                        className={`flex-1 flex items-center gap-1.5 text-left px-3 py-1.5 rounded-lg text-[13px] truncate transition-all font-medium cursor-pointer
                        ${location.pathname === `/chat/${thread._id}` ? 'text-white bg-[#1F1F1F] shadow-xs border border-white/[0.08]' : 'text-zinc-400 hover:text-white hover:bg-[#171717]'}`}
                      >
                        {isThisPinned && <RiPushpin2Fill size={10} className="text-[var(--accent-cyan)] shrink-0" />}
                        <span className="truncate">{thread.title || 'Untitled Chat'}</span>
                      </Link>
                    )}

                    {/* Per-item action buttons — visible on hover */}
                    {!isThisRenaming && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        {/* Pin */}
                        <button
                          title={isThisPinned ? 'Unpin' : 'Pin'}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await togglePinChat(thread._id);
                              setPinnedIds(prev => ({ ...prev, [thread._id]: !isThisPinned }));
                            } catch { /* silent fail */ }
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${isThisPinned ? 'text-[var(--accent-cyan)]' : 'text-zinc-500 hover:text-[var(--accent-cyan)]'}`}
                        >
                          <RiPushpin2Fill size={12} />
                        </button>
                        {/* Rename */}
                        <button
                          title="Rename"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameVal(thread.title || '');
                            setRenamingId(thread._id);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-white cursor-pointer transition-colors"
                        >
                          <RiPencilLine size={12} />
                        </button>
                        {/* Delete */}
                        <button
                          onMouseEnter={() => triggerBlobChatDeleteHover()}
                          onClick={() => { triggerBlobChatDeleteHover(); setTargetId(thread._id); setModalType('delete'); }}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <RiHistoryLine size={19} />
            </Link>
          </div>
        )}

        {/* Footer Area */}
        <div className="mt-auto space-y-2 pt-2.5 pb-4 sm:pb-2 border-t border-white/[0.08] shrink-0">
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'px-3 lg:px-0 lg:justify-center' : 'px-3 justify-start'} py-2 rounded-xl hover:bg-white/[0.06] transition-all group cursor-pointer`}
          >
            {theme === 'dark' ? (
                <>
                  <RiSunLine size={18} className="text-zinc-400 group-hover:text-amber-400 shrink-0" />
                  <span className={`text-sm font-medium ${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3`}>Light Mode</span>
                </>
            ) : (
                <>
                  <RiMoonClearLine size={18} className="text-zinc-400 group-hover:text-indigo-400 shrink-0" />
                  <span className={`text-sm font-medium ${isSidebarCollapsed ? 'block lg:hidden' : 'block'} ml-3`}>Dark Mode</span>
                </>
            )}
          </button>

          {/* User Profile or Guest Login CTA */}
          {user ? (
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-between px-2 lg:px-0 lg:justify-center' : 'justify-between px-2'} pb-1`}>
              <Link 
                to="/settings"
                title={`Profile & Settings (${user?.username || 'User'})`}
                className="flex items-center gap-2 group max-w-[140px] cursor-pointer"
              >
                {user?.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt={user.username} 
                    className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {user?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <span className={`text-xs font-bold text-zinc-200 truncate group-hover:text-[var(--accent-cyan)] transition-colors ${isSidebarCollapsed ? 'block lg:hidden' : 'block'}`}>
                  {user?.username || 'User'}
                </span>
              </Link>
              <div className={`items-center gap-2 ${isSidebarCollapsed ? 'flex lg:hidden' : 'flex'}`}>
                <RiNotification3Line size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
                <button
                  onClick={handleLogout}
                  className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer p-1"
                  title="Logout"
                >
                  <RiLogoutBoxRLine size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className={`${isSidebarCollapsed ? 'px-1 lg:p-0 lg:flex lg:justify-center' : 'px-1'} pb-1`}>
              <Link
                to="/auth"
                title="Log In / Sign Up"
                className={`${isSidebarCollapsed ? 'w-full py-2 px-3 lg:w-10 lg:h-10 lg:p-0' : 'w-full py-2 px-3'} flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs hover:bg-[var(--accent-cyan-hover)] transition-all cursor-pointer`}
              >
                <RiLoginCircleLine size={16} />
                <span className={isSidebarCollapsed ? 'block lg:hidden' : 'block'}>Sign In</span>
              </Link>
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

      {/* Mobile Drawer Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-[9985] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Close navigation backdrop"
      />
    </>
  );
};

export default Sidebar;
