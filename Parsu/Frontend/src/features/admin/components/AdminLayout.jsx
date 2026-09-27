import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import gsap from 'gsap';
import {
  RiDashboard3Line,
  RiUser3Line,
  RiMailSendLine,
  RiInboxArchiveLine,
  RiCpuLine,
  RiArrowLeftLine,
  RiMoneyDollarCircleLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiShieldCheckLine,
  RiSunLine,
  RiMoonLine,
  RiSparkling2Line,
  RiSettings3Line,
  RiShareLine,
  RiFolder3Line,
  RiArrowRightUpLine
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import FloatingBlobMascot from '../../Components/FloatingBlobMascot';
import { ToastContainer } from '../../Components/Toast';
import { useAuth } from '../../auth/hook/useAuth';

const ADMIN_NAV_LINKS = [
  { href: '/admin/dashboard',          label: 'Dashboard',         icon: RiDashboard3Line },
  { href: '/admin/users',              label: 'User Directory',    icon: RiUser3Line },
  { href: '/admin/pricing',            label: 'Subscriptions',     icon: RiMoneyDollarCircleLine },
  { href: '/admin/ai-workspace',       label: 'AI Diagnostics',    icon: RiSparkling2Line },
  { href: '/admin/social-connections', label: 'Social Hub',        icon: RiShareLine },
  { href: '/admin/media-vault',        label: 'Media Vault',       icon: RiFolder3Line },
  { href: '/admin/api-usage',          label: 'API Usage',         icon: RiCpuLine },
  { href: '/admin/contacts',           label: 'Inquiries',         icon: RiInboxArchiveLine },
  { href: '/admin/newsletter',         label: 'Newsletter',        icon: RiMailSendLine },
  { href: '/admin/settings',           label: 'Global Settings',   icon: RiSettings3Line },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const mainRef = useRef(null);
  const sidebarRef = useRef(null);

  // GSAP page entrance animation on route transition
  useEffect(() => {
    if (mainRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          mainRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      }, mainRef);
      return () => ctx.revert();
    }
  }, [location.pathname]);

  // Sidebar item entrance on initial mount
  useEffect(() => {
    if (sidebarRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.admin-nav-item', {
          opacity: 0,
          x: -6,
          duration: 0.35,
          stagger: 0.025,
          ease: 'power2.out'
        });
      }, sidebarRef);
      return () => ctx.revert();
    }
  }, []);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

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

  const toggleTheme = (e) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);
    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

  const onLogout = async () => {
    await handleLogout();
    navigate('/auth');
  };

  const initials = user?.username?.[0]?.toUpperCase() || 'A';
  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'Admin';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0b0f] text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-zinc-800 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950 transition-colors duration-300">
      
      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#0c0d12]/90 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/[0.08] transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <RiCloseLine size={18} /> : <RiMenuLine size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <ParsuLogo size={22} className="text-zinc-900 dark:text-white" />
            <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-white">Parsu Console</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 leading-none">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <RiMoonLine size={15} /> : <RiSunLine size={15} className="text-zinc-200" />}
          </button>
          <Link to="/ai" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] text-[11px] font-semibold transition-all">
            <RiArrowLeftLine size={12} />Exit
          </Link>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-64
          bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-zinc-200 dark:border-white/[0.08]
          flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-zinc-200/80 dark:border-white/[0.08] shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <ParsuLogo size={28} className="text-zinc-900 dark:text-white group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[13px] tracking-tight text-zinc-900 dark:text-white">Parsu AI</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 leading-none">ADMIN</span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Control Center</p>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          <div>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
              Admin Systems
            </p>
            <div className="space-y-0.5 mt-1">
              {ADMIN_NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = link.href === '/admin/dashboard'
                  ? location.pathname === '/admin/dashboard'
                  : location.pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onMouseEnter={() => setHovered(link.href)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`admin-nav-item relative flex items-center justify-between px-3 py-2 rounded-xl
                      text-[12px] font-medium transition-all duration-150 active:scale-[0.98]
                      ${isActive
                        ? 'bg-zinc-900 text-white dark:bg-white/[0.12] dark:text-white shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 pl-0.5">
                      <Icon
                        size={16}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : hovered === link.href
                            ? 'text-zinc-900 dark:text-white'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      />
                      <span>{link.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-white shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Exit to User Workspace */}
          <div className="pt-2 border-t border-zinc-200/80 dark:border-white/[0.08]">
            <Link
              to="/ai"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.08] text-[12px] font-semibold transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 pl-0.5">
                <RiSparkling2Line size={15} className="text-zinc-500 dark:text-zinc-400" />
                <span>Launch Chat App</span>
              </div>
              <RiArrowRightUpLine size={13} className="text-zinc-400" />
            </Link>
          </div>
        </nav>

        {/* Bottom Controls */}
        <div className="px-3 pb-5 pt-3 border-t border-zinc-200/80 dark:border-white/[0.08] space-y-2 shrink-0">
          {/* Theme Toggle Button in Sidebar */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-[12px] font-medium transition-all cursor-pointer active:scale-[0.98]"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <div className="flex items-center gap-2">
              {theme === 'light' ? <RiMoonLine size={14} /> : <RiSunLine size={14} className="text-zinc-200" />}
              <span>{theme === 'light' ? 'Light Appearance' : 'Dark Appearance'}</span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-mono">Toggle</span>
          </button>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-200 border border-zinc-300 dark:border-white/10 flex items-center justify-center text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <RiLogoutBoxRLine size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/[0.08] sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">All Systems Operational</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-zinc-200/80 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-[0.98]"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <RiMoonLine size={13} /> : <RiSunLine size={13} className="text-zinc-200" />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </header>

        {/* Animated Page Content */}
        <main
          ref={mainRef}
          className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto"
        >
          <Outlet />
        </main>

        <footer className="py-4 px-8 border-t border-zinc-200/80 dark:border-white/[0.08] text-center">
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            Parsu AI Admin Console &nbsp;·&nbsp; Enterprise v2.5 &nbsp;·&nbsp;
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">Neural Orchestrator</span>
          </p>
        </footer>

        {/* Global Floating Mascot & Toast Container inside Admin */}
        <FloatingBlobMascot />
        <ToastContainer />

      </div>

    </div>
  );
}
