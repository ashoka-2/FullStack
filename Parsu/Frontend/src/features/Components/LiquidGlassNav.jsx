import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { useLenis } from 'lenis/react';
import {
  RiArrowRightLine, RiArrowRightUpLine, RiSunLine, RiMoonLine, RiMenuLine, RiCloseLine, RiSparkling2Line,
  RiCompass3Line, RiPriceTag3Line, RiLayoutMasonryLine, RiShieldCheckLine, RiInformationLine,
  RiCustomerService2Line, RiUser3Line, RiLoginCircleLine,
} from '@remixicon/react';
import gsap from 'gsap';
import ParsuLogo from './ParsuLogo';
import { CircleButton, PillBadge } from './PillButton';
import PrimaryButton from './PrimaryButton';

const NAV_LINKS = [
  { id: '01', label: 'Features', href: '#features', isHash: true, icon: RiCompass3Line },
  { id: '02', label: 'Pricing', href: '/pricing', isHash: false, icon: RiPriceTag3Line },
  { id: '03', label: 'Workspace', href: '#workspace', isHash: true, icon: RiLayoutMasonryLine },
  { id: '04', label: 'Privacy', href: '#privacy', isHash: true, icon: RiShieldCheckLine },
  { id: '05', label: 'About', href: '/about', isHash: false, icon: RiInformationLine },
  { id: '06', label: 'Contact', href: '/contact', isHash: false, icon: RiCustomerService2Line },
];

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * LiquidGlassNav
 * - Transparent at the top, morphs into a floating glass pill on scroll
 * - Hides on scroll down, returns on scroll up (and on keyboard focus)
 * - Sliding hover indicator + scroll-spy active section + scroll progress line
 * - Full-screen mobile/tablet menu that expands from the menu button
 */
