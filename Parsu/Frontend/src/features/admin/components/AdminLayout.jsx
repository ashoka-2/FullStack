import React from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import {
  RiDashboard3Line,
  RiUser3Line,
  RiMailSendLine,
  RiInboxArchiveLine,
  RiCpuLine,
  RiArrowLeftLine,
  RiMoneyDollarCircleLine
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import GooeyNav from '../../Components/rare-ui/GooeyNav';

const GOOEY_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <RiDashboard3Line size={14} /> },
  { href: '/admin/users', label: 'Users', icon: <RiUser3Line size={14} /> },
  { href: '/admin/pricing', label: 'Subscriptions', icon: <RiMoneyDollarCircleLine size={14} /> },
  { href: '/admin/newsletter', label: 'Newsletter', icon: <RiMailSendLine size={14} /> },
  { href: '/admin/contacts', label: 'Contacts', icon: <RiInboxArchiveLine size={14} /> },
  { href: '/admin/api-usage', label: 'API Usage', icon: <RiCpuLine size={14} /> },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Apple-style Frosted Header with Liquid Glass material */}
      <header className="sticky top-0 z-50 bg-[#090a0f]/80 backdrop-blur-2xl border-b border-white/[0.07] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-6">
          
          {/* Brand & System Status */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-sky-400 p-[1px] shadow-sm shadow-cyan-500/10 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0c0d12] rounded-[11px] flex items-center justify-center text-cyan-400">
                  <ParsuLogo size={16} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Parsu AI</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] shadow-xs">
                  Console
                </span>
              </div>
            </Link>

            {/* Quick Back for Mobile */}
            <Link
              to="/"
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-xs border border-white/5"
            >
              <RiArrowLeftLine size={13} />
              <span>Back</span>
            </Link>
          </div>

          {/* Rare UI Pill-Shaped Gooey Nav Bar at Top */}
          <div className="flex items-center justify-center overflow-x-auto max-w-full custom-scrollbar py-1">
            <GooeyNav
              items={GOOEY_NAV_ITEMS}
              size="sm"
              activeColor="#20b8cd"
              activeLabelColor="#000000"
              className="shadow-md"
            />
          </div>

          {/* Right Status & Back to App */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Normal</span>
            </div>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[var(--accent-cyan)] border border-cyan-500/25 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
            >
              <RiArrowLeftLine size={14} />
              <span>Back to Chat</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 animate-in fade-in duration-200">
        <Outlet />
      </main>

      {/* Apple-style Minimal Footer */}
      <footer className="border-t border-white/[0.05] py-4 px-8 text-center text-[11px] text-zinc-500">
        Parsu AI Admin Platform • Grounded in Apple Human Interface Guidelines & Cloud Intelligence
      </footer>

    </div>
  );
}
