import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
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
  RiToggleLine,
  RiToggleFill,
  RiShieldCheckLine,
  RiSparklingFill,
  RiExternalLinkLine,
  RiPulseLine,
  RiSunLine,
  RiMoonLine
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { useAuth } from '../../auth/hook/useAuth';

const ADMIN_NAV_LINKS = [
  { href: '/admin/dashboard',  label: 'Dashboard',      icon: RiDashboard3Line },
  { href: '/admin/users',      label: 'User Directory', icon: RiUser3Line },
  { href: '/admin/pricing',    label: 'Subscriptions',  icon: RiMoneyDollarCircleLine },
  { href: '/admin/contacts',   label: 'Inquiries',      icon: RiInboxArchiveLine },
  { href: '/admin/newsletter', label: 'Newsletter',     icon: RiMailSendLine },
  { href: '/admin/api-usage',  label: 'API Usage',      icon: RiCpuLine },
  { href: '/status',           label: 'System Status',  icon: RiShieldCheckLine, external: true }
];

const ANIM_STYLES = `
  @keyframes adminPageEnter {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes adminLogoGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(6,182,212,0); }
    50%      { box-shadow: 0 0 20px 4px rgba(6,182,212,0.18); }
  }
  @keyframes shimmerMove {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .admin-page-enter { animation: adminPageEnter 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .admin-logo-glow  { animation: adminLogoGlow 4s ease-in-out infinite; }
  .admin-shimmer {
    background: linear-gradient(90deg,#94a3b8 30%,#06b6d4 50%,#94a3b8 70%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmerMove 4s linear infinite;
  }
  .admin-active-bar::before {
    content:'';
    position:absolute; left:0; top:18%; bottom:18%;
    width:3px; border-radius:0 3px 3px 0;
    background:linear-gradient(to bottom,#06b6d4,#0ea5e9);
  }
`;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [pageKey, setPageKey] = useState(location.pathname);
  const prevPath = useRef(location.pathname);

  // Re-trigger page enter animation on route change
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setPageKey(location.pathname + '_' + Date.now());
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

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

  const [isPricingPublished, setIsPricingPublished] = useState(() => {
    return localStorage.getItem('parsu_admin_pricing_published') === 'true';
  });

  const handleTogglePricing = () => {
    const nextVal = !isPricingPublished;
    setIsPricingPublished(nextVal);
    localStorage.setItem('parsu_admin_pricing_published', nextVal ? 'true' : 'false');
    window.dispatchEvent(new Event('parsu_pricing_visibility_changed'));
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
    <>
      <style>{ANIM_STYLES}</style>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050608] text-zinc-800 dark:text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-cyan-500/20 selection:text-cyan-300 transition-colors duration-300">
      
      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#ffffff]/90 dark:bg-[#07080c]/95 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/[0.06] transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <RiCloseLine size={18} /> : <RiMenuLine size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <ParsuLogo size={24} className="text-cyan-500 dark:text-cyan-400" />
            <span className="font-black text-[13px] text-zinc-900 dark:text-white tracking-tight">Parsu Console</span>
            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase text-black bg-cyan-400 leading-none">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-cyan-500 cursor-pointer transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <RiMoonLine size={15} /> : <RiSunLine size={15} className="text-amber-400" />}
          </button>
          <Link to="/ai" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[11px] font-bold">
            <RiArrowLeftLine size={12} />Exit
          </Link>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-64
          bg-white/95 dark:bg-[#06070c]/98 backdrop-blur-2xl border-r border-zinc-200 dark:border-white/[0.06]
          flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ boxShadow: 'inset -1px 0 0 rgba(6,182,212,0.06)' }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-zinc-200 dark:border-white/[0.05] shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <ParsuLogo size={30} className="text-cyan-500 dark:text-cyan-400 group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[13px] tracking-tight text-zinc-900 dark:text-white">Parsu AI</span>
                <span className="px-1.5 py-px rounded text-[8px] font-black uppercase bg-gradient-to-r from-cyan-500 to-sky-500 text-black leading-none">ADMIN</span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-0.5">Infrastructure Console</p>
            </div>
          </Link>
        </div>

        {/* Pricing Toggle */}
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-zinc-100/80 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <RiSparklingFill size={11} className="text-cyan-500 dark:text-cyan-400" />
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Public Pricing</span>
            </div>
            <button
              onClick={handleTogglePricing}
              className="cursor-pointer hover:opacity-75 transition-opacity"
              title={isPricingPublished ? 'Hide prices' : 'Publish prices'}
            >
              {isPricingPublished
                ? <RiToggleFill size={22} className="text-cyan-500 dark:text-cyan-400" />
                : <RiToggleLine size={22} className="text-zinc-400 dark:text-zinc-600" />
              }
            </button>
          </div>
          <p className="text-[10px] font-medium">
            {isPricingPublished
              ? <span className="text-emerald-500 dark:text-emerald-400">● Live — prices visible</span>
              : <span className="text-amber-500 dark:text-amber-400">● Stealth — coming soon</span>
            }
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/admin/dashboard'
              ? location.pathname === '/admin/dashboard'
              : !link.external && location.pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                to={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl
                  text-[12px] font-semibold transition-all duration-200
                  ${isActive
                    ? 'admin-active-bar bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 dark:border-cyan-500/[0.18]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`}
              >
                <div className="flex items-center gap-2.5 pl-1">
                  <Icon
                    size={15}
                    className={`shrink-0 transition-all duration-200 ${
                      isActive ? 'text-cyan-500 dark:text-cyan-400'
                        : hovered === link.href ? 'text-cyan-600 dark:text-white scale-110'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {link.external && <RiExternalLinkLine size={11} className="text-zinc-400 dark:text-zinc-700" />}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="px-3 pb-5 pt-3 border-t border-zinc-200 dark:border-white/[0.05] space-y-2 shrink-0">
          {/* Theme Toggle Button in Sidebar */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 text-[12px] font-semibold transition-all cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <div className="flex items-center gap-2">
              {theme === 'light' ? <RiMoonLine size={15} className="text-indigo-600" /> : <RiSunLine size={15} className="text-amber-400" />}
              <span>{theme === 'light' ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-mono">Switch</span>
          </button>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500/25 to-sky-600/25 border border-cyan-500/20 flex items-center justify-center text-[11px] font-black text-cyan-600 dark:text-cyan-300 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-zinc-900 dark:text-white truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-600 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
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
          className="lg:hidden fixed inset-0 z-30 bg-black/50 dark:bg-black/65 backdrop-blur-sm"
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3 bg-[#ffffff]/85 dark:bg-[#06070b]/80 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/[0.05] sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-zinc-500">All Systems Operational</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.02] dark:hover:bg-white/[0.08] border-zinc-200 dark:border-white/[0.07] text-zinc-700 dark:text-zinc-300"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <RiMoonLine size={13} /> : <RiSunLine size={13} className="text-amber-400" />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <button
              onClick={handleTogglePricing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-white/[0.02] dark:hover:bg-white/[0.08] border-zinc-200 dark:border-white/[0.07]"
            >
              <RiPulseLine size={13} className={isPricingPublished ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'} />
              <span className="text-zinc-500">Pricing:</span>
              {isPricingPublished
                ? <span className="text-emerald-500 dark:text-emerald-400 font-bold">Live</span>
                : <span className="text-amber-500 dark:text-amber-400 font-bold">Hidden</span>
              }
            </button>
          </div>
        </header>

        {/* Animated Page Content */}
        <main
          key={pageKey}
          className="admin-page-enter flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto"
        >
          <Outlet />
        </main>

        <footer className="py-4 px-8 border-t border-zinc-200 dark:border-white/[0.04] text-center">
          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-700">
            Parsu AI Admin Console &nbsp;·&nbsp; v2.0 &nbsp;·&nbsp;
            <span className="admin-shimmer font-bold">Neural Orchestrator</span>
          </p>
        </footer>

      </div>

      </div>

    </>
  );
}

