import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  RiSearchLine,
  RiFlashlightLine,
  RiSendPlane2Fill,
  RiSparkling2Line
} from '@remixicon/react';
import ParsuLogo from './ParsuLogo';

export default function HeroWorkspacePreview({ className = "" }) {
  const [activeModel, setActiveModel] = useState('gemini');

  const models = [
    { id: 'gemini', name: 'Gemini 2.5 Flash', provider: 'Google', badge: 'Ultra Fast', color: 'text-[var(--accent-cyan)]' },
    { id: 'claude', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Deep Reasoning', color: 'text-amber-400' },
    { id: 'gpt4', name: 'GPT-4o Omnimodal', provider: 'OpenAI', badge: 'Code & Logic', color: 'text-emerald-400' },
    { id: 'deepseek', name: 'DeepSeek R1', provider: 'DeepSeek', badge: 'Math & Proofs', color: 'text-blue-400' },
  ];

  const samplePrompts = {
    gemini: {
      query: "Analyze latest trends in multimodal AI agent tool-use and draft a technical briefing...",
      result: "Based on real-time 2026 developer indices, autonomous tool-use has surged by 340% YoY. Key drivers include structured JSON output schema validation, ephemeral session sandboxing, and parallel function calling across Gemini 2.5 and Claude 3.5 architectures.",
      tokens: "248 tokens/sec",
      latency: "112ms",
    },
    claude: {
      query: "Audit our React 19 server actions for security vulnerabilities and race conditions...",
      result: "Analysis complete: Identified 2 potential idempotency hazards in concurrent checkout hooks. Refactoring with React 19 useOptimistic and optimistic locking prevents double-charges during network flaps.",
      tokens: "185 tokens/sec",
      latency: "190ms",
    },
    gpt4: {
      query: "Write a high-converting carousel script for LinkedIn announcing our new design system...",
      result: "Slide 1: We spent 6 months rebuilding our UI from scratch. Here's why 90% of design tokens fail at scale...\nSlide 2: Rule 1 - Optical alignment over strict pixel grids. FeralUI spring physics feel alive.",
      tokens: "195 tokens/sec",
      latency: "140ms",
    },
    deepseek: {
      query: "Derive the loss function for mixture-of-experts routing with auxiliary load-balancing loss...",
      result: "The unified auxiliary loss enforces uniform expert utilization: L_aux = α * N * Σ(f_i * P_i) where f_i is expert fraction and P_i is routing probability. This prevents single-expert collapse.",
      tokens: "210 tokens/sec",
      latency: "135ms",
    },
  };

  return (
    <div className={`mt-10 sm:mt-14 relative mx-auto max-w-4xl w-full text-left ${className}`}>
      
      {/* ── Ambient Background Glow Behind the Window ──────────────────────── */}
      <div 
        className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-[var(--accent-cyan)]/25 via-[var(--color-clear-hanada)]/20 to-[var(--color-sky-haze)]/25 rounded-3xl blur-2xl opacity-50 dark:opacity-40 -z-10 pointer-events-none" 
        aria-hidden="true"
      />

      {/* ── Apple Mac Styled Window Container ──────────────────────────────── */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c0e12]/85 backdrop-blur-2xl p-3.5 sm:p-6 shadow-2xl shadow-black/10 dark:shadow-black/60 transition-all duration-300">
        
        {/* Window Title Bar with Mac-Style Traffic Light Buttons */}
        <div className="flex items-center justify-between px-2 pb-3.5 mb-3.5 border-b border-zinc-200/70 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/90 shadow-xs cursor-pointer hover:opacity-80 transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-amber-400/90 shadow-xs cursor-pointer hover:opacity-80 transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-xs cursor-pointer hover:opacity-80 transition-opacity" />
            <span className="ml-2.5 font-mono text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 select-none">
              https://parsuai.vercel.app/workspace
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping" />
            <span>Live Model Terminal</span>
          </div>
        </div>

        {/* ── AI Model Selection Tabs ──────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-3 mb-3.5 border-b border-zinc-200/50 dark:border-white/5">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModel(m.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeModel === m.id
                  ? 'bg-zinc-900 text-white dark:bg-white/10 dark:text-white shadow-xs border border-white/15'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeModel === m.id ? 'bg-[var(--accent-cyan)]' : 'bg-zinc-400'}`} />
              <span>{m.name}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                {m.badge}
              </span>
            </button>
          ))}
        </div>

        {/* ── Question & Answer Stage ─────────────────────────────────────── */}
        <div className="p-3.5 sm:p-5 text-left bg-zinc-50/70 dark:bg-[#070809]/80 rounded-2xl border border-zinc-200/60 dark:border-white/5 font-mono text-xs">
          
          {/* User Input Question Prompt */}
          <div className="flex items-start gap-2.5 mb-3.5 text-zinc-800 dark:text-zinc-200 font-sans">
            <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300">
              <RiSearchLine size={13} />
            </div>
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 w-full shadow-xs">
              <span className="text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">
                "{samplePrompts[activeModel].query}"
              </span>
            </div>
          </div>

          {/* AI Output Answer Block */}
          <div className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300 font-sans">
            <div className="w-6 h-6 rounded-lg bg-[var(--accent-cyan)] flex items-center justify-center text-black shrink-0 mt-0.5 shadow-sm shadow-[var(--accent-cyan)]/30">
              <ParsuLogo size={13} className="text-black" />
            </div>
            <div className="bg-white/90 dark:bg-zinc-900/60 border border-[var(--accent-cyan)]/25 rounded-xl p-3.5 sm:p-4 w-full shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-200 dark:border-white/5 pb-1.5">
                <span className="font-bold text-[var(--accent-cyan)] flex items-center gap-1">
                  <RiFlashlightLine size={11} /> {models.find((m) => m.id === activeModel)?.name}
                </span>
                <span className="font-mono">
                  {samplePrompts[activeModel].tokens} • {samplePrompts[activeModel].latency}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line font-sans">
                {samplePrompts[activeModel].result}
              </p>
            </div>
          </div>

          {/* Bottom Bar: Action to Launch Studio */}
          <div className="mt-3.5 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] text-zinc-500 border-t border-zinc-200/40 dark:border-white/5">
            <span className="font-sans">Ready to explore full multi-turn conversations and citations?</span>
            <Link
              to="/auth"
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-black font-bold text-xs shrink-0 hover:bg-[var(--accent-cyan-hover)] transition-all flex items-center gap-1 font-sans cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Open Studio</span>
              <RiSendPlane2Fill size={11} />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
