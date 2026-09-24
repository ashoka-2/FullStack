import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import {
  RiArrowRightLine,
  RiSunLine,
  RiMoonLine,
  RiMenuLine,
  RiCloseLine,
  RiSparkling2Line,
  RiCompass3Line,
  RiPriceTag3Line,
  RiLayoutMasonryLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiCustomerService2Line,
  RiUser3Line
} from '@remixicon/react';
import ParsuLogo from './ParsuLogo';
import MagneticButton from './MagneticButton';

/**
 * LiquidGlassNav — Fixed Top Zero-Background Navbar for Landing Page
 * Features:
 * - Fixed directly at top-0, spanning 100% width (no floating island pill)
 * - Zero background at page top (100% transparent so hero shines through)
 * - Subtle, ultra-clean liquid glass blur on scroll
 * - Clean, non-boxed navigation items directly on the navbar
 * - Fully responsive with smooth mobile drawer
 */
export const LiquidGlassNav = ({ theme, toggleTheme }) => {
  const user = useSelector((state) => state.auth?.user);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change or screen resize
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features', isHash: true, icon: RiCompass3Line },
    { label: 'Pricing', href: '/pricing', isHash: false, icon: RiPriceTag3Line },
    { label: 'Workspace', href: '#preview', isHash: true, icon: RiLayoutMasonryLine },
    { label: 'Privacy', href: '#transparency', isHash: true, icon: RiShieldCheckLine },
    { label: 'About', href: '/about', isHash: false, icon: RiInformationLine },
    { label: 'Contact', href: '/contact', isHash: false, icon: RiCustomerService2Line },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-950/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* 1. Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer shrink-0 select-none"
          aria-label="Parsu AI Home"
        >
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] via-[var(--color-clear-hanada)] to-[var(--color-deep-hanada)] flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 group-hover:shadow-cyan-500/40 transition-all duration-200">
            <ParsuLogo size={18} className="text-white drop-shadow-xs" />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors drop-shadow-xs">
              Parsu
            </span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1.5 py-0.5 rounded shadow-xs">
              AI
            </span>
          </div>
        </Link>

        {/* 2. Desktop Navigation Links (Always White color with cyan hover) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 lg:gap-2"
        >
          {navLinks.map((link) =>
            link.isHash ? (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all duration-150 drop-shadow-xs"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all duration-150 drop-shadow-xs"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* 3. Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all duration-150 cursor-pointer shadow-xs"
            title="Toggle Light / Dark mode"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <RiMoonLine size={15} className="transition-transform duration-300 rotate-0 hover:-rotate-12 text-white" />
            ) : (
              <RiSunLine size={15} className="transition-transform duration-300 rotate-0 hover:rotate-45 text-amber-300" />
            )}
          </button>

          {/* Conditional Auth Button on Desktop:
              If logged in: NO Sign In button, show profile link / badge
              If not logged in: Show Sign In button */}
          {user ? (
            <Link
              to="/settings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 border border-white/15 transition-all drop-shadow-xs"
              title={`Logged in as ${user.name || user.username || 'User'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[110px] truncate">{user.name || user.username || 'Account'}</span>
            </Link>
          ) : (
            <Link
              to="/auth?mode=login"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 drop-shadow-xs"
            >
              Sign In
            </Link>
          )}

          {/* Launch AI Magnetic Button */}
          <Link to="/ai" className="shrink-0">
            <MagneticButton
              size="sm"
              variant="cyan"
              className="shadow-sm shadow-cyan-500/25 px-2.5 sm:px-3 py-1.5"
            >
              <span className="font-bold tracking-tight text-xs sm:text-sm">Launch AI</span>
              <RiArrowRightLine size={13} className="ml-1" />
            </MagneticButton>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="md:hidden w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Glass Dropdown Menu ───────────────────────────── */}
      {isMobileOpen && (
        <div className="md:hidden bg-[#0c0d12]/98 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 py-4 sm:py-5 space-y-4 animate-in slide-in-from-top-3 duration-200 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return link.isHash ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/90 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                >
                  <Icon size={15} className="text-[var(--accent-cyan)] shrink-0" />
                  <span className="truncate">{link.label}</span>
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/90 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                >
                  <Icon size={15} className="text-[var(--accent-cyan)] shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
            {/* Conditional mobile auth */}
            {user ? (
              <Link
                to="/settings"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-cyan-400 px-3 py-2 rounded-xl transition-colors border border-white/10"
              >
                <RiUser3Line size={14} className="text-emerald-400" />
                <span className="truncate max-w-[120px]">{user.name || user.username || 'Account'}</span>
              </Link>
            ) : (
              <Link
                to="/auth?mode=login"
                onClick={() => setIsMobileOpen(false)}
                className="text-xs font-bold text-white hover:text-cyan-400 px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            )}

            <Link
              to="/ai"
              onClick={() => setIsMobileOpen(false)}
              className="flex-1"
            >
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--color-sky-haze)] shadow-md shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <RiSparkling2Line size={14} />
                <span>Launch AI</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LiquidGlassNav;
