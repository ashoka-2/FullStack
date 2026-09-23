import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
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
  RiSendPlane2Fill
} from '@remixicon/react';
import ParsuLogo from '../Components/ParsuLogo';
import HeroGradientBackground from '../Components/HeroGradientBackground';
import HeroMediaShowcase from '../Components/HeroMediaShowcase';
import MagneticButton from '../Components/MagneticButton';
import LiquidGlassNav from '../Components/LiquidGlassNav';
import useSEO from '../../utils/useSEO';

const LandingPage = () => {
  useSEO({
    title: 'Parsu AI — Autonomous Multi-Model Intelligence & Creative Studio',
    description: 'Parsu AI is your intelligent research assistant and creative studio. Powered by Gemini, Claude, and GPT-4 with real-time web search and vector memory.',
    canonical: '/',
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

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

  const features = [
    {
      icon: RiCpuLine,
      title: 'Multi-Model AI Orchestration',
      desc: 'Instantly toggle between Google Gemini, Anthropic Claude 3.5, OpenAI GPT-4, and DeepSeek with unified vector memory and cross-model comparative reasoning.',
      gradient: 'from-cyan-500/15 via-blue-500/5 to-transparent',
      border: 'border-cyan-500/30 hover:border-cyan-400/60',
      iconColor: 'text-[#20b8cd]',
      tag: 'Universal LLM'
    },
    {
      icon: RiGlobalLine,
      title: 'Real-Time Web Intelligence',
      desc: 'Live fact-checked citations via high-speed web grounding. Get zero-hallucination answers backed by authoritative primary sources and timestamps.',
      gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
      iconColor: 'text-emerald-400',
      tag: 'Live Web Search'
    },
    {
      icon: RiShareLine,
      title: '1-Click Social Command Center',
      desc: 'Generate, optimize, and schedule AI content directly to 7 platforms: Instagram, Facebook, X (Twitter), Pinterest, TikTok, LinkedIn, and YouTube.',
      gradient: 'from-purple-500/15 via-indigo-500/5 to-transparent',
      border: 'border-purple-500/30 hover:border-purple-400/60',
      iconColor: 'text-purple-400',
      tag: 'Omni-Channel'
    },
    {
      icon: RiDatabase2Line,
      title: 'Vector Knowledge Graph & RAG',
      desc: 'Semantic embeddings remember prior insights, documents, and codebases across chats without requiring manual re-upload or prompt repetition.',
      gradient: 'from-amber-500/15 via-orange-500/5 to-transparent',
      border: 'border-amber-500/30 hover:border-amber-400/60',
      iconColor: 'text-amber-400',
      tag: 'Long-Term Memory'
    },
    {
      icon: RiFolderImageLine,
      title: 'Multimodal Document Studio',
      desc: 'Upload multi-page PDFs, spreadsheets, source code, high-resolution imagery, and video. Synthesize massive research papers in seconds.',
      gradient: 'from-pink-500/15 via-rose-500/5 to-transparent',
      border: 'border-pink-500/30 hover:border-pink-400/60',
      iconColor: 'text-pink-400',
      tag: 'Vision & Documents'
    },
    {
      icon: RiMicLine,
      title: 'Neural Voice & Speech Studio',
      desc: 'Fluid voice conversations with streaming word-by-word captions and lifelike neural voice synthesis with pitch and timbre control.',
      gradient: 'from-blue-500/15 via-cyan-500/5 to-transparent',
      border: 'border-blue-500/30 hover:border-blue-400/60',
      iconColor: 'text-blue-400',
      tag: 'Real-Time Voice'
    },
  ];

  const transparencyPoints = [
    {
      title: 'Identity Authentication Only',
      desc: 'When signing in with Google OAuth, Parsu AI requests only your primary name, verified email, and profile avatar. This is used solely to authenticate your identity and safeguard your personal workspace.',
    },
    {
      title: 'Zero Third-Party Data Monetization',
      desc: 'We never sell, rent, lease, or monetize your search history, conversation logs, or personal information to third-party data brokers or advertisers.',
    },
    {
      title: 'Zero Public Training on Private Chats',
      desc: 'Your private chats, uploaded proprietary files, and personal code snippets are never used to train public foundation models without your explicit consent.',
    },
    {
      title: 'Hardware-Grade AES-256 Encryption',
      desc: 'All communications are protected with TLS 1.3 in transit. OAuth tokens and custom API keys are securely stored with AES-256 encryption at rest with full data wipe controls.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#0e100f] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#20b8cd]/30 antialiased overflow-x-hidden relative">
      
      {/* ── Apple Liquid Glass Sticky Responsive Navigation ─────── */}
      <LiquidGlassNav theme={theme} toggleTheme={toggleTheme} />

      {/* ── Hero Section (Featuring Poolside.svg & cyan theme animated gradient) ── */}
      <section className="relative pt-24 sm:pt-32 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden">
        
        {/* User's Exact Animated Grain + Aurora Gradient Backdrop Component */}
        <HeroGradientBackground />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Trust Pill / Rare UI Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-white/[0.05] border border-cyan-500/30 backdrop-blur-md text-[#20b8cd] text-xs font-semibold mb-6 shadow-sm shadow-cyan-500/10 hover:border-cyan-400 transition-colors animate-fade-in">
            <RiSparkling2Line size={14} className="text-[#20b8cd] animate-spin-slow" />
            <span className="tracking-wide">Autonomous AI Search & Universal Social Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#20b8cd] animate-ping ml-1" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black tracking-tight text-zinc-900 dark:text-white leading-[1.08] mb-6">
            Search Deeper. Think Faster. <br />
            <span className="bg-gradient-to-r from-[#20b8cd] via-teal-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
              Publish Everywhere.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
            Parsu AI fuses leading foundation models with real-time web grounding, persistent cross-chat memory, and automated publishing across 7 major social networks.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <Link
              to="/auth?mode=register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#20b8cd] hover:bg-[#1da9bc] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#20b8cd]/30 hover:shadow-[#20b8cd]/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <RiArrowRightLine size={18} />
            </Link>
            <Link
              to="/auth?mode=login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 backdrop-blur-md text-zinc-800 dark:text-zinc-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/[0.1] transition-all cursor-pointer"
            >
              <RiLoginCircleLine size={18} />
              <span>Launch PARSU AI Workspace</span>
            </Link>
          </div>

          {/* Micro Trust Indicators */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-4 sm:gap-6 flex-wrap font-medium">
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> Free Tier Available</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> No Credit Card Required</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={15} className="text-emerald-500" /> Instant Google Sign-In</span>
          </div>

          {/* ── Interactive Live Workspace / Image / Video Media Showcase ─── */}
          <HeroMediaShowcase />

        </div>
      </section>

      {/* ── App Features & Capabilities Grid ───────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-[#20b8cd] text-xs font-semibold mb-3">
            <RiCpuLine size={14} />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            Engineered for Precision & Production
          </h2>
          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400">
            Everything required to analyze research, generate verified insights, and orchestrate universal social media distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0b0c0d] border ${feat.border} bg-gradient-to-br ${feat.gradient} hover:translate-y-[-2px] hover:shadow-xl transition-all shadow-xs flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center ${feat.iconColor} group-hover:scale-105 transition-transform shadow-xs`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 border border-zinc-200 dark:border-white/5">
                      {feat.tag}
                    </span>
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

      {/* ── User Data Transparency & Privacy Section (Google OAuth Verification) ── */}
      <section id="transparency" className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent border-t border-zinc-200/80 dark:border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-[#20b8cd] text-xs font-semibold mb-3">
              <RiShieldCheckLine size={14} />
              <span>Security & Integrity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">
              Privacy First. Zero compromises.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Clear, transparent disclosures on why we request user data and how your confidentiality is guaranteed.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0c0d0e] rounded-3xl border border-cyan-500/25 p-6 sm:p-10 shadow-xl shadow-cyan-500/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {transparencyPoints.map((item, idx) => (
                <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <RiCheckLine size={18} className="text-[#20b8cd] shrink-0" />
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{item.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Google API Limited Use Commitment */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
              <p className="font-semibold text-[#20b8cd] mb-1 flex items-center gap-1.5">
                <RiShieldCheckLine size={16} />
                <span>Google API Services User Data Policy Compliance</span>
              </p>
              <p>
                PARSU AI's use and transfer to any other app of information received from Google APIs adheres to the 
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 underline font-medium ml-1 mr-1"
                >
                  Google API Services User Data Policy
                </a>, 
                including the Limited Use requirements.
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
                <Link to="/status" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  <RiTimeLine size={14} />
                  <span>System Status</span>
                </Link>
              </div>

              <span className="text-xs text-zinc-500 font-mono">GDPR & CCPA Compliant</span>
            </div>

          </div>

        </div>
      </section>

      {/* ── Ready to Start Callout ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center relative z-10">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/15 border border-cyan-500/30 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
              Step Into the Future of AI.
            </h3>
            <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto mb-8">
              Join thousands of researchers, engineers, and creators using PARSU AI daily.
            </p>
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-[#20b8cd] hover:bg-[#1da9bc] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-[#20b8cd]/35 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Get Started with PARSU AI</span>
              <RiArrowRightLine size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200/80 dark:border-white/5 py-12 px-4 sm:px-6 bg-white dark:bg-[#070809] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 dark:border-white/5">
            
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                <ParsuLogo size={16} className="text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">PARSU</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[#20b8cd] px-1 rounded">AI</span>
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

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400 dark:text-zinc-600">
            <p>© {new Date().getFullYear()} PARSU AI. All rights reserved. Precision engineering & safety.</p>
            <p>Production cluster • <span className="text-zinc-700 dark:text-zinc-300 font-mono">parsuai.vercel.app</span></p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
