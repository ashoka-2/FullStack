import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  RiSparkling2Line,
  RiBrainLine,
  RiSearchLine,
  RiShareLine,
  RiDatabaseLine,
  RiCodeLine,
  RiArrowRightLine,
  RiRocketLine,
  RiShieldCheckLine,
  RiGlobalLine,
  RiCpuLine,
  RiPulseLine,
  RiTimeLine
} from '@remixicon/react';
import gsap from 'gsap';
import InfoPageLayout from './InfoPageLayout';
import ParsuLogo from '../Components/ParsuLogo';

export default function About() {
  const cardsRef = useRef([]);
  const statsRef = useRef([]);

  useEffect(() => {
    gsap.fromTo(
      cardsRef.current.filter(Boolean),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
    );

    gsap.fromTo(
      statsRef.current.filter(Boolean),
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)', delay: 0.1 }
    );
  }, []);

  const STATS = [
    { label: 'Model Uptime', value: '99.98%', desc: 'Multi-provider failover' },
    { label: 'Social Channels', value: '7 Networks', desc: 'Direct 1-click publishing' },
    { label: 'Search Latency', value: '< 240ms', desc: 'Real-time Tavily grounding' },
    { label: 'Data Privacy', value: 'Zero Brokerage', desc: 'Hardware-grade AES-256' }
  ];

  const CAPABILITIES = [
    {
      icon: RiBrainLine,
      title: 'Frontier Multi-Model Matrix',
      desc: 'Seamlessly toggle between Google Gemini, Anthropic Claude, OpenAI, and DeepSeek with unified vector memory and cross-model reasoning.',
      tag: 'Orchestration'
    },
    {
      icon: RiSearchLine,
      title: 'Autonomous Web Grounding',
      desc: 'Fact-checked, timestamped answers backed by live internet crawling via Tavily. Zero hallucination with verified source citations.',
      tag: 'Live Search'
    },
    {
      icon: RiShareLine,
      title: 'Universal Social Automation',
      desc: 'Connect and schedule content directly to Instagram, Facebook, X, Pinterest, TikTok, LinkedIn, and YouTube from one canvas.',
      tag: 'Social Engine'
    },
    {
      icon: RiDatabaseLine,
      title: 'Vector Knowledge Graphs',
      desc: 'Multi-file RAG document embeddings with high-speed cosine similarity search for enterprise-grade research recall.',
      tag: 'RAG Memory'
    },
    {
      icon: RiCodeLine,
      title: 'Custom Provider Keys (BYOK)',
      desc: 'Plug in your own API keys for Gemini, Groq, OpenAI, or Anthropic to bypass rate limits and utilize enterprise quotas.',
      tag: 'Developer Freedom'
    },
    {
      icon: RiShieldCheckLine,
      title: 'Zero Training on Private Data',
      desc: 'Your queries, uploaded proprietary files, and code snippets are strictly isolated and never used to train public models.',
      tag: 'Enterprise Security'
    }
  ];

  return (
    <InfoPageLayout
      title="Engineering the Next Era of Thought"
      subtitle="Parsu AI fuses frontier foundation models, real-time web verification, and multi-network publishing into a single, focused workspace."
      badge="About Parsu AI"
    >
      <div className="space-y-16 max-w-5xl mx-auto">
        
        {/* ── Key Metrics Ribbon ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((stat, i) => (
            <div
              key={i}
              ref={el => statsRef.current[i] = el}
              className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-white/[0.03] hover:bg-zinc-200/60 dark:hover:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.07] transition-all duration-200"
            >
              <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight font-display mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{stat.label}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Architectural Philosophy ── */}
        <div className="p-7 sm:p-10 rounded-3xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-white/[0.04] dark:to-white/[0.01] border border-zinc-200 dark:border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)]">
              <ParsuLogo size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Our Mission & Principles</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Built for researchers, creators, and engineers</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
            In an era of scattered tools and closed silos, Parsu AI unifies the intelligence stack. We believe knowledge tools should be fast, transparent, and private by default. By pairing multi-model cognitive reasoning with high-speed internet grounding and direct social publishing, we turn fragmented thoughts into verified, actionable execution.
          </p>
        </div>

        {/* ── Capabilities Matrix ── */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Platform Capabilities</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Engineered from the ground up for modern creative workflows</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div
                  key={i}
                  ref={el => cardsRef.current[i] = el}
                  className="p-6 rounded-2xl bg-white dark:bg-[#0c0d12] hover:bg-zinc-50 dark:hover:bg-[#12141a] border border-zinc-200 dark:border-white/[0.07] hover:border-[var(--accent-cyan)]/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-[var(--accent-cyan)] group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06]">
                        {cap.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Ready to Start Callout ── */}
        <div className="text-center pt-6 pb-2">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Ready to elevate your intelligence?</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Join users around the world researching, creating, and publishing with Parsu AI.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs hover:bg-[#1bb0c4] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
            >
              <span>Get Started Free</span>
              <RiArrowRightLine size={15} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all"
            >
              Contact Team
            </Link>
          </div>
        </div>

      </div>
    </InfoPageLayout>
  );
}