export const LiquidGlassNav = ({ theme, toggleTheme }) => {
  const user = useSelector((s) => s.auth?.user);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [spy, setSpy] = useState('');

  const headerRef = useRef(null);
  const barRef = useRef(null);
  const indRef = useRef(null);
  const linkRefs = useRef({});
  const logoRef = useRef(null);
  const overlayRef = useRef(null);
  const burgerRef = useRef(null);
  const closeRef = useRef(null);
  const themeIconRef = useRef(null);
  const originRef = useRef('calc(100% - 28px) 32px');
  const hiddenRef = useRef(false);
  const firstTheme = useRef(true);

  const activeLabel =
    pathname === '/'
      ? NAV_LINKS.find((l) => l.isHash && l.href.slice(1) === spy)?.label
      : NAV_LINKS.find((l) => !l.isHash && l.href === pathname)?.label;

  /* ── Entrance ── */
  useEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { yPercent: -120, opacity: 0, duration: 1, ease: 'power4.out', delay: 0.2 });
      gsap.from('.nav-anim', { y: -12, opacity: 0, duration: 0.6, stagger: 0.05, delay: 0.55, ease: 'power3.out' });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  /* ── Scroll: morph, hide/show, progress ── */
  const setHidden = (h) => {
    if (hiddenRef.current === h) return;
    hiddenRef.current = h;
    gsap.to(headerRef.current, { yPercent: h ? -130 : 0, duration: reduced() ? 0 : 0.5, ease: 'power3.inOut', overwrite: 'auto' });
  };
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y < 200) setSpy('');
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) gsap.set(barRef.current, { scaleX: max > 0 ? Math.min(1, y / max) : 0 });
      if (y > 200 && y - last > 6) setHidden(true);
      else if (last - y > 6 || y < 120) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Scroll spy ── */
  useEffect(() => {
    if (pathname !== '/') return;
    const els = NAV_LINKS.filter((l) => l.isHash).map((l) => document.getElementById(l.href.slice(1))).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setSpy(e.target.id)), { rootMargin: '-35% 0px -55% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  /* ── Sliding indicator ── */
  const placeIndicator = (el) => {
    if (!el || !indRef.current) return;
    gsap.to(indRef.current, { x: el.offsetLeft, width: el.offsetWidth, opacity: 1, duration: reduced() ? 0 : 0.45, ease: 'power3.out', overwrite: 'auto' });
  };
  const restore = () => {
    const el = linkRefs.current[activeLabel];
    if (el) placeIndicator(el);
    else if (indRef.current) gsap.to(indRef.current, { opacity: 0, duration: 0.25, overwrite: 'auto' });
  };
  useEffect(() => {
    restore();
    window.addEventListener('resize', restore);
    document.fonts?.ready.then(restore);
    return () => window.removeEventListener('resize', restore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLabel]);

  /* ── Theme icon swap ── */
  useEffect(() => {
    if (firstTheme.current) { firstTheme.current = false; return; }
    if (themeIconRef.current && !reduced()) gsap.fromTo(themeIconRef.current, { rotate: -90, scale: 0.4, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
  }, [theme]);

  /* ── Mobile menu ── */
  const openMenu = () => {
    const r = burgerRef.current?.getBoundingClientRect();
    if (r) originRef.current = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    setOpen(true);
  };
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    const o = originRef.current;
    const fast = reduced();
    const R = Math.hypot(window.innerWidth, window.innerHeight);
    if (open) {
      document.body.style.overflow = 'hidden';
      lenisRef.current?.stop();
      const items = ov.querySelectorAll('.m-item');
      gsap.killTweensOf([ov, items]);
      gsap.set(ov, { display: 'flex' });
      gsap.timeline({ onComplete: () => closeRef.current?.querySelector('button')?.focus() })
        .fromTo(ov, { clipPath: `circle(0px at ${o})` }, { clipPath: `circle(${R}px at ${o})`, duration: fast ? 0 : 0.9, ease: 'power4.inOut' })
        .fromTo(items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: fast ? 0 : 0.6, stagger: 0.05, ease: 'power3.out' }, '-=0.5');
    } else if (ov.style.display === 'flex') {
      document.body.style.overflow = '';
      lenisRef.current?.start();
      gsap.timeline({ onComplete: () => gsap.set(ov, { display: 'none' }) })
        .to(ov, { clipPath: `circle(0px at ${o})`, duration: fast ? 0 : 0.6, ease: 'power4.inOut' });
      burgerRef.current?.querySelector('button')?.focus();
    }
  }, [open]);
  useEffect(() => () => { document.body.style.overflow = ''; lenisRef.current?.start(); }, []);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  /* ── Navigation ── */
  const goTo = (e, link) => {
    if (!link.isHash) return setOpen(false);
    e.preventDefault();
    const id = link.href.slice(1);
    const wasOpen = open;
    setOpen(false);
    const run = () => {
      if (pathname !== '/') return navigate(`/#${id}`);
      const el = document.getElementById(id);
      if (!el) return window.scrollTo({ top: 0, behavior: 'smooth' });
      if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -90 });
      else el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `/#${id}`);
    };
    if (wasOpen) setTimeout(run, 450); else run();
  };
  const hrefFor = (l) => (l.isHash && pathname !== '/' ? `/${l.href}` : l.href);
  const ThemeIcon = theme === 'light' ? RiMoonLine : RiSunLine;

  return (
    <>
      <header ref={headerRef} onFocusCapture={() => setHidden(false)} className="pointer-events-none fixed inset-x-0 top-0 z-50 px-2 sm:px-4">
        <div className={`pointer-events-auto relative mx-auto flex items-center justify-between gap-2 sm:gap-4 transition-all duration-500 ease-out ${
          scrolled
            ? 'mt-2 sm:mt-3 h-14 sm:h-16 max-w-5xl rounded-full px-3 sm:px-5 border border-zinc-200/70 dark:border-white/10 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]'
            : 'mt-0 h-16 sm:h-20 max-w-7xl rounded-none px-1 sm:px-4 border border-transparent bg-transparent'
        }`}>
          {/* Logo */}
          <Link to="/" aria-label="Parsu AI Home" onPointerEnter={() => !reduced() && gsap.to(logoRef.current, { rotate: '+=360', duration: 0.8, ease: 'power3.inOut' })} className="nav-anim group flex shrink-0 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]">
            <span ref={logoRef} className="inline-flex"><ParsuLogo size={28} className="text-zinc-900 dark:text-white" /></span>
            <span className="flex items-center gap-1.5">
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-300">Parsu</span>
              <span className="rounded bg-[var(--accent-cyan)] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black tracking-wider text-black">AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <nav aria-label="Main" onPointerLeave={restore} className="nav-anim relative hidden lg:flex items-center gap-0.5 rounded-full border border-zinc-900/[0.06] dark:border-white/10 bg-zinc-900/[0.03] dark:bg-white/[0.04] p-1 backdrop-blur-md">
            <span ref={indRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-1 bottom-1 w-0 rounded-full border border-zinc-200/70 dark:border-white/10 bg-white opacity-0 shadow-sm dark:bg-white/[0.12]" />
            {NAV_LINKS.map((l) => {
              const active = activeLabel === l.label;
              const props = {
                ref: (el) => (linkRefs.current[l.label] = el),
                onPointerEnter: (e) => placeIndicator(e.currentTarget),
                onFocus: (e) => placeIndicator(e.currentTarget),
                'aria-current': active ? 'true' : undefined,
                className: `relative z-10 rounded-full px-3.5 py-1.5 text-[13px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] ${active ? 'text-zinc-950 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'}`,
              };
              return l.isHash
                ? <a key={l.label} href={hrefFor(l)} onClick={(e) => goTo(e, l)} {...props}>{l.label}</a>
                : <Link key={l.label} to={l.href} {...props}>{l.label}</Link>;
            })}
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="nav-anim hidden sm:inline-flex">
              <CircleButton onClick={toggleTheme} title="Toggle light / dark mode" ariaLabel="Toggle theme">
                <span ref={themeIconRef} className="inline-flex"><ThemeIcon size={15} className={theme === 'light' ? 'text-zinc-800' : 'text-amber-300'} /></span>
              </CircleButton>
            </span>
            <span className="nav-anim hidden lg:inline-flex">
              {user ? (
                <PillBadge to="/settings" variant="default" title={`Logged in as ${user.name || user.username || 'User'}`}>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="max-w-[110px] truncate">{user.name || user.username || 'Account'}</span>
                </PillBadge>
              ) : (
                <Link to="/auth?mode=login" className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-zinc-700 outline-none transition-colors hover:bg-zinc-100/80 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">Sign In</Link>
              )}
            </span>
            <span className="nav-anim inline-flex">
              <PrimaryButton to="/ai" size="sm" icon={RiArrowRightLine} iconPosition="right" className="shrink-0">Launch AI</PrimaryButton>
            </span>
            <span ref={burgerRef} className="nav-anim inline-flex lg:hidden">
              <CircleButton onClick={openMenu} ariaLabel="Open navigation menu" aria-expanded={open} aria-controls="mobile-menu"><RiMenuLine size={18} /></CircleButton>
            </span>
          </div>

          {/* Scroll progress */}
          <div aria-hidden="true" className={`pointer-events-none absolute inset-x-6 bottom-0 h-[2px] overflow-hidden rounded-full transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
            <div ref={barRef} className="h-full origin-left bg-gradient-to-r from-[var(--accent-cyan)] to-sky-400" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      </header>

      {/* Full-screen menu (phones + tablets) */}
      <div
        id="mobile-menu" ref={overlayRef} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}
        style={{ display: 'none', clipPath: 'circle(0px at 100% 0)', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        className="fixed inset-0 z-[60] h-[100dvh] flex-col justify-between overflow-y-auto bg-white/[0.98] p-6 text-zinc-900 backdrop-blur-3xl dark:bg-[#090a0f]/[0.98] dark:text-white lg:hidden"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-sky-500/15 blur-[100px]" />

        <div className="relative z-10 mb-4 flex shrink-0 items-center justify-between">
          <Link to="/" onClick={() => setOpen(false)} className="m-item flex items-center gap-2">
            <ParsuLogo size={26} className="text-zinc-900 dark:text-white" />
            <span className="text-lg font-extrabold tracking-tight">Parsu</span>
            <span className="rounded bg-[var(--accent-cyan)] px-1.5 py-0.5 text-[9px] font-black text-black">AI</span>
          </Link>
          <span ref={closeRef} className="m-item inline-flex"><CircleButton size="lg" onClick={() => setOpen(false)} ariaLabel="Close menu"><RiCloseLine size={20} /></CircleButton></span>
        </div>

        <nav aria-label="Mobile" className="relative z-10 my-4 flex flex-1 flex-col justify-center">
          {NAV_LINKS.map((l) => {
            const Icon = l.icon;
            const active = activeLabel === l.label;
            const cls = `m-item group flex items-center justify-between rounded-2xl border-b border-zinc-200/60 px-3 py-3 transition-colors hover:bg-zinc-100 dark:border-white/[0.05] dark:hover:bg-white/[0.06]`;
            const inner = (
              <>
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-[var(--accent-cyan)] opacity-70 group-hover:opacity-100">{l.id}</span>
                  <Icon size={18} className="text-zinc-500 transition-colors group-hover:text-[var(--accent-cyan)] dark:text-zinc-400" />
                  <span className={`font-display text-[clamp(1.6rem,7.5vw,2.4rem)] font-black leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1.5 ${active ? 'text-[var(--accent-cyan)]' : ''}`}>{l.label}</span>
                </span>
                <RiArrowRightUpLine size={20} className="text-zinc-400 transition-all duration-300 group-hover:rotate-45 group-hover:text-[var(--accent-cyan)] dark:text-zinc-600" />
              </>
            );
            return l.isHash
              ? <a key={l.label} href={hrefFor(l)} onClick={(e) => goTo(e, l)} aria-current={active ? 'true' : undefined} className={cls}>{inner}</a>
              : <Link key={l.label} to={l.href} onClick={() => setOpen(false)} aria-current={active ? 'true' : undefined} className={cls}>{inner}</Link>;
          })}
        </nav>

        <div className="relative z-10 shrink-0 space-y-3 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]">
          <div className="m-item flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className={`grid h-9 w-9 place-items-center rounded-xl border ${theme === 'light' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'}`}>
                {theme === 'light' ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
              </span>
              <div>
                <p className="text-sm font-bold">Appearance</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{theme === 'light' ? 'Light theme' : 'Dark theme'}</p>
              </div>
            </div>
            <button type="button" onClick={toggleTheme} className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 shadow-xs transition-all active:scale-95 hover:bg-zinc-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              {theme === 'light' ? 'Go dark' : 'Go light'}
              <ThemeIcon size={13} className={theme === 'light' ? 'text-zinc-600' : 'text-amber-300'} />
            </button>
          </div>

          <div className="m-item flex items-center gap-2">
            {user ? (
              <Link to="/settings" onClick={() => setOpen(false)} className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-zinc-200 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/10">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-500"><RiUser3Line size={13} /></span>
                <span className="truncate">{user.name || user.username || 'My account'}</span>
              </Link>
            ) : (
              <Link to="/auth?mode=login" onClick={() => setOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-zinc-200 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/10">
                <RiLoginCircleLine size={15} />Sign in
              </Link>
            )}
            <PrimaryButton to="/ai" onClick={() => setOpen(false)} size="sm" fullWidth icon={RiSparkling2Line} iconPosition="left" className="flex-1">Launch AI</PrimaryButton>
          </div>

          <div className="m-item flex justify-center gap-5 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Link to="/privacy" onClick={() => setOpen(false)} className="hover:text-[var(--accent-cyan)]">Privacy Policy</Link>
            <Link to="/terms" onClick={() => setOpen(false)} className="hover:text-[var(--accent-cyan)]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LiquidGlassNav;