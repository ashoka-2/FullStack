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
  RiShieldCheckLine,
  RiExternalLinkLine,
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
  { href: '/admin/ai-workspace',       label: 'AI Diagnostics',     icon: RiSparkling2Line },
  { href: '/admin/social-connections', label: 'Social Hub',        icon: RiShareLine },
  { href: '/admin/media-vault',        label: 'Media Vault',       icon: RiFolder3Line },
  { href: '/admin/api-usage',          label: 'API Usage',         icon: RiCpuLine },
  { href: '/admin/contacts',           label: 'Inquiries',         icon: RiInboxArchiveLine },
  { href: '/admin/newsletter',         label: 'Newsletter',        icon: RiMailSendLine },
  { href: '/admin/settings',           label: 'Global Settings',   icon: RiSettings3Line },
];

const ANIM_STYLES = `
  @keyframes adminPageEnter {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerMove {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .admin-page-enter { animation: adminPageEnter 0.25s cubic-bezier(0.22,1,0.36,1) both; }
  .admin-shimmer {
    background: linear-gradient(90deg, var(--text-muted) 30%, #06b6d4 50%, var(--text-muted) 70%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmerMove 4s linear infinite;
  }
  .admin-active-bar::before {
    content:'';
    position:absolute; left:0; top:18%; bottom:18%;
    width:3px; border-radius:0 3px 3px 0;
    background:linear-gradient(to bottom, #06b6d4, #0ea5e9);
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
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col lg:flex-row font-sans selection:bg-cyan-500/20 selection:text-cyan-300 transition-colors duration-300">
      
      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] backdrop-blur-2xl border-b border-[var(--border-primary)] transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <RiCloseLine size={18} /> : <RiMenuLine size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <ParsuLogo size={24} className="text-[var(--text-primary)]" />
            <span className="font-black text-[13px] text-[var(--text-primary)] tracking-tight">Parsu Console</span>
            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase text-black bg-cyan-400 leading-none">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-cyan-500 cursor-pointer transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <RiMoonLine size={15} /> : <RiSunLine size={15} className="text-amber-400" />}
          </button>
          <Link to="/ai" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[11px] font-bold">
            <RiArrowLeftLine size={12} />Exit
          </Link>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-64
          bg-[var(--bg-surface)] backdrop-blur-2xl border-r border-[var(--border-primary)]
          flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ boxShadow: 'inset -1px 0 0 rgba(6,182,212,0.06)' }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-[var(--border-primary)] shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <ParsuLogo size={30} className="text-[var(--text-primary)] group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[13px] tracking-tight text-[var(--text-primary)]">Parsu AI</span>
                <span className="px-1.5 py-px rounded text-[8px] font-black uppercase bg-gradient-to-r from-cyan-500 to-sky-500 text-black leading-none">ADMIN</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Control Center</p>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          <div>
            <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
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
                    className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl
                      text-[12px] font-semibold transition-all duration-200
                      ${isActive
                        ? 'admin-active-bar bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 pl-1">
                      <Icon
                        size={16}
                        className={`shrink-0 transition-all duration-200 ${
                          isActive ? 'text-cyan-500'
                            : hovered === link.href ? 'text-cyan-500 scale-110'
                            : 'text-[var(--text-muted)]'
                        }`}
                      />
                      <span>{link.label}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Exit to User Workspace */}
          <div className="pt-2 border-t border-[var(--border-primary)]">
            <Link
              to="/ai"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-500 text-[12px] font-bold transition-all"
            >
              <div className="flex items-center gap-2 pl-1">
                <RiSparkling2Line size={16} />
                <span>Launch Chat App</span>
              </div>
              <RiArrowRightUpLine size={14} />
            </Link>
          </div>
        </nav>

        {/* Bottom Controls */}
        <div className="px-3 pb-5 pt-3 border-t border-[var(--border-primary)] space-y-2 shrink-0">
          {/* Theme Toggle Button in Sidebar */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] font-semibold transition-all cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <div className="flex items-center gap-2">
              {theme === 'light' ? <RiMoonLine size={15} className="text-indigo-500" /> : <RiSunLine size={15} className="text-amber-400" />}
              <span>{theme === 'light' ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Switch</span>
          </button>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500/25 to-sky-600/25 border border-cyan-500/20 flex items-center justify-center text-[11px] font-black text-cyan-500 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[var(--text-primary)] truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
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
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3 bg-[var(--bg-surface)] backdrop-blur-2xl border-b border-[var(--border-primary)] sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">All Systems Operational</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <RiMoonLine size={13} /> : <RiSunLine size={13} className="text-amber-400" />}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
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

        <footer className="py-4 px-8 border-t border-[var(--border-primary)] text-center">
          <p className="text-[11px] font-mono text-[var(--text-secondary)]">
            Parsu AI Admin Console &nbsp;·&nbsp; v2.5 &nbsp;·&nbsp;
            <span className="admin-shimmer font-bold">Neural Orchestrator</span>
          </p>
        </footer>

        {/* Global Floating Mascot & Toast Container inside Admin */}
        <FloatingBlobMascot />
        <ToastContainer />

      </div>

      </div>

    </>
  );
}
