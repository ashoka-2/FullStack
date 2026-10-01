import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import {
  RiSparkling2Line,
  RiSearchLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiCpuLine,
  RiShareLine,
  RiLockLine,
  RiMicLine,
  RiDatabase2Line,
  RiCheckLine,
  RiFileTextLine,
  RiGlobalLine,
  RiFolderImageLine,
  RiQuestionLine,
  RiMailLine,
  RiFlashlightLine,
  RiTerminalBoxLine,
  RiTimeLine,
  RiSendPlane2Fill,
  RiUserLine,
  RiCalendarLine,
  RiDriveLine,
  RiYoutubeLine,
  RiInstagramLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiFacebookCircleLine,
  RiPinterestLine,
  RiArrowDownSLine,
  RiExternalLinkLine,
  RiCustomerService2Line,
  RiInformationLine,
  RiShieldKeyholeLine,
  RiCheckboxCircleLine,
  RiArrowUpLine,
  RiBrainLine,
  RiStackLine,
  RiEyeLine,
  RiCommandLine,
  RiCodeSSlashLine,
  RiVoiceprintLine,
} from '@remixicon/react';
import ParsuLogo from '../Components/ParsuLogo';
import HeroGradientBackground from '../Components/HeroGradientBackground';
import HeroWorkspacePreview from '../Components/HeroWorkspacePreview';
import LiquidGlassNav from '../Components/LiquidGlassNav';
import { PillBadge } from '../Components/PillButton';
import Footer from '../Components/Footer';
import useSEO from '../../utils/useSEO';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';
import { HeroTitle, StatsStrip, IntegrationsStrip, SupportCard, EXTRA_FAQ, FinalCtaCard } from './LandingPageExtras';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ═══════════════════════════════════════════════════════════════════════
   UTILITY — Magnetic hover effect for interactive elements
   ═══════════════════════════════════════════════════════════════════════ */
const useMagneticHover = (ref, strength = 0.3) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      gsap.to(el, {
        x: (e.clientX - cx) * strength,
        y: (e.clientY - cy) * strength,
        duration: 0.4,
        ease: 'power2.out',
      });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [ref, strength]);
};

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — AnimatedCounter: Counts up on scroll
   ═══════════════════════════════════════════════════════════════════════ */
const AnimatedCounter = ({ end, suffix = '', prefix = '', label, duration = 2 }) => {
  const ref = useRef(null);
  const numRef = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const counter = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(counter, {
            val: end,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
              if (numRef.current) numRef.current.textContent = `${prefix}${Math.round(counter.val)}${suffix}`;
            },
          });
          gsap.from(el, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' });
        },
      });
    });
    return () => ctx.revert();
  }, [end, suffix, prefix, duration]);

  return (
    <div ref={ref} className="text-center">
      <div ref={numRef} className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight">
        {prefix}0{suffix}
      </div>
      <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — RevealText: Text that reveals char by char on scroll
   ═══════════════════════════════════════════════════════════════════════ */
const RevealText = ({ children, className = '', as: Tag = 'p' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const text = el.textContent;
      el.textContent = '';
      const chars = text.split('').map((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = '0.1';
        span.style.display = 'inline';
        el.appendChild(span);
        return span;
      });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        end: 'bottom 40%',
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          chars.forEach((span, i) => {
            const charProgress = (progress - i / chars.length) * chars.length;
            span.style.opacity = String(Math.max(0.1, Math.min(1, charProgress)));
          });
        },
      });
    });
    return () => ctx.revert();
  }, [children]);

  return <Tag ref={ref} className={className}>{children}</Tag>;
};

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT — ParallaxImage: Parallax div on scroll
   ═══════════════════════════════════════════════════════════════════════ */
