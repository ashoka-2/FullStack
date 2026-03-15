import React, { useState } from 'react';
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
  RiLogoutBoxRLine
} from '@remixicon/react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router';
import { setUser } from '../auth/auth.slice';
import PerplexityIcon from './PerplexityIcon';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const user = useSelector(state => state.auth.user);
  const location = useLocation();
  const dispatch = useDispatch();

  const menuItems = [
    { icon: PerplexityIcon, label: 'Search', path: '/', active: location.pathname === '/' },
    { icon: RiHistoryLine, label: 'Library', path: '/library', active: location.pathname === '/library' },
  ];

  const secondaryItems = [
    // { icon: RiLineChartLine, label: 'Finance', path: '/finance' },
  ];

  const recentChats = [
    { id: '0', title: 'bollyflix' },
    { id: '1', title: 'Compare prices for noise' },
    { id: '2', title: 'Sei.' },
    { id: '3', title: 'sheryians/job' },
    { id: '4', title: 'dub.co partners' },
    { id: '5', title: 'sarthak sharma github' },
    { id: '6', title: 'latitude and longitude' },
    { id: '7', title: 'netmirror' },
    { id: '8', title: 'body: Column( children: [' },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-50 w-56 h-screen flex flex-col bg-[#050505] text-zinc-400 p-3 transition-transform duration-300 ease-in-out shrink-0
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
                ${item.active ? 'bg-[#1a1a1a] text-zinc-100' : 'hover:bg-[#121212] hover:text-zinc-200'}`}
            >
              <item.icon size={18} className={item.active ? 'text-zinc-100' : 'text-zinc-500'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* New Thread Button */}
        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] transition-all group mb-4">
          <RiAddLine size={18} className="text-zinc-500 group-hover:text-zinc-300" />
          <span className="text-sm font-medium">New Thread</span>
        </Link>

        {/* Secondary Menu */}
        <div className="space-y-1 mb-4">
          {secondaryItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] transition-all group"
            >
              <item.icon size={18} className="text-zinc-500" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] transition-all group">
            <RiMoreFill size={18} className="text-zinc-500" />
            <span className="text-sm font-medium">More</span>
          </button>
        </div>

        {/* Recent Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-3 mb-2 shrink-0">
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Recent</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4 pr-1">
            {recentChats.map((thread) => (
              <Link
                key={thread.id}
                to={`/chat/${thread.id}`}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-[13px] truncate transition-all font-medium 
                ${location.pathname === `/chat/${thread.id}` ? 'text-zinc-100 bg-[#1a1a1a]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#121212]'}`}
              >
                {thread.title}
              </Link>
            ))}
            <Link
              to="/library"
              className="px-3 py-1.5 text-[11px] font-bold text-[#60A6AF] hover:text-[#60A6AF]/80 uppercase tracking-wider block w-fit transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto space-y-4 pt-4 border-t border-zinc-900/50">
          {/* User Profile */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-2 group max-w-[140px]">
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                {user?.username || 'Guest'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RiNotification3Line size={16} className="text-zinc-600 hover:text-zinc-300 cursor-pointer" />
              <button
                onClick={() => dispatch(setUser(null))}
                className="text-zinc-600 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <RiLogoutBoxRLine size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

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
