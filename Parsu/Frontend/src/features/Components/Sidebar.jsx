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
  RiCloseLine
} from '@remixicon/react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { setUser } from '../auth/auth.slice';
import ParsuLogo from './ParsuLogo';
import { useChat } from '../chat/hook/useChat';
import { useAuth } from '../auth/hook/useAuth';
import { SidebarSkeleton } from '../chat/components/Skeletons';
import ConfirmationModal from './ConfirmationModal';
import { RiLoginCircleLine, RiSparkling2Line } from '@remixicon/react';
import { triggerBlobSidebarNav, triggerBlobChatSelect, triggerBlobChatDeleteHover, triggerBlobChatDeleted } from '../../utils/blobReactions';

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
    { icon: ParsuLogo, label: 'Search', path: '/', active: location.pathname === '/', isProtected: false },
    { icon: RiHistoryLine, label: 'Chats', path: '/library', active: location.pathname === '/library', isProtected: true },
    { icon: RiApps2Line, label: 'Social Hub', path: '/social-connections', active: location.pathname === '/social-connections', isProtected: true },
    { icon: RiSettings4Line, label: 'Settings', path: '/settings', active: location.pathname === '/settings', isProtected: true },
  ];

  const handleNavClick = (e, item) => {
    if (item.isProtected && !user) {
      e.preventDefault();
      navigate('/auth');
    }
  };

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
        className={`fixed top-0 left-0 z-[9990] w-[280px] xs:w-[290px] lg:w-56 h-[100dvh] flex flex-col bg-[#ebecee] dark:bg-[#070809] text-zinc-600 dark:text-zinc-400 p-3 sm:p-3.5 transition-transform duration-300 ease-in-out shrink-0 border-r border-zinc-300/70 dark:border-white/5 shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header: Brand Mark, Name & Mobile Close Button */}
        <div className="flex items-center justify-between px-1.5 pt-0.5 pb-3 mb-2 border-b border-zinc-300/70 dark:border-zinc-800/80 shrink-0">
          <Link
            to="/"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <ParsuLogo className="w-6 h-6 text-[#20b8cd] group-hover:scale-105 transition-transform shrink-0" />
            <span className="font-bold text-[16px] sm:text-[17px] tracking-tight text-zinc-900 dark:text-white">
              Parsu
            </span>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Close navigation"
            aria-label="Close navigation"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-4">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              onMouseEnter={() => triggerBlobSidebarNav(item.label)}
              onClick={(e) => {
                triggerBlobSidebarNav(item.label);
                handleNavClick(e, item);
                closeMobileSidebar();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer
                ${item.active ? 'bg-white dark:bg-[#1a1a1a] text-zinc-950 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-transparent' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-[#121212] hover:text-zinc-950 dark:hover:text-zinc-200'}`}
            >
              <item.icon size={18} className={item.active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* New Chat Button */}
        <button 
          onMouseEnter={() => triggerBlobSidebarNav('new chat')}
          onClick={() => {
            triggerBlobSidebarNav('new chat');
            closeMobileSidebar();
            if (!user) {
              navigate('/auth');
              return;
            }
            navigate('/');
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-[#1a1a1a] transition-all group mb-4 cursor-pointer text-left"
        >
          <RiAddLine size={18} className="text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
          <span className="text-sm font-medium">New Chat</span>
        </button>

        {/* Recent Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-3 mb-2 shrink-0">
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Recent</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4 pr-1">
            {!user ? (
              <div className="p-3 mx-1 my-2 rounded-xl bg-white/70 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5 text-center shadow-2xs">
                <p className="text-[11px] text-zinc-500 mb-2 leading-relaxed">Sign in to save and access your past chats.</p>
                <Link 
                  to="/auth" 
                  onClick={closeMobileSidebar}
                  className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 rounded-lg bg-[#20b8cd] text-zinc-950 font-bold text-xs hover:bg-[#1da9bc] transition-all cursor-pointer"
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
                {chats.slice(0, 10).map((thread) => (
                  <div key={thread._id} className="group flex items-center gap-1">
                    <Link
                      to={`/chat/${thread._id}`}
                      onMouseEnter={() => triggerBlobChatSelect()}
                      onClick={() => {
                        triggerBlobChatSelect();
                        closeMobileSidebar();
                      }}
                      className={`flex-1 block text-left px-3 py-1.5 rounded-lg text-[13px] truncate transition-all font-medium cursor-pointer
                      ${location.pathname === `/chat/${thread._id}` ? 'text-zinc-950 dark:text-zinc-100 bg-white dark:bg-[#1a1a1a] shadow-xs border border-zinc-200/80 dark:border-transparent' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-[#121212]'}`}
                    >
                      {thread.title || 'Untitled Chat'}
                    </Link>
                    <button 
                      onMouseEnter={() => triggerBlobChatDeleteHover()}
                      onClick={() => {
                        triggerBlobChatDeleteHover();
                        setTargetId(thread._id);
                        setModalType('delete');
                      }}
                      className="p-1 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-all shrink-0 cursor-pointer"
                    >
                      <RiDeleteBinLine size={14} />
                    </button>
                  </div>
                ))}
                {chats.length > 0 && (
                  <Link
                    to="/library"
                    onClick={closeMobileSidebar}
                    className="px-3 py-1.5 text-[11px] font-bold text-[#60A6AF] hover:text-[#60A6AF]/80 uppercase tracking-wider block w-fit transition-colors cursor-pointer"
                  >
                    View All
                  </Link>
                )}
                {chats.length === 0 && !loading && (
                  <div className="px-3 py-2 text-[11px] text-zinc-600">No recent chats</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto space-y-2.5 pt-2.5 pb-5 sm:pb-2 border-t border-zinc-300/70 dark:border-zinc-800/80 shrink-0">
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-[#1a1a1a] transition-all group cursor-pointer"
          >
            {theme === 'dark' ? (
                <>
                  <RiSunLine size={18} className="text-zinc-500 group-hover:text-amber-400" />
                  <span className="text-sm font-medium">Light Mode</span>
                </>
            ) : (
                <>
                  <RiMoonClearLine size={18} className="text-zinc-500 group-hover:text-indigo-400" />
                  <span className="text-sm font-medium">Dark Mode</span>
                </>
            )}
          </button>

          {/* User Profile or Guest Login CTA */}
          {user ? (
            <div className="flex items-center justify-between px-2 pb-1">
              <Link 
                to="/settings"
                title="Profile & Settings"
                className="flex items-center gap-2 group max-w-[140px] cursor-pointer"
              >
                {user?.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt={user.username} 
                    className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {user?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate group-hover:text-[#20b8cd] transition-colors">
                  {user?.username || 'User'}
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <RiNotification3Line size={16} className="text-zinc-600 hover:text-zinc-300 cursor-pointer" />
                <button
                  onClick={handleLogout}
                  onMouseEnter={() => {
                    window.dispatchEvent(
                      new CustomEvent('blob_trigger_mood', {
                        detail: {
                          mood: 'sad',
                          speech: "Please don't go! 🥺 Stay with me...",
                          revert: false
                        }
                      })
                    );
                  }}
                  onMouseLeave={() => {
                    window.dispatchEvent(
                      new CustomEvent('blob_trigger_mood', {
                        detail: {
                          mood: 'happy',
                          speech: "Yay! Let's build and create something awesome! ✨🚀",
                          duration: 4000,
                          celebrate: true,
                          revert: true
                        }
                      })
                    );
                  }}
                  className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <RiLogoutBoxRLine size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-1 pb-1">
              <Link
                to="/auth"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#20b8cd] to-[#1da9bc] text-zinc-950 font-bold text-xs shadow-md shadow-[#20b8cd]/15 hover:opacity-95 transition-all transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <RiLoginCircleLine size={15} />
                <span>Log In / Sign Up</span>
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
