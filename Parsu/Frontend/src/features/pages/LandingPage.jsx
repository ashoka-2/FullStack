import React from 'react';
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
  RiMailLine
} from '@remixicon/react';
import ParsuLogo from '../Components/ParsuLogo';
import useSEO from '../../utils/useSEO';

const LandingPage = () => {
  useSEO({
    title: 'Parsu AI — Conversational AI Search & Social Publishing Command Center',
    description: 'Parsu AI is your intelligent research assistant and social publishing platform. Powered by Gemini, Claude, and GPT-4 with real-time web search and vector memory.',
    canonical: '/',
  });

  const features = [
    {
      icon: RiCpuLine,
      title: 'Multi-Model AI Intelligence',
      desc: 'Seamlessly switch between leading models including Google Gemini 3.6 Flash, Anthropic Claude 3.5, OpenAI GPT-4, Groq Llama 3.3, and DeepSeek.',
      gradient: 'from-cyan-500/10 to-blue-500/10',
      border: 'border-cyan-500/20',
      iconColor: 'text-cyan-500',
    },
    {
      icon: RiGlobalLine,
      title: 'Real-Time Web Search & Citations',
      desc: 'Live fact-checked answers powered by Tavily web search. Always up to date with real-time web citations and structured sources.',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-500',
    },
    {
      icon: RiShareLine,
      title: 'Universal Social Media Command Center',
      desc: 'Create, refine, and publish AI-generated captions, photo carousels, and videos directly to 7 platforms: Instagram, Facebook, X, Pinterest, TikTok, LinkedIn, and YouTube.',
      gradient: 'from-purple-500/10 to-indigo-500/10',
      border: 'border-purple-500/20',
      iconColor: 'text-purple-500',
    },
    {
      icon: RiDatabase2Line,
      title: 'Cross-Chat Semantic Memory (RAG)',
      desc: 'Intelligent vector embeddings (text-embedding-004) remember important context and insights across multiple conversation threads with zero manual tagging.',
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-500',
    },
    {
      icon: RiFolderImageLine,
      title: 'Multimodal Files & Document Studio',
      desc: 'Upload PDFs, Word docs, code files, photos, and videos. Analyze complex documents, summarize research papers, and generate visual descriptions in seconds.',
      gradient: 'from-pink-500/10 to-rose-500/10',
      border: 'border-pink-500/20',
      iconColor: 'text-pink-500',
    },
    {
      icon: RiMicLine,
      title: 'Voice Studio & Live Captions',
      desc: 'Speak naturally with real-time word-by-word streaming speech captions, and listen to lifelike human speech synthesis with customizable pitch and voice selection.',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-500',
    },
  ];

  const transparencyPoints = [
    {
      title: 'Purpose of Google Account Sign-In',
      desc: 'When you sign in using Google, Parsu AI requests access only to your primary name, email address, and avatar. This information is used exclusively to authenticate your identity, secure your user profile, and associate your saved conversations with your account.',
    },
    {
      title: 'Zero Sale or Sharing of Personal Data',
      desc: 'We never sell, rent, monetize, or lease your personal information, email address, or search queries to third-party advertisers or data brokers.',
    },
    {
      title: 'AI Model Privacy & Content Protection',
      desc: 'Your private chats, uploaded documents, and personal notes are never used to train public foundation models without your explicit, voluntary consent.',
    },
    {
      title: 'Encrypted Security & User Control',
      desc: 'All communications use HTTPS/TLS in transit. Custom API keys and OAuth tokens are AES-256 encrypted at rest. You can permanently export or delete your account data at any time in Settings.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#20b8cd]/30 antialiased overflow-x-hidden">
      
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#f4f5f7]/85 dark:bg-[#050505]/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/5 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
              <ParsuLogo size={18} className="text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">Parsu</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#20b8cd] bg-[#20b8cd]/10 dark:bg-[#20b8cd]/15 px-1.5 py-0.5 rounded-md">AI</span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#transparency" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Data Privacy</a>
            <Link to="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</Link>
            <Link to="/faq" className="hover:text-zinc-900 dark:hover:text-white transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/auth?mode=login"
              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=register"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#20b8cd] hover:bg-[#1da9bc] text-black shadow-md shadow-[#20b8cd]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Get Started</span>
              <RiArrowRightLine size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[#20b8cd] text-xs font-semibold mb-6 shadow-xs animate-fade-in">
            <RiSparkling2Line size={14} className="animate-spin-slow" />
            <span>Next-Generation AI Search & Universal Social Publishing</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-6">
            Search Deeper. Think Faster. <br />
            <span className="bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              Publish Everywhere.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
            Parsu AI is the comprehensive multi-model research assistant powered by Google Gemini, Claude, and GPT-4. Featuring live web research, cross-chat memory, and 1-click social media publishing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <Link
              to="/auth?mode=register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#20b8cd] to-teal-400 text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#20b8cd]/25 hover:shadow-[#20b8cd]/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <RiArrowRightLine size={18} />
            </Link>
            <Link
              to="/auth?mode=login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              <RiLoginCircleLine size={18} />
              <span>Sign In to Your Workspace</span>
            </Link>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500" /> Free to use</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><RiCheckLine size={14} className="text-emerald-500" /> Instant access</span>
          </p>

          {/* App Preview Frame */}
          <div className="mt-12 sm:mt-16 rounded-3xl border border-zinc-300/80 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-xl p-3 sm:p-5 shadow-2xl shadow-cyan-500/5">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/60 dark:border-white/5 mb-3 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-[11px] text-zinc-400">https://parsuai.vercel.app/</span>
              </div>
              <span className="text-[11px] font-semibold text-cyan-500">Live Workspace Preview</span>
            </div>

            <div className="p-4 sm:p-8 text-left bg-[#f4f5f7]/50 dark:bg-[#050505]/60 rounded-2xl border border-zinc-200/40 dark:border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                  <ParsuLogo size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Ask Parsu AI anything...</h4>
                  <p className="text-xs text-zinc-500">Multi-Model LLM Search • Real-time Web Grounding • Media Publishing</p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  "Analyze the latest quantum computing benchmarks and draft a summary post for LinkedIn..."
                </span>
                <Link
                  to="/auth"
                  className="px-3 py-1.5 rounded-lg bg-[#20b8cd] text-black font-bold text-xs shrink-0 hover:bg-[#1da9bc] transition-colors"
                >
                  Try Now
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── App Features & Capabilities Grid ───────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-200/70 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-[#20b8cd] text-xs font-semibold mb-3">
            <RiCpuLine size={14} />
            <span>Platform Functionality</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
            Everything You Need for Research, Coding & Social Publishing
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Engineered from the ground up to replace fragmented tools with a single unified, lightning-fast intelligent command center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c0d0e] border ${feat.border} bg-gradient-to-br ${feat.gradient} hover:scale-[1.01] transition-all shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-5 ${feat.iconColor} shadow-xs`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2">
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
      <section id="transparency" className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent border-t border-zinc-200/70 dark:border-white/5">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-[#20b8cd] text-xs font-semibold mb-3">
              <RiShieldCheckLine size={14} />
              <span>Transparency & Security</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-3">
              How Parsu AI Protects and Uses Your Data
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Clear, transparent disclosures on why we request user data and how your privacy is guaranteed.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0c0d0e] rounded-3xl border border-cyan-500/30 p-6 sm:p-10 shadow-lg shadow-cyan-500/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {transparencyPoints.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5">
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
                Parsu AI's use and transfer to any other app of information received from Google APIs adheres to the 
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
                  <span>Read Full Privacy Policy</span>
                </Link>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <Link to="/terms" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  <RiFileTextLine size={14} />
                  <span>Terms of Service</span>
                </Link>
              </div>

              <span className="text-xs text-zinc-500">GDPR & CCPA Compliant</span>
            </div>

          </div>

        </div>
      </section>

      {/* ── Ready to Start Callout ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/15 border border-cyan-500/30 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-3">
              Ready to Upgrade Your AI Workflow?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto mb-6">
              Experience conversational answers with citations, cross-chat vector memory, and one-click multi-platform publishing.
            </p>
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#20b8cd] hover:bg-[#1da9bc] text-black font-bold text-sm sm:text-base shadow-lg shadow-[#20b8cd]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Get Started Free</span>
              <RiArrowRightLine size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200/80 dark:border-white/5 py-12 px-4 sm:px-6 bg-white dark:bg-[#070809]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 dark:border-white/5">
            
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                <ParsuLogo size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">Parsu AI</span>
            </div>

            <div className="flex items-center gap-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium flex-wrap justify-center">
              <Link to="/about" className="hover:text-cyan-500 transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-cyan-500 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-cyan-500 transition-colors">Terms of Service</Link>
              <Link to="/faq" className="hover:text-cyan-500 transition-colors">FAQ</Link>
              <Link to="/contact" className="hover:text-cyan-500 transition-colors">Contact Support</Link>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400 dark:text-zinc-600">
            <p>© {new Date().getFullYear()} Parsu AI. All rights reserved. Built with precision & security.</p>
            <p>Hosted on <span className="text-zinc-700 dark:text-zinc-300 font-mono">parsuai.vercel.app</span></p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
