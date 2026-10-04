
import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { RiGlobalLine, RiSparkling2Line, RiTimeLine, RiCheckLine, RiSendPlane2Fill, RiShareLine } from '@remixicon/react';
import ParsuLogo from './ParsuLogo';

const PROMPT = "Find this week's biggest AI news and schedule a LinkedIn post about it";
const STEPS = [
  { icon: RiGlobalLine, label: 'Searching the live web', detail: '14 sources' },
  { icon: RiSparkling2Line, label: 'Drafting with Claude 3.5 Sonnet', detail: '1 draft' },
  { icon: RiTimeLine, label: 'Scheduling on LinkedIn', detail: 'Tomorrow, 9:00' },
];

/** Looping "agent at work" demo: prompt types in, steps tick off live, result lands. */
export default function HeroWorkspacePreview({ className = '' }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const typed = q('.typed')[0];
      const rows = q('.step');
      const result = q('.result');
      const state = { n: 0 };
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
      tl.set(rows, { opacity: 0, y: 10 })
        .set(result, { opacity: 0, y: 14 })
        .set(q('.spin'), { opacity: 1 })
        .set(q('.tick'), { opacity: 0, scale: 0.4 })
        .call(() => { typed.textContent = ''; })
        .to(state, {
          n: PROMPT.length, duration: 2, ease: 'none',
          onStart: () => { state.n = 0; },
          onUpdate: () => { typed.textContent = PROMPT.slice(0, Math.round(state.n)); },
        })
        .addLabel('run', '+=0.3');
      rows.forEach((row, i) => {
        const t = i * 1.2;
        tl.to(row, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, `run+=${t}`)
          .to(row.querySelector('.spin'), { opacity: 0, duration: 0.15 }, `run+=${t + 0.8}`)
          .to(row.querySelector('.tick'), { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, `run+=${t + 0.85}`);
      });
      tl.to(result, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 'run+=3.9')
        .to([...rows, ...result], { opacity: 0, duration: 0.5 }, '+=3');
      return () => tl.kill();
    }, root);
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className={`relative mx-auto max-w-4xl w-full text-left ${className}`}>
      <div aria-hidden="true" className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-[var(--accent-cyan)]/25 via-[var(--color-clear-hanada)]/20 to-[var(--color-sky-haze)]/25 blur-2xl opacity-50 dark:opacity-40 -z-10" />
      <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/85 dark:bg-[var(--bg-secondary)]/85 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-200/70 dark:border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
            <span className="ml-2 font-mono text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 truncate">parsuai.vercel.app/ai</span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent-cyan)] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping" /> Agent running
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-7 h-7 rounded-full bg-zinc-200 dark:bg-white/10 grid place-items-center text-[11px] font-bold text-zinc-700 dark:text-zinc-200 shrink-0">You</span>
            <p className="rounded-2xl rounded-tl-md bg-zinc-100 dark:bg-white/[0.06] px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-100 min-h-[2.5rem]">
              <span className="typed">{PROMPT}</span>
              <span aria-hidden="true" className="inline-block w-[2px] h-4 -mb-0.5 ml-0.5 bg-[var(--accent-cyan)] animate-pulse" />
            </p>
          </div>

          <div className="flex items-start gap-3">
            <ParsuLogo size={26} className="mt-0.5 text-zinc-900 dark:text-white shrink-0" />
            <div className="w-full space-y-3">
              <ol className="space-y-2">
                {STEPS.map(({ icon: Icon, label, detail }) => (
                  <li key={label} className="step flex items-center gap-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] px-3 py-2.5">
                    <span className="relative w-5 h-5 shrink-0">
                      <span className="spin absolute inset-0 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin opacity-0" />
                      <span className="tick absolute inset-0 grid place-items-center rounded-full bg-emerald-500 text-black"><RiCheckLine size={12} /></span>
                    </span>
                    <Icon size={16} className="text-zinc-400 shrink-0" />
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 truncate">{label}</span>
                    <span className="ml-auto text-[11px] text-zinc-500 whitespace-nowrap">{detail}</span>
                  </li>
                ))}
              </ol>

              <div className="result rounded-xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/[0.06] p-4">
                <p className="text-[13px] sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                  This week in AI: agents moved from demos to daily tools. Three launches worth knowing, and what they mean for small teams. Full breakdown below.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <RiShareLine size={12} /> Scheduled for LinkedIn, tomorrow 9:00
                  </span>
                  <Link to="/ai" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-cyan)] px-3 py-1.5 text-xs font-bold text-black hover:bg-[var(--accent-cyan-hover)] transition-colors">
                    Try it free <RiSendPlane2Fill size={11} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}