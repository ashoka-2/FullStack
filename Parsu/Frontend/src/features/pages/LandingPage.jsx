import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  RiArrowRightLine, RiCheckLine, RiLockLine, RiShieldCheckLine, RiCpuLine, RiGlobalLine, RiMailLine,
  RiShareLine, RiMicLine, RiArrowDownSLine, RiExternalLinkLine, RiFileTextLine, RiCustomerService2Line,
} from '@remixicon/react';
import LiquidGlassNav from '../Components/LiquidGlassNav';
import HeroGradientBackground from '../Components/HeroGradientBackground';
import HeroWorkspacePreview from '../Components/HeroWorkspacePreview';
import { PillBadge } from '../Components/PillButton';
import Footer from '../Components/Footer';
import PrimaryButton from '../Components/PrimaryButton';
import useSEO from '../../utils/useSEO';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';
import { BlobBackground, IntegrationsStrip, SupportCard, EXTRA_FAQ } from './LandingPageExtras';

gsap.registerPlugin(ScrollTrigger);

const SHAPE = '63% 37% 54% 46% / 55% 48% 52% 45%';
const DISPLAY = "'Bricolage Grotesque','Outfit',system-ui,sans-serif";

/* Figma-style blob: saturated shape + lighter copy of the same shape, layered blur */
const Glow = ({ className = '' }) => (
  <div aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee] via-[#38bdf8] to-[#1e3a8a] opacity-30 dark:opacity-35 blur-[90px]" style={{ borderRadius: SHAPE }} />
    <div className="absolute inset-[22%] bg-gradient-to-tr from-white via-[#cffafe] to-[#7dd3fc] dark:from-[#a5f3fc] dark:via-[#67e8f9] dark:to-[#38bdf8] opacity-60 dark:opacity-30 blur-[45px]" style={{ borderRadius: SHAPE }} />
  </div>
);

const Split = ({ text }) =>
  text.split(' ').map((w, i) => (
    <span key={i} className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0">
      {[...w].map((c, j) => <span key={j} className="hc inline-block will-change-transform">{c}</span>)}
    </span>
  ));

const PANELS = [
  { n: '01', icon: RiCpuLine, title: 'Every top model, one chat', desc: 'Switch between Gemini, Claude, GPT-4o and DeepSeek mid-conversation without losing context.', chips: ['Gemini', 'Claude', 'GPT-4o', 'DeepSeek'], a: 'from-[#22d3ee] via-[#38bdf8] to-[#1e3a8a]', b: 'from-white via-[#cffafe] to-[#7dd3fc]' },
  { n: '02', icon: RiGlobalLine, title: 'Answers with sources', desc: 'Live web search returns citations you can click, so you can check every claim yourself.', chips: ['Live search', 'Source links', 'Timestamps'], a: 'from-[#2dd4bf] via-[#22d3ee] to-[#0e7490]', b: 'from-white via-[#ccfbf1] to-[#67e8f9]' },
  { n: '03', icon: RiMailLine, title: 'Works with Google', desc: 'Connect Gmail, Calendar and Drive when you want. Drafts and events wait for your approval.', chips: ['Gmail', 'Calendar', 'Drive'], a: 'from-[#38bdf8] via-[#60a5fa] to-[#1d4ed8]', b: 'from-white via-[#e0f2fe] to-[#93c5fd]' },
  { n: '04', icon: RiShareLine, title: 'Publish to seven networks', desc: 'Write once, tailor it per platform, then post or schedule to Instagram, X, LinkedIn and more.', chips: ['Instagram', 'X', 'LinkedIn', 'YouTube'], a: 'from-[#67e8f9] via-[#38bdf8] to-[#0369a1]', b: 'from-white via-[#cffafe] to-[#a5f3fc]' },
  { n: '05', icon: RiMicLine, title: 'Talk to it', desc: 'Voice conversations with live captions, plus memory that remembers your documents and preferences.', chips: ['Voice', 'Live captions', 'Memory'], a: 'from-[#22d3ee] via-[#0ea5e9] to-[#164e63]', b: 'from-white via-[#cffafe] to-[#38bdf8]' },
];

