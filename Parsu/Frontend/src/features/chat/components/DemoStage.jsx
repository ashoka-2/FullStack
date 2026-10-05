import React, { useEffect, useRef, useState, memo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion } from 'motion/react';
import {
  RiChat3Line, RiComputerLine, RiShareForwardLine, RiMailLine,
  RiBrainLine, RiMapPin2Line, RiVoiceprintLine, RiKey2Line,
} from '@remixicon/react';

gsap.registerPlugin(useGSAP);

/* One source of truth for the demo, the feature grid and the "Try it now" shortcuts.
   tries: string = sent as a prompt, object with action 'voice' = opens live voice. */
export const FEATURES = [
  { id: 'chat', icon: RiChat3Line, color: '#20b8cd', label: 'Chat', title: 'Smart chatbot',
    desc: 'Streaming answers, live web search, file and image analysis, adjustable thinking depth.',
    demoPrompt: "Explain quantum computing like I'm 12", chips: ['Streaming answer', 'Web search', 'File analysis'],
    tries: ["Explain quantum computing like I'm 12", 'Write a Python script to rename files in bulk'] },
  { id: 'agent', icon: RiComputerLine, color: '#a78bfa', label: 'Desktop agent', title: 'Desktop control agent',
    desc: 'Open apps, search any site and open any URL on your computer, straight from chat.',
    demoPrompt: 'Open Spotify and search lofi beats', chips: ['Opening Spotify', 'Searching "lofi beats"', 'Playing'],
    tries: ['Open Chrome', 'Open youtube.com', 'Search Google for best budget laptops'] },
  { id: 'social', icon: RiShareForwardLine, color: '#f472b6', label: 'Social posting', title: 'Post to 7 platforms',
    desc: 'Write once, publish to Instagram, YouTube, Facebook, LinkedIn, TikTok, X and Pinterest.',
    demoPrompt: 'Post this reel to all my socials', chips: ['Instagram', 'YouTube', 'Facebook', 'LinkedIn', 'TikTok', 'X', 'Pinterest'],
    tries: ['Write an Instagram caption for my new travel reel', 'Draft a LinkedIn post about my latest project'] },
  { id: 'connect', icon: RiMailLine, color: '#fbbf24', label: 'Gmail, Calendar, Drive', title: 'Connect your accounts',
    desc: 'Read mail, schedule events and find files in Gmail, Google Calendar and Drive.',
    demoPrompt: 'Summarize unread mail and book Friday 4pm', chips: ['Gmail connected', 'Event added to Calendar', 'File found in Drive'],
    tries: ['Summarize my unread Gmail', "What's on my calendar tomorrow?", 'Find my latest invoice in Drive'] },
  { id: 'memory', icon: RiBrainLine, color: '#34d399', label: 'Memory', title: 'Memory that sticks',
    desc: 'Parsu remembers your preferences across chats. Turn it off or go incognito anytime.',
    demoPrompt: 'Remember that I prefer vegetarian food', chips: ['Saved to memory', 'Used in your next chat'],
    tries: ['Remember that I prefer vegetarian food', 'What do you remember about me?'] },
  { id: 'trip', icon: RiMapPin2Line, color: '#fb7185', label: 'Trip planner', title: 'Trips with a live map',
    desc: 'Plan a trip and see pins and directions on Google Maps inside the chat.',
    demoPrompt: 'Plan 3 days in Munnar and show directions', kind: 'map', chips: ['Route drawn', '3 stops pinned'],
    tries: ['Plan a 3-day trip to Munnar and show directions on the map', 'Show the route from Kochi to Alleppey with pins'] },
  { id: 'voice', icon: RiVoiceprintLine, color: '#38bdf8', label: 'Live voice', title: 'Talk to Parsu',
    desc: 'Hands-free live voice conversation, plus speech-to-text in the message box.',
    demoPrompt: '"Hey Parsu, what is on my schedule?"', kind: 'voice', chips: [],
    tries: [{ label: 'Start live voice talk', action: 'voice' }] },
  { id: 'byok', icon: RiKey2Line, color: '#f97316', label: 'Your own API', title: 'Bring your own API key',
    desc: 'Add your Gemini, OpenAI or Anthropic key and use the models you choose with no limits from us.',
    demoPrompt: 'Add my Gemini API key', chips: ['Key verified', 'Unlimited usage', 'Switch models anytime'],
    tries: ['How do I add my own Gemini API key?', 'Which models can I use with my own key?'] },
];

const MapVisual = ({ color }) => (
  <svg viewBox="0 0 300 140" className="w-full h-32 sm:h-36">
    <rect width="300" height="140" rx="14" fill="rgba(127,127,127,.12)" />
    {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={i * 60} y1="0" x2={i * 60 + 24} y2="140" stroke="rgba(127,127,127,.2)" />)}
    <path className="route" d="M30 110 C80 20, 130 130, 170 70 S250 20, 270 40" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {[[30, 110], [170, 70], [270, 40]].map(([x, y], i) => (
      <g key={i} className="pin"><circle cx={x} cy={y} r="8" fill={color} /><circle cx={x} cy={y} r="3" fill="#09090b" /></g>
    ))}
  </svg>
);

