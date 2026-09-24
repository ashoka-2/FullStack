import React, { useState, useEffect } from 'react';
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
  RiSparkling2Line,
  RiExternalLinkLine
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { useAuth } from '../../auth/hook/useAuth';

const ADMIN_NAV_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: RiDashboard3Line },
  { href: '/admin/users', label: 'User Directory', icon: RiUser3Line },
  { href: '/admin/pricing', label: 'Subscriptions & Plans', icon: RiMoneyDollarCircleLine },
  { href: '/admin/contacts', label: 'Inquiries & Contacts', icon: RiInboxArchiveLine },
  { href: '/admin/newsletter', label: 'Newsletter Members', icon: RiMailSendLine },
  { href: '/admin/api-usage', label: 'API Usage & Limits', icon: RiCpuLine },
  { href: '/status', label: 'Public System Status', icon: RiShieldCheckLine, external: true }
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live pricing toggle switch persisted in localStorage
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

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Mobile Top App Bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#0c0d12]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/5 text-zinc-300 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <ParsuLogo size={18} />
            <span className="font-extrabold text-sm text-white">Parsu Console</span>
          </div>
        </div>

        <Link
          to="/ai"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 text-[var(--accent-cyan)] border border-cyan-500/25 text-xs font-semibold"
        >
          <RiArrowLeftLine size={13} />
          <span>Exit</span>
        </Link>
      </div>

      {/* Dedicated Admin Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-64 bg-[#0a0b0f] border-r border-white/[0.07] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.06] mb-4">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 p-[1px] shadow-sm shadow-cyan-500/10">
                <div className="w-full h-full bg-[#0c0d12] rounded-[11px] flex items-center justify-center text-cyan-400">
                  <ParsuLogo size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white">Parsu AI</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase text-black bg-[var(--accent-cyan)]">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">Infrastructure Console</p>
              </div>
            </Link>
          </div>

          {/* Quick Pricing Control Switch */}
          <div className="p-3 mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-300">Public Pricing</span>
              <button
                type="button"
                onClick={handleTogglePricing}
                className="cursor-pointer text-[var(--accent-cyan)] hover:opacity-80 transition-opacity"
                title={isPricingPublished ? "Click to hide live prices (stealth blur)" : "Click to publish live prices"}
              >
                {isPricingPublished ? (
                  <RiToggleFill size={24} className="text-[var(--accent-cyan)]" />
                ) : (
                  <RiToggleLine size={24} className="text-zinc-600" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              {isPricingPublished ? (
                <span className="text-emerald-400 font-medium">● Live unblurred (₹499 / ₹999)</span>
              ) : (
                <span className="text-amber-400 font-medium">● Stealth / Coming Soon (xxx/mo)</span>
              )}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {ADMIN_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </div>
                  {link.external && <RiExternalLinkLine size={13} className="text-zinc-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Exit Controls */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2">
          {/* Back to Chat */}
          <Link
            to="/ai"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[var(--accent-cyan)] border border-cyan-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <RiArrowLeftLine size={14} />
            <span>Return to AI Chat</span>
          </Link>

          {/* Current Admin & Logout */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-[var(--accent-cyan)] shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.username || 'Admin'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log out of Console"
            >
              <RiLogoutBoxRLine size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-[#090a0f]/60 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-300">Cluster Status: All Systems Operational</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleTogglePricing}
              className="flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-white/[0.03] border-white/10 hover:border-white/20"
            >
              <span className="text-zinc-400">Pricing:</span>
              {isPricingPublished ? (
                <span className="text-emerald-400 font-bold">Live Unblurred</span>
              ) : (
                <span className="text-amber-400 font-bold">Stealth Blurred</span>
              )}
            </button>

            <Link
              to="/ai"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[var(--accent-cyan)] border border-cyan-500/25 text-xs font-semibold transition-all cursor-pointer"
            >
              <RiArrowLeftLine size={13} />
              <span>Back to Chat</span>
            </Link>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Outlet />
        </main>

        <footer className="py-4 px-8 border-t border-white/[0.05] text-center text-[11px] text-zinc-500">
          Parsu AI Admin Console • Multi-Model Distributed Neural Network Orchestrator
        </footer>
      </div>

    </div>
  );
}