const STATS = [
  { end: 4, suffix: '+', label: 'AI models' },
  { end: 7, suffix: '', label: 'Social networks' },
  { end: 4, suffix: '', label: 'Google integrations' },
  { end: 256, suffix: '-bit', label: 'AES encryption' },
];

const SCOPES = [
  ['Google Sign-In (openid, profile, email)', 'Verifies who you are and creates your private workspace.'],
  ['Gmail', 'Summarizes mail and drafts replies. Nothing is sent until you approve it.'],
  ['Google Calendar', 'Checks availability and creates the events you ask for.'],
  ['Google Drive', 'Reads files you choose and saves documents you generate.'],
  ['YouTube', 'Uploads videos you choose to your own channel.'],
];

const FAQ = [
  { q: 'What is PARSU AI?', a: 'A chat workspace that combines leading AI models with live web search, memory, Google Workspace and social publishing.' },
  { q: 'Why does PARSU AI ask for Google permissions?', a: 'Sign-in uses basic profile scopes. Gmail, Calendar, Drive and YouTube are optional, separate connections that you approve one by one.' },
  { q: 'How does PARSU AI handle Google user data?', a: "Use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. Google data is never sold or used to train public models." },
  { q: 'Can I revoke access?', a: 'Yes. Disconnect any integration in Settings, or revoke access at myaccount.google.com/permissions at any time.' },
  ...EXTRA_FAQ,
];

const MANIFESTO = 'Stop switching tabs. Ask once, and PARSU AI researches it, writes it, and gets it ready to publish.'.split(' ');
const BAND = ['Research', 'Write', 'Publish', 'Repeat'];

