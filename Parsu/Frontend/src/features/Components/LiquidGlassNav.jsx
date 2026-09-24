import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import {
  RiArrowRightLine,
  RiArrowRightUpLine,
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
  RiUser3Line,
  RiLoginCircleLine
} from '@remixicon/react';
import gsap from 'gsap';
import ParsuLogo from './ParsuLogo';
import MagneticButton from './MagneticButton';

/**
 * LiquidGlassNav — Fixed Top Zero-Background Navbar for Landing Page
 * Features:
 * - Fixed directly at top-0, spanning 100% width
 * - Zero background at page top (transparent so hero background shines through)
 * - Liquid glass blur on scroll
 * - Mobile normal navbar has NO theme icon
 * - Immersive full-screen mobile menu with fluid circular reveal GSAP animation,
 *   staggered entrance, interactive theme toggle card, user status, and quick launch
 */
export const LiquidGlassNav = ({ theme, toggleTheme }) => {
  const user = useSelector((state) => state.auth?.user);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const menuOverlayRef = useRef(null);
  const menuItemsRef = useRef([]);
  const menuTl = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Superior GSAP Full-Screen Circle Liquid Animation
  useEffect(() => {
    if (menuOverlayRef.current) {
      if (isMobileOpen) {
        document.body.style.overflow = 'hidden';
        if (menuTl.current) menuTl.current.kill();

        menuTl.current = gsap.timeline();
        menuTl.current
          .set(menuOverlayRef.current, { display: 'flex' })
          .fromTo(
            menuOverlayRef.current,
            { clipPath: 'circle(0% at calc(100% - 28px) 32px)', opacity: 0.95 },
            {
              clipPath: 'circle(160% at calc(100% - 28px) 32px)',
              opacity: 1,
              duration: 0.8,
              ease: 'power4.inOut',
            }
          )
          .fromTo(
            menuItemsRef.current.filter(Boolean),
            { y: 35, opacity: 0, skewY: 2 },
            {
              y: 0,
              opacity: 1,
              skewY: 0,
              duration: 0.55,
              stagger: 0.05,
              ease: 'power3.out',
            },
            '-=0.45'
          );
      } else {
        document.body.style.overflow = 'unset';
        if (menuTl.current) menuTl.current.kill();

        menuTl.current = gsap.timeline({
          onComplete: () => {
            if (menuOverlayRef.current) {
              gsap.set(menuOverlayRef.current, { display: 'none' });
            }
          },
        });
        menuTl.current.to(menuOverlayRef.current, {
          clipPath: 'circle(0% at calc(100% - 28px) 32px)',
          opacity: 0.9,
          duration: 0.5,
          ease: 'power4.inOut',
        });
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const navLinks = [
    { id: '01', label: 'Features', href: '#features', isHash: true, icon: RiCompass3Line },
    { id: '02', label: 'Pricing', href: '/pricing', isHash: false, icon: RiPriceTag3Line },
    { id: '03', label: 'Workspace', href: '#preview', isHash: true, icon: RiLayoutMasonryLine },
    { id: '04', label: 'Privacy', href: '#transparency', isHash: true, icon: RiShieldCheckLine },
    { id: '05', label: 'About', href: '/about', isHash: false, icon: RiInformationLine },
    { id: '06', label: 'Contact', href: '/contact', isHash: false, icon: RiCustomerService2Line },
  ];

  return (
    <>
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

          {/* 2. Desktop Navigation Links */}
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
            {/* Theme Toggle Button — HIDDEN ON MOBILE (visible ONLY on md+) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden md:flex w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all duration-150 cursor-pointer shadow-xs"
              title="Toggle Light / Dark mode"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <RiMoonLine size={15} className="transition-transform duration-300 rotate-0 hover:-rotate-12 text-white" />
              ) : (
                <RiSunLine size={15} className="transition-transform duration-300 rotate-0 hover:rotate-45 text-amber-300" />
              )}
            </button>

            {/* Desktop Auth Button */}
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
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden w-8.5 h-8.5 rounded-xl flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <RiMenuLine size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Immersive Liquid Full-Screen Mobile Menu (Better than Scapegoat) ── */}
      <div
        ref={menuOverlayRef}
        style={{ display: 'none', clipPath: 'circle(0% at calc(100% - 28px) 32px)' }}
        className="fixed inset-0 z-[100] md:hidden bg-[#090a0f]/98 backdrop-blur-3xl text-white flex-col justify-between p-6 overflow-y-auto"
      >
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        {/* Top Header inside open menu */}
        <div className="flex items-center justify-between relative z-10 shrink-0 mb-6">
          <Link
            to="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--color-deep-hanada)] flex items-center justify-center shadow-md shadow-cyan-500/30">
              <ParsuLogo size={18} className="text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-lg tracking-tight text-white">Parsu</span>
              <span className="text-[9px] font-black uppercase text-black bg-[var(--accent-cyan)] px-1.5 py-0.5 rounded">AI</span>
            </div>
          </Link>

          {/* Close Button with circular hover effect */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer shadow-lg"
            aria-label="Close Menu"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Navigation Links — Staggered and Numbered */}
        <div className="flex-1 flex flex-col justify-center my-4 relative z-10 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3 px-2">
            Navigation
          </p>
          {navLinks.map((link, idx) => {
            const Icon = link.icon;
            return link.isHash ? (
              <a
                key={link.label}
                href={link.href}
                ref={(el) => (menuItemsRef.current[idx] = el)}
                onClick={() => setIsMobileOpen(false)}
                className="group flex items-center justify-between py-3 px-3 rounded-2xl hover:bg-white/[0.06] transition-all duration-300 border-b border-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-[var(--accent-cyan)] opacity-70 group-hover:opacity-100">
                    {link.id}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className="text-zinc-400 group-hover:text-[var(--accent-cyan)] transition-colors" />
                    <span className="text-2xl font-black tracking-tight text-white group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-300">
                      {link.label}
                    </span>
                  </div>
                </div>
                <RiArrowRightUpLine size={20} className="text-zinc-600 group-hover:text-[var(--accent-cyan)] group-hover:rotate-45 transition-all duration-300" />
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                ref={(el) => (menuItemsRef.current[idx] = el)}
                onClick={() => setIsMobileOpen(false)}
                className="group flex items-center justify-between py-3 px-3 rounded-2xl hover:bg-white/[0.06] transition-all duration-300 border-b border-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-[var(--accent-cyan)] opacity-70 group-hover:opacity-100">
                    {link.id}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className="text-zinc-400 group-hover:text-[var(--accent-cyan)] transition-colors" />
                    <span className="text-2xl font-black tracking-tight text-white group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-300">
                      {link.label}
                    </span>
                  </div>
                </div>
                <RiArrowRightUpLine size={20} className="text-zinc-600 group-hover:text-[var(--accent-cyan)] group-hover:rotate-45 transition-all duration-300" />
              </Link>
            );
          })}
        </div>

        {/* Bottom Panel: Interactive Theme Switcher + User Status + Launch AI */}
        <div
          ref={(el) => (menuItemsRef.current[navLinks.length] = el)}
          className="relative z-10 shrink-0 pt-4 border-t border-white/[0.08] space-y-3"
        >
          {/* THEME TOGGLE CARD (Exclusive to Mobile Menu, removed from top bar) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  theme === 'light'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                }`}
              >
                {theme === 'light' ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Appearance</p>
                <p className="text-[11px] text-zinc-400">
                  {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white active:scale-95 transition-all cursor-pointer"
            >
              <span>{theme === 'light' ? 'Go Dark' : 'Go Light'}</span>
              {theme === 'light' ? (
                <RiMoonLine size={13} className="text-zinc-300" />
              ) : (
                <RiSunLine size={13} className="text-amber-300" />
              )}
            </button>
          </div>

          {/* User Auth Info or Sign In */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/settings"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <RiUser3Line size={13} />
                </div>
                <span className="truncate">{user.name || user.username || 'My Account'}</span>
              </Link>
            ) : (
              <Link
                to="/auth?mode=login"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                <RiLoginCircleLine size={15} />
                <span>Sign In</span>
              </Link>
            )}

            {/* Launch AI CTA */}
            <Link
              to="/ai"
              onClick={() => setIsMobileOpen(false)}
              className="flex-1"
            >
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black text-black bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--color-sky-haze)] shadow-lg shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <RiSparkling2Line size={15} />
                <span>Launch AI</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LiquidGlassNav;
