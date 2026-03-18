import React, { useState, useEffect } from 'react';
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
  RiMoonClearLine
} from '@remixicon/react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router';
import { setUser } from '../auth/auth.slice';
import PerplexityIcon from './PerplexityIcon';
import { useChat } from '../chat/hook/useChat';
import { useAuth } from '../auth/hook/useAuth';
import { SidebarSkeleton } from '../chat/components/Skeletons';
import ConfirmationModal from './ConfirmationModal';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const user = useSelector(state => state.auth.user);
  const chats = useSelector(state => state.chat.chats);
  const loading = useSelector(state => state.chat.loading);
  const location = useLocation();
  const dispatch = useDispatch();
  const { handleGetChats, handleDeleteChat, isCreating } = useChat();
  const { handleLogout } = useAuth();
  const [modalType, setModalType] = useState(null); // 'delete'
  const [targetId, setTargetId] = useState(null);

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

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    if (user) {
      handleGetChats();
    }
  }, [user]);

  const menuItems = [
    { icon: PerplexityIcon, label: 'Search', path: '/', active: location.pathname === '/' },
    { icon: RiHistoryLine, label: 'Chats', path: '/library', active: location.pathname === '/library' },
  ];

  const secondaryItems = [
    // { icon: RiLineChartLine, label: 'Finance', path: '/finance' },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-50 w-56 h-screen flex flex-col bg-zinc-50 dark:bg-[#050505] text-zinc-500 dark:text-zinc-400 p-3 transition-transform duration-300 ease-in-out shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end mb-2">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <RiSettings4Line className="rotate-45" size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-4">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                ${item.active ? 'bg-zinc-200 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#121212] hover:text-zinc-700 dark:hover:text-zinc-200'}`}
            >
              <item.icon size={18} className={item.active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* New Chat Button */}
        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-all group mb-4">
          <RiAddLine size={18} className="text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
          <span className="text-sm font-medium">New Chat</span>
        </Link>

        {/* Recent Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-3 mb-2 shrink-0">
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Recent</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4 pr-1">
            {loading && chats.length === 0 ? (
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
                      className={`flex-1 block text-left px-3 py-1.5 rounded-lg text-[13px] truncate transition-all font-medium 
                      ${location.pathname === `/chat/${thread._id}` ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-[#1a1a1a]' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#121212]'}`}
                    >
                      {thread.title || 'Untitled Chat'}
                    </Link>
                    <button 
                      onClick={() => {
                        setTargetId(thread._id);
                        setModalType('delete');
                      }}
                      className="p-1 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-all shrink-0"
                    >
                      <RiDeleteBinLine size={14} />
                    </button>
                  </div>
                ))}
                {chats.length > 0 && (
                  <Link
                    to="/library"
                    className="px-3 py-1.5 text-[11px] font-bold text-[#60A6AF] hover:text-[#60A6AF]/80 uppercase tracking-wider block w-fit transition-colors"
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
        <div className="mt-auto space-y-4 pt-4 border-t border-zinc-900/50 dark:border-zinc-900/50 border-zinc-200">
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-all group"
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

          {/* User Profile */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-2 group max-w-[140px]">
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate group-hover:text-zinc-700 dark:group-hover:text-white transition-colors">
                {user?.username || 'Guest'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiNotification3Line size={16} className="text-zinc-600 hover:text-zinc-300 cursor-pointer" />
              <button
                onClick={handleLogout}
                className="text-zinc-600 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <RiLogoutBoxRLine size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <ConfirmationModal 
        isOpen={modalType === 'delete'}
        onClose={() => setModalType(null)}
        onConfirm={() => {
            if (targetId) handleDeleteChat(targetId);
        }}
        title="Delete Chat"
        message="This chat session and its messages will be permanently deleted."
      />

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
        />
      )}
    </>
  );
};

export default Sidebar;