const VoiceVisual = ({ color }) => (
  <div className="flex items-center justify-center gap-1.5 h-24">
    {Array.from({ length: 22 }).map((_, i) => (
      <span key={i} className="bar w-1.5 h-full rounded-full origin-center" style={{ background: color }} />
    ))}
  </div>
);

/* The looping "motion video": a GSAP timeline plays each feature in turn.
   Hover pauses it, tabs jump to a feature. onScene(id) lets the mascot react. */
const DemoStage = ({ id = 'demo', onScene }) => {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef(null);
  const tlRef = useRef(null);
  const hovered = useRef(false);
  const f = FEATURES[i];

  useEffect(() => { onScene?.(f.id); }, [f.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useGSAP(() => {
    const q = gsap.utils.selector(root);
    const typed = q('.typed')[0];
    const bar = q('.progress')[0];
    const st = { n: 0 };
    typed.textContent = '';

    const tl = gsap.timeline({
      onComplete: () => setI((v) => (v + 1) % FEATURES.length),
      onUpdate: () => gsap.set(bar, { scaleX: tl.progress() }),
    });
    tl.from(q('.win'), { y: 24, opacity: 0, duration: 0.45, ease: 'power3.out' })
      .to(st, {
        n: f.demoPrompt.length, ease: 'none',
        duration: Math.max(1, f.demoPrompt.length * 0.045),
        onUpdate: () => { typed.textContent = f.demoPrompt.slice(0, Math.round(st.n)); },
      });

    if (q('.chip').length) {
      tl.from(q('.chip'), { scale: 0, opacity: 0, y: 12, stagger: 0.22, ease: 'back.out(2.2)', duration: 0.45 }, '+=.15');
    }
    const route = q('.route')[0];
    if (route) {
      const L = route.getTotalLength();
      gsap.set(route, { strokeDasharray: L, strokeDashoffset: L });
      tl.to(route, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, '+=.1')
        .from(q('.pin'), { y: -34, opacity: 0, stagger: 0.28, ease: 'bounce.out', duration: 0.7 }, '<.2');
    }
    if (q('.bar').length) {
      gsap.to(q('.bar'), { scaleY: () => gsap.utils.random(0.12, 1), duration: 0.35, repeat: -1, yoyo: true, repeatRefresh: true, stagger: 0.04, ease: 'sine.inOut' });
      tl.from(q('.bar'), { scaleY: 0, stagger: 0.03, duration: 0.3 }, '+=.1');
    }
    tl.to({}, { duration: 1.8 }); // hold the finished scene
    tlRef.current = tl;
    if (hovered.current) tl.pause();
  }, { scope: root, dependencies: [i] });

  const hold = (v) => {
    hovered.current = v;
    setPaused(v);
    if (v) tlRef.current?.pause(); else tlRef.current?.play();
  };

  return (
    <section id={id} ref={root} className="w-full max-w-[800px] mx-auto scroll-mt-20">
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1">See what Parsu can do</h2>
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-4">Pick a feature, or let the demo play through all eight.</p>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2" role="tablist">
        {FEATURES.map((t, idx) => {
          const Icon = t.icon;
          const active = idx === i;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => setI(idx)}
              className={`relative shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold cursor-pointer transition-colors ${active ? 'text-zinc-950' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
              {active && <motion.span layoutId="demo-tab" className="absolute inset-0 rounded-full" style={{ background: t.color }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
              <Icon size={14} className="relative" /><span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}
        className="relative mt-2 rounded-3xl border border-zinc-200/90 dark:border-white/10 bg-white/70 dark:bg-[var(--bg-surface)]/70 backdrop-blur-md overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,.35)]">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 transition-colors duration-700" style={{ background: f.color }} />
        <div className="win relative p-4 sm:p-6 min-h-[270px]">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[11px] font-medium text-zinc-500">{f.title}</span>
            {paused && <span className="ml-auto text-[10px] text-zinc-400">Paused</span>}
          </div>
          <div className="rounded-2xl px-4 py-3 bg-zinc-100 dark:bg-white/[0.06] text-sm sm:text-[15px] font-medium text-zinc-800 dark:text-zinc-100 min-h-[48px]">
            <span className="typed" />
            <span className="inline-block w-[2px] h-4 ml-0.5 align-middle animate-pulse" style={{ background: f.color }} />
          </div>
          <div className="mt-4">
            {f.kind === 'map' && <MapVisual color={f.color} />}
            {f.kind === 'voice' && <VoiceVisual color={f.color} />}
            <div className="flex flex-wrap gap-2 mt-3">
              {f.chips.map((c) => (
                <span key={c} className="chip inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold border"
                  style={{ borderColor: `${f.color}66`, background: `${f.color}1f`, color: f.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />{c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="h-[3px] bg-zinc-200/60 dark:bg-white/5">
          <div className="progress h-full origin-left scale-x-0" style={{ background: f.color }} />
        </div>
      </div>
    </section>
  );
};

export default memo(DemoStage);