const ParallaxSection = ({ children, className = '', speed = 0.15 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: -speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, [speed]);
  return <div ref={ref} className={className}>{children}</div>;
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN — LandingPage
   ═══════════════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const user = useSelector((state) => state.auth?.user);
  useSEO({
    title: 'PARSU AI — Autonomous Multi-Model Intelligence & Creative Studio',
    description: 'PARSU AI is an autonomous AI workspace combining Google Gemini, Claude 3.5, and GPT-4o with real-time web search, Google Workspace integration (Gmail, Calendar, Drive), and 1-click social media distribution.',
    canonical: '/',
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('workspace');
  const [openFaq, setOpenFaq] = useState(0);
  const location = useLocation();
  const lenis = useLenis();
  const containerRef = useRef(null);
  const heroCtaRef = useRef(null);

  useMagneticHover(heroCtaRef, 0.15);

  // Smooth scroll handler for hash anchors
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const findTarget = () =>
        document.getElementById(targetId) ||
        (targetId === 'preview' ? document.getElementById('workspace') : null) ||
        (targetId === 'workspace' ? document.getElementById('preview') : null) ||
        (targetId === 'privacy' ? document.getElementById('transparency') : null) ||
        (targetId === 'transparency' ? document.getElementById('privacy') : null) ||
        (targetId === 'google-disclosure' ? document.getElementById('transparency') : null);

      const scrollToTarget = () => {
        const el = findTarget();
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -90 });
          else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
      const t1 = setTimeout(scrollToTarget, 80);
      const t2 = setTimeout(scrollToTarget, 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [location.hash, location.pathname, lenis]);

  // Theme toggle
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
    if (!document.startViewTransition) { setTheme(nextTheme); return; }
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? 32;
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);
    document.startViewTransition(() => setTheme(nextTheme));
  };

  /* ── GSAP Master Animation Setup ─────────────────────────────────── */
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      // ─ 1. HERO: Cinematic Staggered Entrance ─
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      heroTl
        .from('.hero-badge', { y: -30, opacity: 0, scale: 0.8, duration: 0.8, delay: 0.15 })
        .from('.hero-word', { y: 80, opacity: 0, rotationX: 30, duration: 0.9, stagger: 0.08, transformOrigin: 'bottom center' }, '-=0.5')
        .from('.hero-gradient-line', { y: 40, opacity: 0, scale: 0.96, duration: 0.9, ease: 'power3.out' }, '-=0.6')
        .from('.hero-subtitle', { y: 30, opacity: 0, filter: 'blur(8px)', duration: 0.8 }, '-=0.7')
        .from('.hero-ctas', { y: 25, opacity: 0, scale: 0.95, duration: 0.7 }, '-=0.5')
        .from('.hero-trust-item', { y: 15, opacity: 0, duration: 0.4, stagger: 0.06 }, '-=0.4')
        .from('.hero-workspace-box', { y: 60, opacity: 0, scale: 0.96, duration: 1, ease: 'power3.out' }, '-=0.3');

      // ─ 2. Ambient floating orbs ─
      gsap.to('.ambient-orb-1', { y: -25, x: 15, rotation: 6, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.ambient-orb-2', { y: 30, x: -18, rotation: -5, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
      gsap.to('.ambient-orb-3', { y: -15, x: -10, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 });

      // ─ 3. Stats counter section: Horizontal reveal ─
      gsap.from('.stats-section', {
        scrollTrigger: { trigger: '.stats-section', start: 'top 85%', once: true },
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      });

      // ─ 4. "What is PARSU AI?" – Stagger reveal ─
      gsap.from('.platform-title-word', {
        scrollTrigger: { trigger: '.platform-overview', start: 'top 75%', once: true },
        y: 50, opacity: 0, rotationX: 20, duration: 0.7, stagger: 0.07, ease: 'power3.out',
      });

      // ─ 5. Tab showcase card: Slide in from bottom ─
      gsap.utils.toArray('.tab-btn').forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
        });
      });

      // ─ 6. Process steps: Staggered with connected line ─
      gsap.from('.process-step', {
        scrollTrigger: { trigger: '.process-section', start: 'top 70%', once: true },
        y: 60, opacity: 0, scale: 0.9, duration: 0.7, stagger: 0.15, ease: 'power3.out',
      });
      gsap.from('.process-connector', {
        scrollTrigger: { trigger: '.process-section', start: 'top 70%', once: true },
        scaleX: 0, duration: 1, delay: 0.3, ease: 'power2.inOut', transformOrigin: 'left center',
      });

      // ─ 7. Feature cards: Staggered reveal with guaranteed visibility ─
      gsap.fromTo('.feature-card',
        { y: 35, opacity: 0 },
        {
          scrollTrigger: { trigger: '#features', start: 'top 95%', once: true },
          y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out',
          clearProps: 'all',
        }
      );

      // 3D tilt on hover for feature cards
      gsap.utils.toArray('.feature-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(card, {
            rotationY: px * 6,
            rotationX: -py * 6,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 800,
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.5, ease: 'power2.out' });
        });
      });

      // ─ 8. Comparison table: Row stagger ─
      gsap.fromTo('.comparison-row',
        { x: -20, opacity: 0 },
        {
          scrollTrigger: { trigger: '.comparison-section', start: 'top 85%', once: true },
          x: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out',
          clearProps: 'all',
        }
      );

      // ─ 9. FAQ: Accordion cards reveal with guaranteed visibility ─
      gsap.fromTo('.faq-item',
        { y: 20, opacity: 0 },
        {
          scrollTrigger: { trigger: '.faq-section', start: 'top 95%', once: true },
          y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out',
          clearProps: 'all',
        }
      );

      // ─ 10. Final CTA: Entrance ─
      gsap.fromTo('.final-cta',
        { y: 40, opacity: 0, scale: 0.95 },
        {
          scrollTrigger: { trigger: '.final-cta', start: 'top 90%', once: true },
          y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out',
          clearProps: 'all',
        }
      );

      // ─ 11. Section headers: universal reveal ─
      gsap.utils.toArray('.section-header').forEach((el) => {
        gsap.fromTo(el,
          { y: 25, opacity: 0 },
          {
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
            clearProps: 'all',
          }
        );
      });

      // Refresh ScrollTrigger calculations after initial layout paint
      setTimeout(() => ScrollTrigger.refresh(), 250);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ── Data ──
  const capabilityTabs = {
    workspace: {
      id: 'workspace',
      title: 'Google Workspace',
      badge: 'Productivity Suite',
      headline: 'Gmail, Calendar & Drive — Supercharged with AI',
      desc: 'Connect your personal Google Workspace with dedicated, privacy-respecting permissions. Ask PARSU AI to review unread emails, draft replies via Gmail, schedule meetings on Google Calendar, or summarize PDFs stored on Google Drive.',
      features: [
        'Personal Gmail Integration: Draft, compose, and send emails on demand',
        'Google Calendar Sync: Check availability, schedule meetings, and set reminders',
        'Google Drive File Studio: Upload, read, search, and save research directly to Drive',
        'Creator Studio: Instant 1-click video publishing to YouTube',
      ],
      codeSnippet: `// Natural language command executed by PARSU AI
"Check my Google Calendar for Friday afternoon, draft an email 
to Alex confirming our 3:00 PM strategy call, and save the 
meeting briefing PDF directly to my Google Drive."

✓ Calendar: Verified slot open (2:30 PM - 4:00 PM)
✓ Gmail: Drafted confirmation email with agenda
✓ Drive: Uploaded "Strategy_Briefing_v2.pdf" into PARSU folder`,
      badgeColor: 'text-[#4285F4]',
      glowColor: 'from-[#4285F4]/20 via-[#34A853]/15 to-[#EA4335]/20',
      icon: RiMailLine,
    },
    models: {
      id: 'models',
      title: 'Multi-Model AI',
      badge: 'Universal Brain',
      headline: 'Google Gemini, Claude 3.5 & GPT-4o in One Place',
      desc: 'No more jumping between subscription paywalls. PARSU AI seamlessly orchestrates top foundation models with unified vector memory. Switch models mid-chat or cross-examine answers for unmatched reasoning depth.',
      features: [
        'Google Gemini 2.0 Flash: High-speed multimodal understanding & ultra-low latency',
        'Anthropic Claude 3.5 Sonnet: Industry-standard coding & human-like nuance',
        'OpenAI GPT-4o: Versatile complex reasoning and mathematics',
        'DeepSeek R1: Advanced algorithmic thinking & chain-of-thought analysis',
      ],
      codeSnippet: `// Real-Time Multi-Model Switching
Current Model: Gemini 2.0 Flash (Primary)
Context Memory: 1.2M tokens active
Reasoning Mode: Cross-Model Comparative Synthesis

[Gemini]: Analyzed 240-page technical whitepaper in 1.4s
[Claude]: Generated optimized TypeScript implementation
[Result]: Zero hallucinations, 100% cited across documents`,
      badgeColor: 'text-[var(--accent-cyan)]',
      glowColor: 'from-cyan-500/20 via-teal-500/15 to-blue-500/20',
      icon: RiBrainLine,
    },
    social: {
      id: 'social',
      title: 'Social Studio',
      badge: '1-Click Distribution',
      headline: 'Publish to 7 Major Social Networks Instantly',
      desc: 'Generate viral content tailored for each algorithm. Publish or schedule directly to Instagram, Facebook, X (Twitter), Pinterest, TikTok, LinkedIn, and YouTube without third-party middleman tools.',
      features: [
        'Direct OAuth Connections: Secure official API connections for all platforms',
        'Platform-Tailored Copy: Auto-formats hashtags, character counts, and aspect ratios',
        'Media Pipeline: Integrated photo and video rendering via fast CDN storage',
        'Unified Analytics: Track engagement metrics across all connected accounts',
      ],
      codeSnippet: `// 1-Click Multi-Platform Social Dispatch
Post: "PARSU AI v2.6 is live! Multi-model AI + Google Workspace"
Platforms Selected: [LinkedIn, X, Instagram, YouTube]

✓ LinkedIn: Optimized professional tone with #EnterpriseAI
✓ X (Twitter): Formatted thread under 280 chars with rich card
✓ Instagram: Generated 1080x1080 square preview with hashtags
✓ YouTube: Scheduled announcement Short for 10:00 AM`,
      badgeColor: 'text-sky-500 dark:text-sky-400',
      glowColor: 'from-sky-500/20 via-blue-500/15 to-cyan-500/20',
      icon: RiShareLine,
    },
    agent: {
      id: 'agent',
      title: 'Voice & Agent',
      badge: 'Real-Time Grounding',
      headline: 'Live Web Grounding, Voice Talk & Desktop Actions',
      desc: 'Get up-to-the-minute factual answers backed by authoritative primary sources. Speak naturally with zero-lag neural voice chat and direct your AI assistant to control apps, manage research, and execute tasks.',
      features: [
        'Live Web Crawling: Zero-hallucination fact checking with clickable citations',
        'Neural Voice Conversations: Lifelike voice synthesis with low-latency audio stream',
        'Local App & System Control: Open software, launch websites, and automate workflows',
        'Vector Memory Graph: Remembers past chats, documents, and user preferences',
      ],
      codeSnippet: `// Autonomous Agent Execution Log
User: "Summarize today's stock market tech movements and read it to me"

1. Web Search: Fetched 18 live financial sources (0.32s)
2. Synthesis: Extracted NASDAQ, NVDA, GOOGL movements
3. Audio Stream: Initiated neural voice playback (24kHz HD)
4. Memory: Updated user market watch preferences`,
      badgeColor: 'text-emerald-400',
      glowColor: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/20',
      icon: RiVoiceprintLine,
    },
  };

  const features = [
    {
      icon: RiCpuLine,
      title: 'Multi-Model AI Orchestration',
      desc: 'Seamlessly toggle between Google Gemini 2.0, Claude 3.5 Sonnet, GPT-4o, and DeepSeek with unified vector memory and cross-model reasoning.',
      accent: 'cyan',
      glow: 'from-cyan-500/20 via-sky-500/10 to-transparent',
      border: 'border-cyan-500/20 hover:border-cyan-400/60 dark:border-white/[0.08] dark:hover:border-cyan-400/50',
      iconBox: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-600 dark:text-cyan-400 shadow-cyan-500/10',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      tag: 'Universal LLM',
      chips: ['Gemini 2.0', 'Claude 3.5', 'GPT-4o', 'DeepSeek R1'],
    },
    {
      icon: RiGlobalLine,
      title: 'Real-Time Web Intelligence',
      desc: 'Live fact-checked citations via high-speed web grounding. Get verified answers backed by authoritative primary sources and timestamps.',
      accent: 'emerald',
      glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      border: 'border-emerald-500/20 hover:border-emerald-400/60 dark:border-white/[0.08] dark:hover:border-emerald-400/50',
      iconBox: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      tag: 'Live Web Search',
      chips: ['Live SERP', 'Zero Hallucination', 'Source Links'],
    },
    {
      icon: RiMailLine,
      title: 'Google Workspace Integration',
      desc: 'Direct, user-controlled connection to Gmail, Google Calendar, Google Drive, and YouTube. Automate emails, meetings, and document storage.',
      accent: 'blue',
      glow: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      border: 'border-blue-500/20 hover:border-blue-400/60 dark:border-white/[0.08] dark:hover:border-blue-400/50',
      iconBox: 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400 shadow-blue-500/10',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      tag: 'Workspace Suite',
      chips: ['Gmail Drafts', 'Calendar Sync', 'Drive Storage'],
    },
    {
      icon: RiShareLine,
      title: '1-Click Social Media Studio',
      desc: 'Generate, optimize, and schedule AI content directly to 7 platforms: Instagram, Facebook, X, Pinterest, TikTok, LinkedIn, and YouTube.',
      accent: 'violet',
      glow: 'from-violet-500/20 via-purple-500/10 to-transparent',
      border: 'border-violet-500/20 hover:border-violet-400/60 dark:border-white/[0.08] dark:hover:border-violet-400/50',
      iconBox: 'bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400 shadow-violet-500/10',
      badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      tag: 'Omni-Channel',
      chips: ['7 Networks', 'Auto Aspect Ratio', 'Hashtags'],
    },
    {
      icon: RiDatabase2Line,
      title: 'Vector Knowledge Graph & RAG',
      desc: 'Semantic embeddings remember prior insights, documents, and codebases across conversations without manual re-uploading.',
      accent: 'amber',
      glow: 'from-amber-500/20 via-orange-500/10 to-transparent',
      border: 'border-amber-500/20 hover:border-amber-400/60 dark:border-white/[0.08] dark:hover:border-amber-400/50',
      iconBox: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400 shadow-amber-500/10',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      tag: 'Persistent Memory',
      chips: ['PDF & Docs', 'Semantic Search', 'Vector RAG'],
    },
    {
      icon: RiMicLine,
      title: 'Neural Voice & Interactive Agent',
      desc: 'Fluid voice conversations with streaming word-by-word captions, lifelike neural voice synthesis, and desktop action execution.',
      accent: 'rose',
      glow: 'from-rose-500/20 via-pink-500/10 to-transparent',
      border: 'border-rose-500/20 hover:border-rose-400/60 dark:border-white/[0.08] dark:hover:border-rose-400/50',
      iconBox: 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400 shadow-rose-500/10',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      tag: 'Voice & Desktop',
      chips: ['Low-Latency Voice', 'Live Captions', 'Desktop Actions'],
    },
  ];

  const faqItems = [
    {
      q: 'What exactly is PARSU AI and how does it work?',
      a: 'PARSU AI is an autonomous, multi-model AI workspace and creative studio. It brings together leading foundation models (Google Gemini 2.0, Claude 3.5 Sonnet, GPT-4o, and DeepSeek) with real-time web search, vector memory, Google Workspace integration (Gmail, Calendar, Drive), and 1-click social media publishing across 7 major networks.',
    },
    {
      q: 'Why does PARSU AI request Google OAuth permissions?',
      a: 'Google OAuth is used for two distinct capabilities: (1) Instant, secure sign-in via Google Sign-In, and (2) Optional, user-initiated Google Workspace actions (reading or sending emails via Gmail, scheduling calendar events, and analyzing files in Google Drive). Each integration is fully separate and requires explicit user consent before connecting.',
    },
    {
      q: 'How does PARSU AI comply with the Google API Services User Data Policy?',
      a: "PARSU AI's use and transfer of information received from Google APIs adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements. Your Google user data is NEVER sold, leased, transferred to data brokers, or used to train public machine learning models. All data is protected with hardware-grade AES-256 encryption at rest and TLS 1.3 in transit.",
    },
    {
      q: 'Can I disconnect or revoke Google permissions at any time?',
      a: 'Yes, absolutely. You can disconnect Gmail, Google Calendar, Google Drive, or YouTube with a single click inside PARSU AI Settings (/settings or /social-connections). You can also immediately revoke permissions globally anytime from your Google Account Security Settings at https://myaccount.google.com/permissions.',
    },
    {
      q: 'Which social media platforms can I publish to?',
      a: 'PARSU AI natively connects to 7 platforms: Instagram, Facebook, X (formerly Twitter), Pinterest, TikTok, LinkedIn, and YouTube. You can craft tailored posts with hashtags, media, and scheduling in one centralized hub.',
    },
    {
      q: 'Is there a free tier available?',
      a: 'Yes! PARSU AI provides a generous Free Starter tier with access to core models, live web search, and social connections without requiring any credit card.',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-primary)] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30 antialiased overflow-x-hidden relative"
    >
      {/* ── Navigation ─────── */}
      <LiquidGlassNav theme={theme} toggleTheme={toggleTheme} />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Cinematic reveal with word-by-word stagger
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <HeroGradientBackground />

        {/* Ambient orbs */}
        <div className="ambient-orb-1 absolute top-1/4 left-[8%] w-72 h-72 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
        <div className="ambient-orb-2 absolute top-1/3 right-[10%] w-80 h-80 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
        <div className="ambient-orb-3 absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Trust Badge */}
          <div className="hero-badge inline-flex justify-center mb-7">
            <PillBadge variant="accent" className="shadow-sm shadow-cyan-500/10 py-1.5 px-4 backdrop-blur-xl">
              <RiSparkling2Line size={14} className="text-[var(--accent-cyan)] animate-spin-slow shrink-0" />
              <span className="tracking-wide text-xs sm:text-[13px] font-semibold">
                Autonomous AI Research • Google Workspace • Social Studio
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping ml-1 shrink-0" />
            </PillBadge>
          </div>

          {/* Title — premium animated hero with Bricolage Grotesque + Instrument Serif italic */}
          <HeroTitle />

          {/* Subtitle */}
          <p className="hero-subtitle text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal tracking-[-0.01em] px-2">
            PARSU AI fuses Google Gemini, Claude 3.5, and GPT-4o with real-time web grounding, persistent memory, and unified automation across Gmail, Google Calendar, Drive, and 7 major social networks.
          </p>

          {/* CTA Button — Get Started only, no sign in button */}
          <div className="hero-ctas flex items-center justify-center mb-8 sm:mb-10 w-full mx-auto">
            {user ? (
              <Link
                ref={heroCtaRef}
                to="/ai"
                className="font-display inline-flex items-center justify-center gap-2.5 px-8 sm:px-11 py-4 sm:py-4.5 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.97] transition-all cursor-pointer tracking-tight group"
              >
                <RiSparkling2Line size={19} className="group-hover:rotate-12 transition-transform" />
                <span>Launch PARSU AI Workspace</span>
                <RiArrowRightLine size={19} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
            ) : (
              <Link
                ref={heroCtaRef}
                to="/auth?mode=register"
                className="font-display inline-flex items-center justify-center gap-2.5 px-8 sm:px-12 py-4 sm:py-4.5 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.97] transition-all cursor-pointer tracking-tight group"
              >
                <span>Get Started Free</span>
                <RiArrowRightLine size={19} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Trust Ribbon */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-medium px-2 mb-12 sm:mb-16">
            {[
              { text: 'Free Tier Included', icon: RiCheckLine },
              { text: 'No Credit Card', icon: RiCheckLine },
              { text: 'Google Verified OAuth', icon: RiShieldCheckLine },
              { text: 'AES-256 Encryption', icon: RiLockLine },
            ].map(({ text, icon: Icon }, i) => (
              <span key={i} className="hero-trust-item flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                <Icon size={14} className="text-emerald-500" />
                {text}
              </span>
            ))}
          </div>

          {/* Workspace Preview */}
          <div id="preview" className="hero-workspace-box scroll-mt-24 w-full relative">
            <div id="workspace" className="scroll-mt-24 w-full relative">
              <HeroWorkspacePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS — Responsive counter strip with clamp() sizing
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="stats-section py-16 sm:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <StatsStrip />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT IS PARSU AI? — Platform Overview with Tabs
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="platform-overview py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 section-header">
          <PillBadge variant="accent" className="mb-4">
            <RiInformationLine size={14} />
            <span>Platform Overview</span>
          </PillBadge>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-5 leading-[1.1]">
            {'What is PARSU AI?'.split(' ').map((word, i) => (
              <span key={i} className="platform-title-word inline-block mr-[0.25em]">{word}</span>
            ))}
          </h2>
          <RevealText className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            PARSU AI is an autonomous, multi-model AI workspace designed to unite state-of-the-art reasoning models with your everyday apps. From drafting and scheduling with Google Workspace to publishing across 7 social channels, PARSU AI executes tasks end-to-end.
          </RevealText>
        </div>

        {/* Tab Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {Object.values(capabilityTabs).map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-lg shadow-black/10 dark:shadow-white/10'
                    : 'bg-white/80 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10'
                }`}
              >
                <TabIcon size={16} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Card */}
        {capabilityTabs[activeTab] && (
          <div className="rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${capabilityTabs[activeTab].glowColor} blur-3xl pointer-events-none opacity-40`} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-6 space-y-4">
                <span className={`inline-block text-xs font-bold uppercase tracking-wider ${capabilityTabs[activeTab].badgeColor}`}>
                  {capabilityTabs[activeTab].badge}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {capabilityTabs[activeTab].headline}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {capabilityTabs[activeTab].desc}
                </p>
                <div className="pt-2 space-y-2.5">
                  {capabilityTabs[activeTab].features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <RiCheckboxCircleLine size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Link
                    to={user ? '/ai' : '/auth?mode=register'}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-cyan)] hover:underline group"
                  >
                    <span>Experience this in PARSU AI Workspace</span>
                    <RiArrowRightLine size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Code Terminal */}
              <div className="lg:col-span-6 rounded-2xl bg-zinc-950 border border-zinc-800 p-5 font-mono text-[11px] sm:text-xs text-zinc-300 shadow-inner overflow-x-auto">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80 text-[10px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span>PARSU Engine Console • v2.6</span>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed text-cyan-300/90 font-mono">
                  {capabilityTabs[activeTab].codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3-Step Process with Connected Line
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="process-section py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20 section-header">
          <PillBadge variant="accent" className="mb-4">
            <RiFlashlightLine size={14} />
            <span>Workflow Automation</span>
          </PillBadge>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            How PARSU AI Works
          </h2>
          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400">
            A frictionless three-stage pipeline that bridges conversational intelligence with autonomous real-world execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector lines (hidden on mobile) */}
          <div className="process-connector hidden md:block absolute top-24 left-[33%] right-[33%] h-[2px] bg-gradient-to-r from-[var(--accent-cyan)]/50 via-teal-500/50 to-blue-500/50 z-0" />

          {[
            {
              num: '01', title: 'Multimodal Input & Context', icon: RiMicLine,
              desc: 'Type naturally, speak via real-time neural voice, paste code snippets, or upload PDFs, spreadsheets, and video files directly into your workspace.',
              detail: 'Voice, text, files & vector embeddings',
              bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/20', textClass: 'text-cyan-500 dark:text-cyan-400',
            },
            {
              num: '02', title: 'Consensus & Web Grounding', icon: RiGlobalLine,
              desc: 'PARSU AI queries live web sources for authoritative citations, cross-examines logic with multiple LLMs, and pulls from your persistent cross-chat memory.',
              detail: 'Zero hallucinations • 100% cited',
              bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20', textClass: 'text-teal-500 dark:text-teal-400',
            },
            {
              num: '03', title: '1-Click Execution & Publishing', icon: RiSendPlane2Fill,
              desc: 'Approve drafts to send via Gmail, book slots on Google Calendar, save research to Google Drive, or broadcast updates to 7 social platforms at once.',
              detail: 'Gmail • Calendar • Drive • Socials',
              bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', textClass: 'text-blue-500 dark:text-blue-400',
            },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="process-step relative z-10">
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between h-full group">
                  <div>
                    <div className={`w-14 h-14 rounded-2xl ${step.bgClass} border ${step.borderClass} ${step.textClass} flex items-center justify-center font-display font-black text-lg mb-5 group-hover:scale-110 transition-transform`}>
                      {step.num}
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5 font-sans">
                    <Icon size={13} className={step.textClass} />
                    <span>{step.detail}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES — Bento Grid with 3D Tilt Hover
          ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="scroll-mt-24 py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20 section-header">
          <PillBadge variant="accent" className="mb-4">
            <RiCpuLine size={14} />
            <span>Core Capabilities</span>
          </PillBadge>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            Engineered for Precision & Production
          </h2>
          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400">
            Everything required to synthesize deep research, automate daily productivity, and manage multi-platform distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7" style={{ perspective: '1200px' }}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`feature-card relative p-7 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#0c0d11]/85 backdrop-blur-xl border ${feat.border} shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group overflow-hidden will-change-transform`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Ambient corner glow on hover */}
                <div
                  aria-hidden="true"
                  className={`absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br ${feat.glow} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center ${feat.iconBox} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <Icon size={24} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${feat.badgeClass}`}>
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2.5 tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                    {feat.desc}
                  </p>
                </div>

                {/* Micro feature chips */}
                <div className="relative z-10 pt-4 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap gap-1.5">
                  {feat.chips.map((chip, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-lg bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/50 dark:border-white/[0.05]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMPARISON — Why teams choose PARSU AI
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="comparison-section py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 section-header">
          <PillBadge variant="accent" className="mb-4">
            <RiShieldCheckLine size={14} />
            <span>Competitive Matrix</span>
          </PillBadge>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
            Why Teams Choose PARSU AI
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Compare PARSU AI's all-in-one autonomous workspace against conventional single-model chat interfaces.
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
                  <th className="py-4 px-5 font-bold text-zinc-900 dark:text-white">Capability</th>
                  <th className="py-4 px-5 font-bold text-[var(--accent-cyan)]">PARSU AI</th>
                  <th className="py-4 px-5 font-bold text-zinc-400">Standard AI Chatbots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                {[
                  ['Model Selection', 'Gemini, Claude, GPT & DeepSeek', 'Locked to single vendor'],
                  ['Google Workspace Hub', 'Native Gmail, Calendar & Drive', 'Not supported natively'],
                  ['Social Media Publishing', '1-Click to 7 Social Platforms', 'Copy-paste manual posting'],
                  ['Live Web Grounding', 'Real-time search with citations', 'Stale training cutoff / slow'],
                  ['Data Training on Private Chats', 'Strictly ZERO private training', 'Often opt-in or used for training'],
                  ['Neural Voice Interaction', 'Real-time voice with live captioning', 'Limited or mobile app only'],
                ].map(([cap, parsu, standard], idx) => (
                  <tr key={idx} className="comparison-row hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">{cap}</td>
                    <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <RiCheckLine size={16} className="shrink-0" /> {parsu}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400">{standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ — Interactive Accordion
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="faq-section py-20 sm:py-28 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 section-header">
          <PillBadge variant="accent" className="mb-4">
            <RiQuestionLine size={14} />
            <span>Got Questions?</span>
          </PillBadge>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Everything you need to know about models, security, integrations, and data safety.
          </p>
        </div>

        <div className="space-y-3">
          {[...faqItems, ...EXTRA_FAQ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`faq-item rounded-2xl transition-all duration-200 overflow-hidden border ${
                  isOpen
                    ? 'bg-white dark:bg-white/[0.06] border-[var(--accent-cyan)]/50 shadow-lg shadow-cyan-500/5'
                    : 'bg-white/80 dark:bg-white/[0.03] border-zinc-200/90 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full py-4.5 px-6 text-left font-display font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="leading-snug">{item.q}</span>
                  <RiArrowDownSLine
                    size={20}
                    className={`text-zinc-400 dark:text-zinc-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-[var(--accent-cyan)] dark:text-[var(--accent-cyan)]' : ''
                    }`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? '500px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-white/5">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support card — fills the blank space below FAQ */}
        <SupportCard />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INTEGRATIONS — Infinite marquee of tools & platforms
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <IntegrationsStrip />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA — Premium Figma-style blob gradient card
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center relative z-10">
        <FinalCtaCard user={user} />
      </section>

      {/* ── Official Site Footer ── */}
      <Footer />
    </div>
  );
};

export default LandingPage;