const LandingPage = () => {
  const user = useSelector((s) => s.auth?.user);
  useSEO({
    title: 'PARSU AI | Multi-Model AI Workspace for Research, Writing & Publishing',
    description: 'PARSU AI combines Gemini, Claude, GPT-4o and DeepSeek with live web search, Google Workspace integration and social publishing in one chat workspace.',
    canonical: '/',
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [openFaq, setOpenFaq] = useState(0);
  const location = useLocation();
  const lenis = useLenis(() => ScrollTrigger.update());
  const rootRef = useRef(null);

  useEffect(() => {
    if (document.getElementById('parsu-hero-fonts')) return;
    const l = document.createElement('link');
    l.id = 'parsu-hero-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const t = setTimeout(() => {
      const el = document.getElementById(location.hash.slice(1));
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -90 });
      else el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(t);
  }, [location.hash, lenis]);

  useEffect(() => {
    const d = document.documentElement;
    d.classList.toggle('dark', theme !== 'light');
    d.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    const next = theme === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition) return setTheme(next);
    document.documentElement.style.setProperty('--click-x', `${e?.clientX ?? window.innerWidth / 2}px`);
    document.documentElement.style.setProperty('--click-y', `${e?.clientY ?? 32}px`);
    document.startViewTransition(() => setTheme(next));
  };

  useEffect(() => {
    const root = rootRef.current;
    const q = (s) => gsap.utils.toArray(s, root);
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1024px)', mouse: '(hover: hover) and (pointer: fine)' }, (ctx) => {
      const { motion, desktop, mouse } = ctx.conditions;
      if (!motion) return;
      const off = [];
      const on = (el, ev, fn) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };

      /* â”€â”€ HERO intro â”€â”€ */
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.hero-badge', { y: -20, opacity: 0, scale: 0.85, duration: 0.7, delay: 0.1 })
        .from('.hc', { yPercent: 120, rotateX: -70, opacity: 0, duration: 1.1, stagger: 0.022, ease: 'expo.out', transformOrigin: '50% 100%' }, '-=0.4')
        .from('.hero-line2', { yPercent: 110, rotate: 2, opacity: 0, filter: 'blur(14px)', duration: 1.2, ease: 'expo.out' }, '-=0.8')
        .from('.hero-subtitle', { y: 20, opacity: 0, filter: 'blur(8px)', duration: 0.8 }, '-=0.7')
        .from('.hero-ctas', { y: 20, opacity: 0, scale: 0.9, duration: 0.8, ease: 'back.out(1.6)' }, '-=0.6')
        .from('.hero-trust span', { y: 12, opacity: 0, duration: 0.5, stagger: 0.07 }, '-=0.5')
        .from('.hero-preview', { y: 90, opacity: 0, duration: 1.2, ease: 'power3.out' }, '-=0.5');

      gsap.to('.hero-copy', { y: -70, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.fromTo('.hero-preview-tilt', { rotateX: 12, scale: 0.94 }, { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.hero-preview', start: 'top 95%', end: 'top 40%', scrub: 0.6 } });

      if (mouse) {
        const hero = root.querySelector('.hero');
        const spot = root.querySelector('.hero-spot');
        gsap.set(spot, { xPercent: -50, yPercent: -50 });
        const sx = gsap.quickTo(spot, 'x', { duration: 0.7, ease: 'power3' });
        const sy = gsap.quickTo(spot, 'y', { duration: 0.7, ease: 'power3' });
        const bx = gsap.quickTo('.hero-bg', 'x', { duration: 1.2, ease: 'power3' });
        const by = gsap.quickTo('.hero-bg', 'y', { duration: 1.2, ease: 'power3' });
        on(hero, 'pointermove', (e) => {
          const r = hero.getBoundingClientRect();
          sx(e.clientX - r.left); sy(e.clientY - r.top);
          bx(-(e.clientX / window.innerWidth - 0.5) * 30); by(-(e.clientY / window.innerHeight - 0.5) * 20);
        });

        // headline letters lift on hover
        on(root.querySelector('.hero-title'), 'pointerover', (e) => {
          const c = e.target.closest('.hc');
          if (!c) return;
          gsap.timeline({ overwrite: 'auto' })
            .to(c, { y: -12, rotate: gsap.utils.random(-6, 6), duration: 0.22, ease: 'power2.out' })
            .to(c, { y: 0, rotate: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        });

        // magnetic CTA
        const cta = root.querySelector('.hero-cta-mag');
        on(cta, 'pointermove', (e) => { const r = cta.getBoundingClientRect(); gsap.to(cta, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.22, duration: 0.3 }); });
        on(cta, 'pointerleave', () => gsap.to(cta, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));

        // preview follows pointer in 3D
        const pv = root.querySelector('.hero-preview');
        const pp = root.querySelector('.preview-pointer');
        on(pv, 'pointermove', (e) => { const r = pv.getBoundingClientRect(); gsap.to(pp, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 6, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 5, duration: 0.5, ease: 'power2.out' }); });
        on(pv, 'pointerleave', () => gsap.to(pp, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' }));
      }

      /* â”€â”€ BAND + MANIFESTO â”€â”€ */
      gsap.to('.band-track', { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
      q('.band-word').forEach((w) => {
        on(w, 'pointerenter', () => gsap.to(w, { skewX: -10, scale: 1.05, duration: 0.3, ease: 'power2.out' }));
        on(w, 'pointerleave', () => gsap.to(w, { skewX: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
      });
      gsap.fromTo('.mw', { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 50%', scrub: true } });

      /* â”€â”€ STATS: count up + lift â”€â”€ */
      q('.stat-num').forEach((el) => {
        const end = Number(el.dataset.end); const suf = el.dataset.suffix; const o = { v: 0 };
        el.textContent = `0${suf}`;
        ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = `${Math.round(o.v)}${suf}`; } }) });
      });

      /* â”€â”€ SHOWCASE: pinned horizontal (desktop) + blob parallax per panel â”€â”€ */
      if (desktop) {
        const track = root.querySelector('.h-track');
        const dist = () => track.scrollWidth - window.innerWidth;
        gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.h-pin', pin: true, scrub: 0.6, start: 'top top', end: () => `+=${dist()}`, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (s) => gsap.set('.h-bar', { scaleX: s.progress }) } });
      }
      if (mouse) {
        q('.panel').forEach((p) => {
          const blobs = p.querySelectorAll('.p-blob');
          const icon = p.querySelector('.p-icon');
          on(p, 'pointermove', (e) => {
            const r = p.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5;
            blobs.forEach((b) => gsap.to(b, { x: px * -60 * b.dataset.d, y: py * -60 * b.dataset.d, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }));
          });
          on(p, 'pointerenter', () => gsap.to(icon, { rotate: 12, scale: 1.12, duration: 0.4, ease: 'back.out(2)' }));
          on(p, 'pointerleave', () => { gsap.to(blobs, { x: 0, y: 0, duration: 0.9, ease: 'power3.out' }); gsap.to(icon, { rotate: 0, scale: 1, duration: 0.5 }); });
        });
      }

      /* â”€â”€ Generic micro-interactions â”€â”€ */
      if (mouse) {
        q('[data-lift]').forEach((el) => {
          on(el, 'pointerenter', () => gsap.to(el, { y: -6, scale: 1.02, duration: 0.35, ease: 'power3.out' }));
          on(el, 'pointerleave', () => gsap.to(el, { y: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' }));
        });
        q('[data-nudge]').forEach((el) => {
          on(el, 'pointerenter', () => gsap.to(el, { x: 8, duration: 0.3, ease: 'power3.out' }));
          on(el, 'pointerleave', () => gsap.to(el, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }));
        });
        q('.faq-arrow-host').forEach((el) => {
          const a = el.querySelector('.faq-arrow');
          on(el, 'pointerenter', () => gsap.fromTo(a, { y: 0 }, { y: 4, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut' }));
        });
        const card = root.querySelector('.cta-card');
        const glow = root.querySelector('.cta-glow');
        gsap.set(glow, { xPercent: -50, yPercent: -50 });
        const gx = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' });
        const gy = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' });
        on(card, 'pointermove', (e) => { const r = card.getBoundingClientRect(); gx(e.clientX - r.left); gy(e.clientY - r.top); });
        const cb = root.querySelector('.cta-btn-mag');
        on(cb, 'pointermove', (e) => { const r = cb.getBoundingClientRect(); gsap.to(cb, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.2, duration: 0.3 }); });
        on(cb, 'pointerleave', () => gsap.to(cb, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
      }

      /* Slow breathing blobs in the CTA + scroll reveals */
      q('.cta-blob').forEach((b, i) => gsap.to(b, { borderRadius: '38% 62% 47% 53% / 44% 56% 44% 56%', rotate: i ? -12 : 12, duration: 8 + i * 2, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
      q('.reveal').forEach((el) => gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => off.forEach((fn) => fn());
    }, root);
    return () => mm.revert();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(t);
  }, [openFaq]);

  return (
    <div ref={rootRef} className="min-h-screen bg-[var(--bg-primary)] text-zinc-900 dark:text-zinc-100 font-sans antialiased overflow-x-hidden relative selection:bg-[var(--accent-cyan)]/30">
      <style>{`
        .parsu-shine{background-image:linear-gradient(105deg,#0e7490 0%,#22b8cf 22%,#7dd3fc 45%,#0891b2 70%,#22d3ee 100%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:parsuShine 7s ease-in-out infinite;filter:drop-shadow(0 6px 24px rgba(32,184,205,.28))}
        .dark .parsu-shine{background-image:linear-gradient(105deg,#a5f3fc 0%,#22d3ee 22%,#f0fdff 45%,#38bdf8 70%,#67e8f9 100%);filter:drop-shadow(0 6px 30px rgba(34,211,238,.35))}
        @keyframes parsuShine{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @media (prefers-reduced-motion:reduce){.parsu-shine{animation:none}}
      `}</style>

      <LiquidGlassNav theme={theme} toggleTheme={toggleTheme} />

      {/* HERO â€” compact top spacing so the CTA is visible without scrolling */}
      <section className="hero relative isolate overflow-hidden pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="hero-bg absolute inset-0 will-change-transform"><HeroGradientBackground /></div>
        <div className="absolute inset-0 opacity-80"><BlobBackground /></div>
        <div className="hero-spot pointer-events-none absolute left-0 top-0 z-0 hidden lg:block h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.22), transparent 65%)' }} />

        <div className="hero-copy relative z-10 mx-auto max-w-5xl text-center">
          <div className="hero-badge mb-5 inline-flex">
            <PillBadge variant="accent" className="py-1.5 px-4 backdrop-blur-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping" />
              <span className="text-xs sm:text-[13px] font-semibold">Research, write and publish from one chat</span>
            </PillBadge>
          </div>

          <h1 className="hero-title mb-5 px-1 text-[clamp(2.3rem,6.6vw,5.4rem)] font-extrabold leading-[1.04] tracking-[-0.045em] text-zinc-900 dark:text-white" style={{ fontFamily: DISPLAY, perspective: 800 }} aria-label="Search deeper. Think faster. Publish everywhere.">
            <span aria-hidden="true" className="block overflow-hidden pb-[0.12em] -mb-[0.12em]"><Split text="Search deeper. Think faster." /></span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.22em] -mb-[0.22em] mt-1">
              <span className="hero-line2 parsu-shine inline-block px-[0.06em] italic font-normal text-[1.12em] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: "'Instrument Serif','Times New Roman',serif" }}>Publish everywhere.</span>
            </span>
          </h1>

          <p className="hero-subtitle mx-auto mb-7 max-w-2xl px-2 text-[15px] sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            PARSU AI brings Gemini, Claude, GPT-4o and DeepSeek together with live web search, memory, Google Workspace and publishing to seven social networks.
          </p>

          <div className="hero-ctas mb-5 flex justify-center">
            <div className="hero-cta-mag inline-block">
              <PrimaryButton to={user ? '/ai' : '/auth?mode=register'} size="hero" icon={RiArrowRightLine} iconPosition="right">
                {user ? 'Open your workspace' : 'Get started free'}
              </PrimaryButton>
            </div>
          </div>

          <div className="hero-trust flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs font-medium text-zinc-900 dark:text-zinc-100">
            {['Free tier included', 'No credit card', 'Sign in with Google'].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500" />{t}</span>
            ))}
            <span className="flex items-center gap-1.5"><RiLockLine size={14} className="text-emerald-500" />Encrypted in transit and at rest</span>
          </div>
        </div>

        <div id="workspace" className="hero-preview relative z-10 mx-auto mt-12 sm:mt-16 max-w-4xl scroll-mt-24" style={{ perspective: 1400 }}>
          <div className="hero-preview-tilt" style={{ transformOrigin: '50% 100%' }}>
            <div className="preview-pointer" style={{ transformStyle: 'preserve-3d' }}><HeroWorkspacePreview /></div>
          </div>
        </div>
      </section>

      {/* KINETIC BAND */}
      <div className="band relative z-10 overflow-hidden border-y border-zinc-200/80 dark:border-white/5 py-6 sm:py-8">
        <div aria-hidden="true" className="band-track flex w-max gap-10 whitespace-nowrap font-display text-[clamp(3rem,10vw,8rem)] font-black leading-none tracking-tight">
          {[...BAND, ...BAND, ...BAND].map((w, i) => (
            <span key={i} className={`band-word inline-block ${i % 2 ? 'text-zinc-900 dark:text-white' : 'text-transparent'}`} style={i % 2 ? undefined : { WebkitTextStroke: '1.5px var(--accent-cyan)' }}>{w}</span>
          ))}
        </div>
      </div>

      {/* MANIFESTO */}
      <section className="manifesto relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-24 sm:py-36">
        <p className="font-display text-[clamp(1.75rem,5vw,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-zinc-900 dark:text-white">
          {MANIFESTO.map((w, i) => <span key={i} className="mw inline-block mr-[0.28em]">{w}</span>)}
        </p>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="reveal mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} data-lift className="min-w-0 rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-5 sm:p-7 text-center backdrop-blur-xl shadow-sm">
              <div className="stat-num font-display font-black tabular-nums whitespace-nowrap leading-none tracking-tight text-zinc-900 dark:text-white text-[clamp(1.9rem,6vw,3.4rem)]" data-end={s.end} data-suffix={s.suffix}>{s.end}{s.suffix}</div>
              <p className="mt-2 text-[11px] sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PINNED HORIZONTAL SHOWCASE */}
      <section id="features" className="relative scroll-mt-24 overflow-hidden">
        <div className="h-pin relative py-16 lg:flex lg:h-screen lg:items-center lg:py-0">
          <Glow className="-left-[10%] top-[10%] h-[60%] w-[50%]" />
          <div className="h-track flex w-full flex-col gap-6 px-4 sm:px-6 lg:w-max lg:flex-row lg:items-center lg:gap-10 lg:px-[8vw]">
            <div className="pb-2 lg:w-[30vw] lg:shrink-0">
              <PillBadge variant="accent" className="mb-4"><RiCpuLine size={14} /><span>What it does</span></PillBadge>
              <h2 className="font-display text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight text-zinc-900 dark:text-white">One workspace.<br />Five superpowers.</h2>
              <p className="mt-4 hidden text-sm text-zinc-500 dark:text-zinc-400 lg:block">Keep scrolling to move across</p>
            </div>
            {PANELS.map((p) => {
              const Icon = p.icon;
              return (
                <article key={p.n} className="panel relative h-[420px] w-full shrink-0 overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-white/10 bg-white dark:bg-[var(--bg-card)] lg:h-[68vh] lg:w-[min(62vw,760px)]">
                  <div aria-hidden="true" className="absolute inset-0">
                    <div data-d="1" className={`p-blob absolute -top-1/3 -right-1/4 h-[90%] w-[75%] bg-gradient-to-br ${p.a} opacity-55 blur-[70px]`} style={{ borderRadius: SHAPE }} />
                    <div data-d="1.6" className={`p-blob absolute -top-1/4 -right-[8%] h-[55%] w-[45%] bg-gradient-to-tr ${p.b} opacity-70 dark:opacity-50 blur-[40px]`} style={{ borderRadius: SHAPE }} />
                    <div className="absolute inset-0 opacity-40 dark:opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(${GRAIN_PATTERN_DATA})`, backgroundSize: '160px 160px' }} />
                  </div>
                  <div className="relative z-10 flex h-full flex-col justify-between p-7 sm:p-10">
                    <div className="flex items-start justify-between">
                      <span className="font-display text-6xl sm:text-7xl font-black leading-none text-transparent" style={{ WebkitTextStroke: '1.5px var(--accent-cyan)' }}>{p.n}</span>
                      <span className="p-icon grid h-12 w-12 place-items-center rounded-2xl border border-white/40 bg-white/50 dark:bg-white/10 text-[var(--accent-cyan)] backdrop-blur-md"><Icon size={24} /></span>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{p.title}</h3>
                      <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{p.desc}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {p.chips.map((c) => <span key={c} className="rounded-full border border-zinc-300/70 dark:border-white/15 bg-white/60 dark:bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 backdrop-blur">{c}</span>)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="absolute bottom-10 left-[8vw] right-[8vw] hidden h-[2px] bg-zinc-200 dark:bg-white/10 lg:block">
            <div className="h-bar h-full origin-left bg-[var(--accent-cyan)]" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      </section>

      {/* GOOGLE DATA TRANSPARENCY (keep for brand verification; list only scopes you request) */}
      <section id="privacy" className="relative scroll-mt-24 overflow-hidden border-t border-zinc-200/80 dark:border-white/5 px-4 sm:px-6 py-20 sm:py-28">
        <Glow className="-right-[10%] top-0 h-[70%] w-[45%]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="reveal mb-10 text-center">
            <PillBadge variant="accent" className="mb-4"><RiShieldCheckLine size={14} /><span>Privacy and Google data</span></PillBadge>
            <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">How we use your Google data</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">Each permission is optional, requested only when you connect that feature, and used only for what is described here.</p>
          </div>
          <div className="reveal rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-5 sm:p-8 backdrop-blur-xl">
            <div className="space-y-3">
              {SCOPES.map(([name, why]) => (
                <div key={name} data-nudge className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-white/[0.02] p-4">
                  <p className="font-mono text-xs font-bold text-zinc-900 dark:text-white">{name}</p>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">{why}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-2xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/[0.07] p-4 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              PARSU AI's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold underline text-cyan-700 dark:text-cyan-300">Google API Services User Data Policy<RiExternalLinkLine size={12} /></a>, including the Limited Use requirements. Google user data is not sold, not used for advertising, and not used to train public models.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-200 dark:border-white/10 pt-5 text-sm font-semibold">
              <Link to="/privacy" className="inline-flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 hover:underline"><RiFileTextLine size={15} />Privacy Policy</Link>
              <Link to="/terms" className="inline-flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 hover:underline"><RiFileTextLine size={15} />Terms of Service</Link>
              <Link to="/contact" className="inline-flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 hover:underline"><RiCustomerService2Line size={15} />Contact</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-4xl border-t border-zinc-200/80 dark:border-white/5 px-4 sm:px-6 py-20 sm:py-28">
        <div className="reveal mb-10 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className={`reveal overflow-hidden rounded-2xl border transition-colors ${open ? 'border-[var(--accent-cyan)]/50 bg-white dark:bg-white/[0.06]' : 'border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03]'}`}>
                <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : i)} className="faq-arrow-host flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-display text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  <span>{item.q}</span>
                  <span className="faq-arrow shrink-0"><RiArrowDownSLine size={20} className={`transition-transform duration-300 ${open ? 'rotate-180 text-[var(--accent-cyan)]' : 'text-zinc-400'}`} /></span>
                </button>
                <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0 }}>
                  <p className="border-t border-zinc-100 dark:border-white/5 px-6 pb-5 pt-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
        <SupportCard />
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6"><IntegrationsStrip /></div>

      {/* FINAL CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-24">
        <div className="reveal cta-card relative overflow-hidden rounded-[2.5rem] border border-zinc-200 dark:border-white/10 bg-white dark:bg-[var(--bg-card)] text-center">
          <div aria-hidden="true" className="absolute inset-0">
            <div className="cta-blob absolute -top-1/3 -left-1/5 h-[120%] w-[70%] bg-gradient-to-br from-[#22d3ee] via-[#38bdf8] to-[#1e3a8a] opacity-40 dark:opacity-45 blur-[80px]" style={{ borderRadius: SHAPE }} />
            <div className="cta-blob absolute -bottom-1/3 -right-1/5 h-[110%] w-[65%] bg-gradient-to-tl from-[#7dd3fc] via-[#22d3ee] to-[#0e7490] opacity-40 dark:opacity-40 blur-[80px]" style={{ borderRadius: SHAPE }} />
            <div className="absolute left-1/4 top-1/4 h-[45%] w-[40%] rounded-full bg-white/60 dark:bg-white/15 blur-[60px]" />
            <div className="cta-glow absolute left-0 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.35), transparent 65%)' }} />
            <div className="absolute inset-0 opacity-40 dark:opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(${GRAIN_PATTERN_DATA})`, backgroundSize: '160px 160px' }} />
          </div>
          <div className="relative z-10 px-6 py-16 sm:px-16 sm:py-24">
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-zinc-900 dark:text-white">Ready when you are.</h2>
            <p className="mx-auto mt-4 mb-9 max-w-xl text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">Start free, connect only the tools you choose, and disconnect any time.</p>
            <div className="cta-btn-mag inline-block">
              <PrimaryButton to={user ? '/ai' : '/auth?mode=register'} size="lg" icon={RiArrowRightLine} iconPosition="right">
                {user ? 'Open your workspace' : 'Get started free'}
              </PrimaryButton>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              {['Free tier included', 'No credit card required', 'Revoke access anytime'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500" />{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;