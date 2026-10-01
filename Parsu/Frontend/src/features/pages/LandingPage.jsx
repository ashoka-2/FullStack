import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
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
  RiLoginCircleLine,
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
  RiCheckboxCircleLine
} from '@remixicon/react';
import ParsuLogo from '../Components/ParsuLogo';
import HeroGradientBackground from '../Components/HeroGradientBackground';
import HeroWorkspacePreview from '../Components/HeroWorkspacePreview';
import LiquidGlassNav from '../Components/LiquidGlassNav';
import { PillBadge } from '../Components/PillButton';
import useSEO from '../../utils/useSEO';

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

  // Smooth scroll handler for hash anchors (#features, #workspace, #privacy, #transparency, #google-disclosure)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const findTarget = () => {
        return (
          document.getElementById(targetId) ||
          (targetId === 'preview' ? document.getElementById('workspace') : null) ||
          (targetId === 'workspace' ? document.getElementById('preview') : null) ||
          (targetId === 'privacy' ? document.getElementById('transparency') : null) ||
          (targetId === 'transparency' ? document.getElementById('privacy') : null) ||
          (targetId === 'google-disclosure' ? document.getElementById('transparency') : null)
        );
      };

      const scrollToTarget = () => {
        const el = findTarget();
        if (el) {
          if (lenis) {
            lenis.scrollTo(el, { offset: -90 });
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };

      const t1 = setTimeout(scrollToTarget, 80);
      const t2 = setTimeout(scrollToTarget, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [location.hash, location.pathname, lenis]);

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
    const y = e?.clientY ?? 32;
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);
    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

  // GSAP Entrance & Ambient Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero text stagger entrance
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-badge', { y: -20, opacity: 0, scale: 0.9, duration: 0.6, delay: 0.1 })
        .from('.hero-title-line', { y: 35, opacity: 0, duration: 0.75, stagger: 0.12 }, '-=0.3')
        .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-ctas', { y: 20, opacity: 0, scale: 0.96, duration: 0.5 }, '-=0.3')
        .from('.hero-trust-ribbon', { opacity: 0, y: 15, duration: 0.5 }, '-=0.2')
        .from('.hero-workspace-box', { opacity: 0, y: 30, duration: 0.85, ease: 'power2.out' }, '-=0.4');

      // 2. Ambient floating orbs animation
      gsap.to('.ambient-float-1', {
        y: -18,
        x: 10,
        rotation: 4,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to('.ambient-float-2', {
        y: 20,
        x: -12,
        rotation: -4,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5
      });

      // 3. Stagger reveal on scroll for features
      const cards = gsap.utils.toArray('.anim-fade-up');
      if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.fromTo(
                entry.target,
                { opacity: 0, y: 35 },
                { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', overwrite: 'auto' }
              );
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        cards.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Capabilities Showcase Tabs Data
  const capabilityTabs = {
    workspace: {
      id: 'workspace',
      title: 'Google Workspace Hub',
      badge: 'Deep Productivity Suite',
      headline: 'Gmail, Google Calendar & Drive — Supercharged with AI',
      desc: 'Connect your personal Google Workspace with dedicated, privacy-respecting permissions. Ask PARSU AI to review unread emails, draft replies via Gmail, schedule meetings on Google Calendar, or summarize PDFs stored on Google Drive.',
      features: [
        'Personal Gmail Integration: Draft, compose, and send emails on demand',
        'Google Calendar Sync: Check availability, schedule meetings, and set reminders',
        'Google Drive File Studio: Upload, read, search, and save research directly to Drive',
        'Creator Studio: Instant 1-click video publishing to YouTube'
      ],
      codeSnippet: `// Natural language command executed by PARSU AI
"Check my Google Calendar for Friday afternoon, draft an email 
to Alex confirming our 3:00 PM strategy call, and save the 
meeting briefing PDF directly to my Google Drive."

✓ Calendar: Verified slot open (2:30 PM - 4:00 PM)
✓ Gmail: Drafted confirmation email with agenda
✓ Drive: Uploaded "Strategy_Briefing_v2.pdf" into PARSU folder`,
      badgeColor: 'text-[#4285F4]',
      glowColor: 'from-[#4285F4]/20 via-[#34A853]/15 to-[#EA4335]/20'
    },
    models: {
      id: 'models',
      title: 'Multi-Model Intelligence',
      badge: 'Universal AI Brain',
      headline: 'Google Gemini 2.0, Claude 3.5 & GPT-4o in One Place',
      desc: 'No more jumping between subscription paywalls. PARSU AI seamlessly orchestrates top foundation models with unified vector memory. Switch models mid-chat or cross-examine answers for unmatched reasoning depth.',
      features: [
        'Google Gemini 2.0 Flash: High-speed multimodal understanding & ultra-low latency',
        'Anthropic Claude 3.5 Sonnet: Industry-standard coding & human-like nuance',
        'OpenAI GPT-4o: Versatile complex reasoning and mathematics',
        'DeepSeek R1: Advanced algorithmic thinking & chain-of-thought analysis'
      ],
      codeSnippet: `// Real-Time Multi-Model Switching
Current Model: Gemini 2.0 Flash (Primary)
Context Memory: 1.2M tokens active
Reasoning Mode: Cross-Model Comparative Synthesis

[Gemini]: Analyzed 240-page technical whitepaper in 1.4s
[Claude]: Generated optimized TypeScript implementation
[Result]: Zero hallucinations, 100% cited across documents`,
      badgeColor: 'text-[var(--accent-cyan)]',
      glowColor: 'from-cyan-500/20 via-teal-500/15 to-blue-500/20'
    },
    social: {
      id: 'social',
      title: 'Universal Social Studio',
      badge: '1-Click Distribution',
      headline: 'Publish to 7 Major Social Networks Instantly',
      desc: 'Generate viral content tailored for each algorithm. Publish or schedule directly to Instagram, Facebook, X (Twitter), Pinterest, TikTok, LinkedIn, and YouTube without third-party middleman tools.',
      features: [
        'Direct OAuth Connections: Secure official API connections for all platforms',
        'Platform-Tailored Copy: Auto-formats hashtags, character counts, and aspect ratios',
        'Media Pipeline: Integrated photo and video rendering via fast CDN storage',
        'Unified Analytics: Track engagement metrics across all connected accounts'
      ],
      codeSnippet: `// 1-Click Multi-Platform Social Dispatch
Post: "PARSU AI v2.6 is live! Multi-model AI + Google Workspace"
Platforms Selected: [LinkedIn, X, Instagram, YouTube]

✓ LinkedIn: Optimized professional tone with #EnterpriseAI
✓ X (Twitter): Formatted thread under 280 chars with rich card
✓ Instagram: Generated 1080x1080 square preview with hashtags
✓ YouTube: Scheduled announcement Short for 10:00 AM`,
      badgeColor: 'text-purple-400',
      glowColor: 'from-purple-500/20 via-pink-500/15 to-rose-500/20'
    },
    agent: {
      id: 'agent',
      title: 'Autonomous Web & Voice Agent',
      badge: 'Real-Time Grounding',
      headline: 'Live Web Grounding, Voice Talk & Desktop Actions',
      desc: 'Get up-to-the-minute factual answers backed by authoritative primary sources. Speak naturally with zero-lag neural voice chat and direct your AI assistant to control apps, manage research, and execute tasks.',
      features: [
        'Live Web Crawling: Zero-hallucination fact checking with clickable citations',
        'Neural Voice Conversations: Lifelike voice synthesis with low-latency audio stream',
        'Local App & System Control: Open software, launch websites, and automate workflows',
        'Vector Memory Graph: Remembers past chats, documents, and user preferences'
      ],
      codeSnippet: `// Autonomous Agent Execution Log
User: "Summarize today's stock market tech movements and read it to me"

1. Web Search: Fetched 18 live financial sources (0.32s)
2. Synthesis: Extracted NASDAQ, NVDA, GOOGL movements
3. Audio Stream: Initiated neural voice playback (24kHz HD)
4. Memory: Updated user market watch preferences`,
      badgeColor: 'text-emerald-400',
      glowColor: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/20'
    }
  };

  // Features Bento Grid Data
  const features = [
    {
      icon: RiCpuLine,
      title: 'Multi-Model AI Orchestration',
      desc: 'Seamlessly toggle between Google Gemini 2.0, Claude 3.5 Sonnet, GPT-4o, and DeepSeek with unified vector memory and cross-model reasoning.',
      gradient: 'from-[var(--accent-cyan)]/15 via-[var(--color-clear-hanada)]/10 to-transparent',
      border: 'border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/60',
      iconColor: 'text-[var(--accent-cyan)]',
      tag: 'Universal LLM'
    },
    {
      icon: RiGlobalLine,
      title: 'Real-Time Web Intelligence',
      desc: 'Live fact-checked citations via high-speed web grounding. Get verified answers backed by authoritative primary sources and timestamps.',
      gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-400',
      tag: 'Live Web Search'
    },
    {
      icon: RiMailLine,
      title: 'Google Workspace Integration',
      desc: 'Direct, user-controlled connection to Gmail, Google Calendar, Google Drive, and YouTube. Automate emails, meetings, and document storage.',
      gradient: 'from-blue-500/15 via-indigo-500/10 to-transparent',
      border: 'border-blue-500/30 hover:border-blue-500/60',
      iconColor: 'text-blue-400',
      tag: 'Workspace Suite'
    },
    {
      icon: RiShareLine,
      title: '1-Click Social Media Studio',
      desc: 'Generate, optimize, and schedule AI content directly to 7 platforms: Instagram, Facebook, X, Pinterest, TikTok, LinkedIn, and YouTube.',
      gradient: 'from-purple-500/15 via-pink-500/10 to-transparent',
      border: 'border-purple-500/30 hover:border-purple-500/60',
      iconColor: 'text-purple-400',
      tag: 'Omni-Channel'
    },
    {
      icon: RiDatabase2Line,
      title: 'Vector Knowledge Graph & RAG',
      desc: 'Semantic embeddings remember prior insights, documents, and codebases across conversations without manual re-uploading.',
      gradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconColor: 'text-amber-400',
      tag: 'Persistent Memory'
    },
    {
      icon: RiMicLine,
      title: 'Neural Voice & Interactive Agent',
      desc: 'Fluid voice conversations with streaming word-by-word captions, lifelike neural voice synthesis, and desktop action execution.',
      gradient: 'from-cyan-500/15 via-sky-500/10 to-transparent',
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      iconColor: 'text-cyan-400',
      tag: 'Voice & Desktop'
    }
  ];

  // Google OAuth Verification Disclosures & Permissions
  const googlePermissions = [
    {
      scope: 'Google Sign-In (openid, profile, email)',
      purpose: 'Authentication & Identity',
      desc: 'Used solely to verify your identity, create your private workspace, and securely authenticate sessions. We never access passwords or private profile data.',
      icon: RiShieldKeyholeLine,
      badge: 'Identity Only'
    },
    {
      scope: 'Gmail (gmail.send, gmail.readonly, gmail.compose)',
      purpose: 'AI Email Assistance & Drafting',
      desc: 'Allows PARSU AI to read incoming messages for summaries, draft professional replies, and send emails ONLY when you explicitly review and approve them.',
      icon: RiMailLine,
      badge: 'User Confirmed'
    },
    {
      scope: 'Google Calendar (calendar.events, calendar.readonly)',
      purpose: 'Meeting & Schedule Management',
      desc: 'Allows PARSU AI to display your upcoming schedule, check availability, and create new calendar events directly from chat or voice commands.',
      icon: RiCalendarLine,
      badge: 'Schedule Sync'
    },
    {
      scope: 'Google Drive (drive.file, drive.readonly)',
      purpose: 'Document Analysis & Storage',
      desc: 'Allows PARSU AI to analyze user-selected PDFs, spreadsheets, and documents for research, and save AI-generated reports directly into your Drive.',
      icon: RiDriveLine,
      badge: 'Document RAG'
    },
    {
      scope: 'YouTube (youtube.upload)',
      purpose: 'Video Publishing Studio',
      desc: 'Allows video creators to schedule or upload AI-crafted video scripts, descriptions, and video files directly to their personal YouTube channels.',
      icon: RiYoutubeLine,
      badge: 'Creator Studio'
    }
  ];

  // FAQ Items
  const faqItems = [
    {
      q: 'What exactly is PARSU AI and how does it work?',
      a: 'PARSU AI is an autonomous, multi-model AI workspace and creative studio. It brings together leading foundation models (Google Gemini 2.0, Claude 3.5 Sonnet, GPT-4o, and DeepSeek) with real-time web search, vector memory, Google Workspace integration (Gmail, Calendar, Drive), and 1-click social media publishing across 7 major networks.'
    },
    {
      q: 'Why does PARSU AI request Google OAuth permissions?',
      a: 'Google OAuth is used for two distinct capabilities: (1) Instant, secure sign-in via Google Sign-In, and (2) Optional, user-initiated Google Workspace actions (reading or sending emails via Gmail, scheduling calendar events, and analyzing files in Google Drive). Each integration is fully separate and requires explicit user consent before connecting.'
    },
    {
      q: 'How does PARSU AI comply with the Google API Services User Data Policy?',
      a: "PARSU AI's use and transfer of information received from Google APIs adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements. Your Google user data is NEVER sold, leased, transferred to data brokers, or used to train public machine learning models. All data is protected with hardware-grade AES-256 encryption at rest and TLS 1.3 in transit."
    },
    {
      q: 'Can I disconnect or revoke Google permissions at any time?',
      a: 'Yes, absolutely. You can disconnect Gmail, Google Calendar, Google Drive, or YouTube with a single click inside PARSU AI Settings (/settings or /social-connections). You can also immediately revoke permissions globally anytime from your Google Account Security Settings at https://myaccount.google.com/permissions.'
    },
    {
      q: 'Which social media platforms can I publish to?',
      a: 'PARSU AI natively connects to 7 platforms: Instagram, Facebook, X (formerly Twitter), Pinterest, TikTok, LinkedIn, and YouTube. You can craft tailored posts with hashtags, media, and scheduling in one centralized hub.'
    },
    {
      q: 'Is there a free tier available?',
      a: 'Yes! PARSU AI provides a generous Free Starter tier with access to core models, live web search, and social connections without requiring any credit card.'
    }
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--bg-primary)] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30 antialiased overflow-x-hidden relative"
    >
      {/* ── Apple Liquid Glass Sticky Responsive Navigation ─────── */}
      <LiquidGlassNav theme={theme} toggleTheme={toggleTheme} />

      {/* ── Hero Section (Featuring Video/Backdrop + Staggered GSAP Reveal) ── */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Animated Grain + Aurora Gradient Backdrop Component */}
        <HeroGradientBackground />

        {/* Floating Ambient Glowing Elements */}
        <div className="ambient-float-1 absolute top-1/4 left-[8%] w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="ambient-float-2 absolute top-1/3 right-[10%] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Trust Pill / Rare UI Badge */}
          <div className="hero-badge inline-flex justify-center mb-6">
            <PillBadge variant="accent" className="shadow-sm shadow-cyan-500/10 py-1 px-3.5 backdrop-blur-md">
              <RiSparkling2Line size={14} className="text-[var(--accent-cyan)] animate-spin-slow shrink-0" />
              <span className="tracking-wide text-xs sm:text-[13px] font-semibold">
                Autonomous AI Research • Google Workspace • Universal Social Studio
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping ml-1 shrink-0" />
            </PillBadge>
          </div>

          {/* Main Title with Display Typography */}
          <h1 className="font-display text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-[-0.035em] text-zinc-900 dark:text-white leading-[1.08] mb-6 px-1">
            <span className="hero-title-line block">Search Deeper. Think Faster.</span>
            <span className="hero-title-line block bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--color-clear-hanada)] to-[var(--color-sky-haze)] bg-clip-text text-transparent drop-shadow-sm">
              Publish Everywhere.
            </span>
          </h1>

          {/* High-Impact Subtitle */}
          <p className="hero-subtitle text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal tracking-[-0.01em] px-2">
            PARSU AI fuses Google Gemini, Claude 3.5, and GPT-4o with real-time web grounding, persistent memory, and unified automation across Gmail, Google Calendar, Drive, and 7 major social networks.
          </p>

          {/* Primary CTA Buttons */}
          <div className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full max-w-md sm:max-w-none mx-auto">
            {user ? (
              <>
                <Link
                  to="/ai"
                  className="font-display w-full sm:w-auto px-7 sm:px-9 py-4 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer tracking-tight"
                >
                  <RiSparkling2Line size={19} />
                  <span>Launch PARSU AI Workspace</span>
                  <RiArrowRightLine size={19} />
                </Link>
                <Link
                  to="/settings"
                  className="font-display w-full sm:w-auto px-6 sm:px-7 py-4 rounded-2xl bg-white/90 dark:bg-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.1] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer tracking-tight backdrop-blur-md"
                >
                  <RiUserLine size={18} className="text-[var(--accent-cyan)]" />
                  <span>Welcome back, {user.name || user.username || 'User'}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=register"
                  className="font-display w-full sm:w-auto px-7 sm:px-9 py-4 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer tracking-tight"
                >
                  <span>Get Started Free</span>
                  <RiArrowRightLine size={19} />
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="font-display w-full sm:w-auto px-6 sm:px-7 py-4 rounded-2xl bg-white/80 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 backdrop-blur-md text-zinc-800 dark:text-zinc-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/[0.1] transition-all cursor-pointer tracking-tight shadow-sm"
                >
                  <RiLoginCircleLine size={18} />
                  <span>Sign In with Google</span>
                </Link>
              </>
            )}
          </div>

          {/* Micro Trust Indicators */}
          <div className="hero-trust-ribbon text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-medium px-2 mb-10 sm:mb-14">
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> Free Tier Included</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> Zero Credit Card Required</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> Google Verified OAuth</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> AES-256 Data Encryption</span>
          </div>

          {/* ── Interactive Live Workspace Terminal Preview (Preserving HeroWorkspacePreview unchanged) ── */}
          <div id="preview" className="hero-workspace-box scroll-mt-24 w-full relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-teal-500/20 rounded-[28px] blur-xl opacity-60 dark:opacity-75 pointer-events-none" />
            <div id="workspace" className="scroll-mt-24 w-full relative rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-white/10 shadow-2xl bg-zinc-900/40 backdrop-blur-sm">
              <HeroWorkspacePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── "What is PARSU AI?" Interactive Platform Showcase ─────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 anim-fade-up">
          <PillBadge variant="accent" className="mb-3">
            <RiInformationLine size={14} />
            <span>Platform Overview</span>
          </PillBadge>
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            What is PARSU AI?
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            PARSU AI is an autonomous, multi-model AI workspace designed to unite state-of-the-art reasoning models with your everyday apps. From drafting and scheduling with Google Workspace to publishing across 7 social channels, PARSU AI executes tasks end-to-end.
          </p>
        </div>

        {/* Interactive Tab Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 anim-fade-up">
          {Object.values(capabilityTabs).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-lg scale-105'
                  : 'bg-white/80 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10'
              }`}
            >
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Tab Showcase Card */}
        {capabilityTabs[activeTab] && (
          <div className="rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden anim-fade-up">
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${capabilityTabs[activeTab].glowColor} blur-3xl pointer-events-none opacity-40`} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-6 space-y-4">
                <span className={`inline-block text-xs font-bold uppercase tracking-wider ${capabilityTabs[activeTab].badgeColor}`}>
                  {capabilityTabs[activeTab].badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
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
                    className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-cyan)] hover:underline"
                  >
                    <span>Experience this in PARSU AI Workspace</span>
                    <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>

              {/* Code / Visual Terminal Preview */}
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

      {/* ── 3-Step Process Flow: "From Prompt to Real-World Action" ─────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20 anim-fade-up">
          <PillBadge variant="accent" className="mb-3">
            <RiFlashlightLine size={14} />
            <span>Workflow Automation</span>
          </PillBadge>
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            How PARSU AI Works
          </h2>
          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400">
            A frictionless three-stage pipeline that bridges conversational intelligence with autonomous real-world execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 shadow-lg anim-fade-up flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[var(--accent-cyan)] flex items-center justify-center font-bold text-lg mb-5">
                01
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                Multimodal Input & Context
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Type naturally, speak via real-time neural voice, paste code snippets, or upload PDFs, spreadsheets, and video files directly into your workspace.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <RiMicLine size={13} className="text-cyan-400" />
              <span>Voice, text, files & vector embeddings</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 shadow-lg anim-fade-up flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg mb-5">
                02
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                Consensus & Web Grounding
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                PARSU AI queries live web sources for authoritative citations, cross-examines logic with multiple LLMs, and pulls from your persistent cross-chat memory.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <RiGlobalLine size={13} className="text-teal-400" />
              <span>Zero hallucinations • 100% cited</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 shadow-lg anim-fade-up flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-5">
                03
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                1-Click Execution & Publishing
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Approve drafts to send via Gmail, book slots on Google Calendar, save research to Google Drive, or broadcast updates to 7 social platforms at once.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
              <RiSendPlane2Fill size={13} className="text-blue-400" />
              <span>Gmail • Calendar • Drive • Socials</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── App Features & Capabilities Grid ───────────────────────────────── */}
      <section id="features" className="scroll-mt-24 py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20 anim-fade-up">
          <PillBadge variant="accent" className="mb-3">
            <RiCpuLine size={14} />
            <span>Core Capabilities</span>
          </PillBadge>
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            Engineered for Precision & Production
          </h2>
          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400">
            Everything required to synthesize deep research, automate daily productivity, and manage multi-platform distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b0c0d] border ${feat.border} bg-gradient-to-br ${feat.gradient} hover:translate-y-[-2px] hover:shadow-xl transition-all shadow-xs flex flex-col justify-between group anim-fade-up`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center ${feat.iconColor} group-hover:scale-105 transition-transform shadow-xs`}>
                      <Icon size={24} />
                    </div>
                    <PillBadge variant="default" className="text-[10px] font-bold uppercase tracking-wider py-0.5">
                      {feat.tag}
                    </PillBadge>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2.5">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PARSU AI vs Generic AI Comparison Table ────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 anim-fade-up">
          <PillBadge variant="accent" className="mb-3">
            <RiShieldCheckLine size={14} />
            <span>Competitive Matrix</span>
          </PillBadge>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
            Why Teams Choose PARSU AI
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Compare PARSU AI's all-in-one autonomous workspace against conventional single-model chat interfaces.
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-xl anim-fade-up">
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
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">Model Selection</td>
                  <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <RiCheckLine size={16} /> Gemini, Claude, GPT & DeepSeek
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">Locked to single vendor</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">Google Workspace Hub</td>
                  <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <RiCheckLine size={16} /> Native Gmail, Calendar & Drive
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">Not supported natively</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">Social Media Publishing</td>
                  <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <RiCheckLine size={16} /> 1-Click to 7 Social Platforms
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">Copy-paste manual posting</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">Live Web Grounding</td>
                  <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <RiCheckLine size={16} /> Real-time search with citations
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">Stale training cutoff / slow</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">Data Training on Private Chats</td>
                  <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <RiCheckLine size={16} /> Strictly ZERO private training
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">Often opt-in or used for training</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-zinc-800 dark:text-zinc-200">Neural Voice Interaction</td>
                  <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <RiCheckLine size={16} /> Real-time voice with live captioning
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">Limited or mobile app only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── User Data Transparency, Security & Google OAuth Compliance Section ── */}
      <section
        id="transparency"
        className="scroll-mt-24 py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent border-t border-zinc-200/80 dark:border-white/5 relative z-10"
      >
        <div id="privacy" className="scroll-mt-24" />
        <div id="google-disclosure" className="scroll-mt-24" />
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 anim-fade-up">
            <PillBadge variant="accent" className="mb-3">
              <RiShieldCheckLine size={14} />
              <span>Trust, Safety & Verification</span>
            </PillBadge>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
              Google OAuth & Data Transparency
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Clear, transparent disclosures detailing why PARSU AI requests Google permissions and how your privacy is rigorously guarded.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0c0d0e] rounded-3xl border border-cyan-500/25 p-6 sm:p-10 shadow-xl shadow-cyan-500/5 anim-fade-up">
            {/* Detailed Scopes Table / Cards */}
            <div className="mb-8 space-y-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-2">
                Requested Google OAuth Scopes & Specific Uses
              </h3>

              {googlePermissions.map((perm, idx) => {
                const Icon = perm.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-4.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                            {perm.scope}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {perm.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                          {perm.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Google API Limited Use Commitment Statement */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/30 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed mb-6">
              <p className="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2 text-sm">
                <RiShieldCheckLine size={18} />
                <span>Google API Services User Data Policy Compliance Statement</span>
              </p>
              <p className="mb-2">
                PARSU AI's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-0.5"
                >
                  <span>Google API Services User Data Policy</span>
                  <RiExternalLinkLine size={12} />
                </a>
                , including the Limited Use requirements.
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                • <strong>No Human Review:</strong> No human at PARSU AI reads your private emails, calendar meetings, or Drive files unless required for security or explicitly authorized by you.<br />
                • <strong>No Public Model Training:</strong> Google Workspace data is never used to train public machine learning or foundation models.<br />
                • <strong>Revoke Anytime:</strong> You can disconnect your Google account in PARSU AI Settings or directly via{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-blue-600 dark:text-blue-400 font-semibold"
                >
                  Google Account Permissions
                </a>.
              </p>
            </div>

            {/* Direct Links to Legal Policies */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <Link to="/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  <RiFileTextLine size={14} />
                  <span>Privacy Policy</span>
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <Link to="/terms" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  <RiFileTextLine size={14} />
                  <span>Terms of Service</span>
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <Link to="/contact" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  <RiCustomerService2Line size={14} />
                  <span>Support & Contact</span>
                </Link>
              </div>

              <span className="text-xs text-zinc-500 font-mono">GDPR, CCPA & OAuth 2.0 Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive FAQ Accordion Section ──────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 anim-fade-up">
          <PillBadge variant="accent" className="mb-3">
            <RiQuestionLine size={14} />
            <span>Got Questions?</span>
          </PillBadge>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Everything you need to know about models, security, integrations, and data safety.
          </p>
        </div>

        <div className="space-y-3 anim-fade-up">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-[#0c0d10] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full py-4 px-6 text-left font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
              >
                <span>{item.q}</span>
                <RiArrowDownSLine
                  size={20}
                  className={`text-zinc-400 transition-transform duration-200 shrink-0 ${openFaq === idx ? 'rotate-180 text-[var(--accent-cyan)]' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-white/5">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Ready to Start Callout Section ─────────────────────────────────── */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center relative z-10 anim-fade-up">
        <div className="p-8 sm:p-16 rounded-3xl bg-gradient-to-br from-[var(--accent-cyan)]/25 via-[var(--color-clear-hanada)]/15 to-[var(--color-sky-haze)]/15 border border-[var(--accent-cyan)]/40 relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-3 sm:mb-4">
              Step Into the Future of AI.
            </h3>
            <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto mb-7 sm:mb-9 leading-relaxed">
              Join thousands of creators, researchers, and engineers leveraging PARSU AI daily for deep reasoning and automated publishing.
            </p>
            {user ? (
              <Link
                to="/ai"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Launch PARSU AI Workspace</span>
                <RiArrowRightLine size={19} />
              </Link>
            ) : (
              <Link
                to="/auth?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Get Started Free with PARSU AI</span>
                <RiArrowRightLine size={19} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Production Footer with Verified Branding & Support Links ────────── */}
      <footer className="border-t border-zinc-200/80 dark:border-white/5 py-12 px-4 sm:px-6 bg-white dark:bg-[var(--bg-primary)] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <ParsuLogo size={28} className="text-zinc-900 dark:text-white" />
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">PARSU</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium flex-wrap justify-center">
              <Link to="/about" className="hover:text-cyan-500 transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-cyan-500 transition-colors">Pricing</Link>
              <Link to="/privacy" className="hover:text-cyan-500 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-cyan-500 transition-colors">Terms of Service</Link>
              <Link to="/faq" className="hover:text-cyan-500 transition-colors">FAQ</Link>
              <Link to="/changelog" className="hover:text-cyan-500 transition-colors">Changelog</Link>
              <Link to="/status" className="hover:text-cyan-500 transition-colors">Status</Link>
              <Link to="/contact" className="hover:text-cyan-500 transition-colors">Contact</Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
            <p>© {new Date().getFullYear()} PARSU AI. All rights reserved. Precision engineering & safety.</p>
            <p>
              Verified Domain: <span className="text-zinc-700 dark:text-zinc-300 font-mono font-medium">parsuai.vercel.app</span> • Google API Services User Data Policy Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
