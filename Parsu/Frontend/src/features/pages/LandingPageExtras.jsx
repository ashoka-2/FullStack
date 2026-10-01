import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  RiMailLine, RiCalendarLine, RiDriveLine, RiYoutubeLine, RiInstagramLine, RiFacebookCircleLine,
  RiTwitterXLine, RiPinterestLine, RiLinkedinBoxLine, RiVideoLine, RiBrainLine, RiCpuLine,
  RiSparkling2Line, RiFlashlightLine, RiCustomerService2Line, RiFileTextLine, RiTimeLine, RiShieldKeyholeLine,
  RiArrowRightLine, RiCheckLine,
} from '@remixicon/react';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';

gsap.registerPlugin(ScrollTrigger);

/* ── Figma-style blob gradients ─────────────────────────────────────────
   Each blob = a big soft blurred shape + a slightly smaller lighter copy
   of the same shape layered on top, plus a grain texture overlay. The two
   shapes morph between two border-radius keyframes on infinite yoyo loops.
   ────────────────────────────────────────────────────────────────────── */
const SHAPE_A = '63% 37% 54% 46% / 55% 48% 52% 45%';
const SHAPE_B = '38% 62% 47% 53% / 44% 56% 44% 56%';

const BLOBS = [
  {
    wrap: '-top-[16%] -left-[14%] w-[90vw] h-[70vw] sm:w-[62vw] sm:h-[38vw] max-w-[980px] max-h-[620px]',
    base: 'from-[#22d3ee] via-[#38bdf8] to-[#93c5fd] dark:from-[#0891b2] dark:via-[#0e7490] dark:to-[#1e3a8a]',
    light: 'from-white via-[#cffafe] to-[#bae6fd] dark:from-[#a5f3fc] dark:via-[#22d3ee] dark:to-[#38bdf8]',
  },
  {
    wrap: 'top-[8%] -right-[18%] w-[80vw] h-[64vw] sm:w-[48vw] sm:h-[34vw] max-w-[760px] max-h-[520px]',
    base: 'from-[#7dd3fc] via-[#22d3ee] to-[#99f6e4] dark:from-[#155e75] dark:via-[#1d4ed8] dark:to-[#0f766e]',
    light: 'from-[#f0fdff] via-[#a5f3fc] to-white dark:from-[#67e8f9] dark:via-[#38bdf8] dark:to-[#99f6e4]',
  },
  {
    wrap: 'top-[38%] left-[22%] w-[70vw] h-[50vw] sm:w-[44vw] sm:h-[26vw] max-w-[700px] max-h-[420px]',
    base: 'from-[#a5f3fc] via-[#67e8f9] to-[#bae6fd] dark:from-[#0b3b8c] dark:via-[#0e7490] dark:to-[#164e63]',
    light: 'from-white via-[#e0f7ff] to-[#cffafe] dark:from-[#38bdf8] dark:via-[#67e8f9] dark:to-[#a5f3fc]',
  },
];

/**
 * BlobBackground — Figma-inspired organic gradient blobs that float,
 * morph and parallax on scroll. Includes a grain texture overlay and
 * a fade-to-page-background at the bottom.
 */
export const BlobBackground = () => {
  const layer = useRef(null);

  useEffect(() => {
    const root = layer.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      /* Floating drift for each blob wrapper */
      gsap.utils.toArray('.blob-wrap', root).forEach((el, i) => {
        gsap.to(el, {
          x: i % 2 ? 40 : -40,
          y: i % 2 ? -30 : 30,
          duration: 12 + i * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      /* Morph + rotate for the main (base) blobs */
      gsap.utils.toArray('.blob-base', root).forEach((el, i) => {
        gsap.to(el, {
          borderRadius: SHAPE_B,
          rotation: i % 2 ? -14 : 14,
          scale: 1.08,
          duration: 9 + i * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      /* Lighter highlight blob — offset drift for depth */
      gsap.utils.toArray('.blob-light', root).forEach((el, i) => {
        gsap.to(el, {
          borderRadius: SHAPE_B,
          x: i % 2 ? 30 : -30,
          y: i % 2 ? -20 : 24,
          duration: 7 + i * 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      /* Subtle parallax: blobs drift slower than content */
      gsap.to(root, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: root.parentElement?.parentElement,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
    >
      {/* Blob layer */}
      <div ref={layer} className="absolute inset-x-0 -inset-y-[10%]">
        {BLOBS.map((b, i) => (
          <div key={i} className={`blob-wrap absolute ${b.wrap}`}>
            {/* Base blob — heavier, more saturated, larger blur */}
            <div
              className={`blob-base absolute inset-0 bg-gradient-to-br ${b.base} opacity-60 dark:opacity-55 blur-[60px] sm:blur-[100px]`}
              style={{ borderRadius: SHAPE_A }}
            />
            {/* Light highlight — inset, lighter colour, tighter blur */}
            <div
              className={`blob-light absolute inset-[18%] bg-gradient-to-tr ${b.light} opacity-80 dark:opacity-40 blur-[30px] sm:blur-[50px]`}
              style={{ borderRadius: SHAPE_A }}
            />
          </div>
        ))}
      </div>

      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-50 dark:opacity-35 mix-blend-overlay"
        style={{
          backgroundImage: `url(${GRAIN_PATTERN_DATA})`,
          backgroundSize: '160px 160px',
        }}
      />

      {/* Fade to page bg */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--bg-primary)]" />
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   HeroTitle — Bricolage Grotesque (bold geometric sans) for the first
   two lines + Instrument Serif italic for the gradient line. The
   "Publish Everywhere." text gets an animated ice-to-cyan sheen that
   sweeps back and forth, matching the app's light-blue brand palette.
   ═══════════════════════════════════════════════════════════════════════ */
export const HeroTitle = () => {
  useEffect(() => {
    if (document.getElementById('parsu-hero-fonts')) return;
    const l = document.createElement('link');
    l.id = 'parsu-hero-fonts';
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(l);
  }, []);

  const lines = ['Search Deeper.', 'Think Faster.'];

  return (
    <>
      {/* Inline styles for the animated gradient sheen — scoped to .parsu-shine */}
      <style>{`
        .parsu-shine {
          background-image: linear-gradient(
            105deg,
            #0e7490 0%, #22b8cf 22%, #7dd3fc 45%, #0891b2 70%, #22d3ee 100%
          );
          background-size: 260% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: parsuShine 7s ease-in-out infinite;
          filter: drop-shadow(0 6px 24px rgba(32,184,205,.28));
        }
        .dark .parsu-shine {
          background-image: linear-gradient(
            105deg,
            #a5f3fc 0%, #22d3ee 22%, #f0fdff 45%, #38bdf8 70%, #67e8f9 100%
          );
          filter: drop-shadow(0 6px 30px rgba(34,211,238,.35));
        }
        @keyframes parsuShine {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .parsu-shine { animation: none; }
        }
      `}</style>

      <h1
        className="mb-7 px-1 text-[clamp(2.5rem,8.6vw,6.2rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-zinc-900 dark:text-white"
        style={{ fontFamily: "'Bricolage Grotesque','Outfit',system-ui,sans-serif" }}
      >
        {lines.map((line) => (
          <span key={line} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
            {line.split(' ').map((w, i) => (
              <span key={i} className="hero-word inline-block mr-[0.28em] last:mr-0">
                {w}
              </span>
            ))}
          </span>
        ))}
        {/* Gradient italic line */}
        <span className="hero-gradient-line block overflow-hidden pb-[0.22em] -mb-[0.22em] mt-1">
          <span
            className="parsu-shine inline-block px-[0.06em] italic font-normal text-[1.14em] leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: "'Instrument Serif','Times New Roman',serif" }}
          >
            Publish Everywhere.
          </span>
        </span>
      </h1>
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   StatsStrip — A responsive 2-col / 4-col grid of animated counters.
   Uses clamp() font-sizes + nowrap so every value stays on one line,
   and a glass-morphism container that matches the brand aesthetic.
   ═══════════════════════════════════════════════════════════════════════ */
const STATS = [
  { end: 4, suffix: '+', label: 'Foundation Models' },
  { end: 7, suffix: '', label: 'Social Platforms' },
  { end: 100, suffix: '%', label: 'Citation Accuracy' },
  { end: 256, suffix: '-bit', label: 'AES Encryption' },
];

export const StatsStrip = () => {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray('.stat-num', root).forEach((el) => {
        const end = Number(el.dataset.end);
        const suffix = el.dataset.suffix;
        const o = { v: 0 };
        el.textContent = `0${suffix}`;

        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () =>
            gsap.to(o, {
              v: end,
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = `${Math.round(o.v)}${suffix}`;
              },
            }),
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 p-6 sm:p-10 rounded-3xl bg-white/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-lg"
    >
      {STATS.map((s) => (
        <div
          key={s.label}
          className="min-w-0 text-center lg:px-4 lg:border-l lg:first:border-l-0 border-zinc-200 dark:border-white/10"
        >
          <div
            className="stat-num font-display font-black tabular-nums whitespace-nowrap tracking-tight text-zinc-900 dark:text-white text-[clamp(1.9rem,7vw,3.4rem)] leading-none"
            data-end={s.end}
            data-suffix={s.suffix}
          >
            {s.end}{s.suffix}
          </div>
          <p className="mt-2 text-[11px] sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
};


/* ── Official Brand SVG Logos with authentic latest brand styling ── */
const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="shrink-0">
    <defs>
      <linearGradient id="gemini-grad-marquee" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1BA1E3" />
        <stop offset="38%" stopColor="#546EE5" />
        <stop offset="72%" stopColor="#7962E3" />
        <stop offset="100%" stopColor="#B76EE5" />
      </linearGradient>
    </defs>
    <path
      d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
      fill="url(#gemini-grad-marquee)"
    />
  </svg>
);

const ClaudeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#D97757" className="shrink-0">
    <path d="M12 2.5a1.5 1.5 0 0 1 1.5 1.5v3.25l2.3-2.3a1.5 1.5 0 1 1 2.12 2.12l-2.3 2.3h3.25a1.5 1.5 0 1 1 0 3h-3.25l2.3 2.3a1.5 1.5 0 1 1-2.12 2.12l-2.3-2.3v3.25a1.5 1.5 0 1 1-3 0v-3.25l-2.3 2.3a1.5 1.5 0 1 1-2.12-2.12l2.3-2.3H5.63a1.5 1.5 0 1 1 0-3h3.25l-2.3-2.3a1.5 1.5 0 1 1 2.12-2.12l2.3 2.3V4A1.5 1.5 0 0 1 12 2.5z" />
  </svg>
);

const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="#10A37F" className="shrink-0">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.937a4.485 4.485 0 0 1 2.366-1.973V12.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.067 0L4.01 15.06a4.505 4.505 0 0 1-1.67-6.123zm16.597 3.855l-5.833-3.387L15.119 8.24a.076.076 0 0 1 .067 0l4.813 2.773a4.5 4.5 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.386-.648zm2.01-4.523l-.142-.085-4.773-2.782a.776.776 0 0 0-.785 0L9.409 8.77V6.438a.08.08 0 0 1 .033-.062L14.28 3.59a4.5 4.5 0 0 1 6.67 4.679zM8.398 13.7v-3.41l2.946-1.7 2.946 1.7v3.41L11.344 15.4z" />
  </svg>
);

const DeepSeekIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="shrink-0">
    <path
      d="M3.2 13.8C3.2 9.2 6.9 5.5 11.5 5.5c4.6 0 8.3 3.7 8.3 8.3 0 1.2-.3 2.3-.7 3.3l1.7 2.4-3-.8c-1.7 1.3-3.9 2.1-6.3 2.1-4.6 0-8.3-3.7-8.3-8.3z"
      fill="#0066FF"
    />
    <path
      d="M17.2 4.2c.4-.7 1.2-1.2 2-1.2m-3.5 2.5c.3-.5.9-.9 1.5-.9"
      stroke="#0066FF"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="7.8" cy="12.2" r="1.3" fill="#FFFFFF" />
    <path
      d="M11 15.2c1.4.2 2.8-.5 3.5-1.7"
      stroke="#FFFFFF"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <path fill="#4285F4" d="M2 18.5V7.8l5.3 4v6.7H3.5A1.5 1.5 0 0 1 2 18.5z" />
    <path fill="#34A853" d="M22 18.5V7.8l-5.3 4v6.7h3.8a1.5 1.5 0 0 0 1.5-1.5z" />
    <path fill="#EA4335" d="M16.7 11.8L12 15.3l-4.7-3.5V5.5c0-1.1 1.2-1.8 2.2-1.2L12 6.2l2.5-1.9c1-.6 2.2.1 2.2 1.2v6.3z" />
    <path fill="#FBBC05" d="M2 7.8V5.5a1.5 1.5 0 0 1 2.4-1.2l2.9 2.2-5.3 1.3z" />
    <path fill="#C5221F" d="M22 7.8V5.5a1.5 1.5 0 0 0-2.4-1.2l-2.9 2.2 5.3 1.3z" />
  </svg>
);

const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <rect x="2" y="2" width="20" height="20" rx="4.5" fill="#FFFFFF" />
    <path d="M19 2H5a3 3 0 0 0-3 3v2.8h20V5a3 3 0 0 0-3-3z" fill="#4285F4" />
    <path d="M22 7.8h-2.5V17H22V7.8z" fill="#FBBC05" />
    <path d="M19 22H5a3 3 0 0 1-3-3v-2.8h20V19a3 3 0 0 1-3 3z" fill="#34A853" />
    <path d="M2 7.8h2.5V17H2V7.8z" fill="#EA4335" />
    <text x="12" y="16.2" textAnchor="middle" fill="#4285F4" fontSize="8" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">31</text>
  </svg>
);

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <path d="M8.07 3.5h7.86l6 10.38h-7.86L8.07 3.5z" fill="#FFBA00" />
    <path d="M2.07 13.88l3.93-6.81 6.07 10.51H4.21l-2.14-3.7z" fill="#00AC47" />
    <path d="M14.07 13.88H2.46L6.39 20.7h11.61l3.93-6.82h-7.86z" fill="#2684FC" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <path
      fill="#FF0000"
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
    />
    <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#FFFFFF" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <defs>
      <radialGradient id="insta-grad-official" cx="30%" cy="107%" r="130%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#insta-grad-official)" />
    <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <circle cx="12" cy="12" r="12" fill="#0866FF" />
    <path
      d="M13.5 19.5v-6.8h2.3l.35-2.7H13.5V8.3c0-.78.22-1.3 1.34-1.3H16.2V4.57c-.24-.03-1.07-.1-2.03-.1-2.01 0-3.39 1.23-3.39 3.48v2.05H8.4v2.7h2.38v6.8h2.72z"
      fill="#FFFFFF"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0 text-zinc-900 dark:text-white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <circle cx="12" cy="12" r="12" fill="#E60023" />
    <path
      fill="#FFFFFF"
      d="M12 3a9 9 0 0 0-3.3 17.37c-.05-.72-.1-1.83.02-2.62l1-4.22s-.25-.5-.25-1.24c0-1.16.67-2.03 1.51-2.03.71 0 1.05.53 1.05 1.18 0 .72-.46 1.79-.7 2.79-.2.83.42 1.52 1.25 1.52 1.5 0 2.65-1.58 2.65-3.86 0-2.02-1.45-3.43-3.53-3.43-2.4 0-3.81 1.8-3.81 3.66 0 .73.28 1.5.63 1.92.07.08.08.16.06.24l-.24.97c-.04.16-.13.2-.3.12-1.09-.5-1.77-2.09-1.77-3.37 0-2.74 2-5.27 5.76-5.27 3.03 0 5.37 2.16 5.37 5.04 0 3-1.89 5.43-4.53 5.43-.88 0-1.72-.46-2.01-1l-.54 2.08c-.2.75-.73 1.7-1.09 2.29A9 9 0 1 0 12 3z"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <circle cx="12" cy="12" r="12" fill="#000000" />
    <g transform="translate(1.5, 1.5) scale(0.88)">
      <path
        fill="#25F4EE"
        d="M16.6 8.2c-.8-.5-1.3-1.4-1.4-2.4h-2.3v11.1c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3 1-2.3 2.3-2.3c.3 0 .5 0 .7.1v-2.4c-.2 0-.5-.1-.7-.1-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7 4.7-2.1 4.7-4.7V10.7c1 .7 2.2 1.1 3.5 1.1v-2.4c-.8 0-1.6-.4-2.2-1.2z"
      />
      <path
        fill="#FE2C55"
        d="M16.1 7.7c-.8-.5-1.3-1.4-1.4-2.4h-1.8v11.1c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3 1-2.3 2.3-2.3c.3 0 .5 0 .7.1v-1.9c-.2 0-.5-.1-.7-.1-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7 4.7-2.1 4.7-4.7V10.2c1 .7 2.2 1.1 3.5 1.1V8.9c-.8 0-1.6-.4-2.2-1.2z"
      />
      <path
        fill="#FFFFFF"
        d="M16.3 8c-.8-.5-1.3-1.4-1.4-2.4h-2.1v11.1c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3 1-2.3 2.3-2.3c.3 0 .5 0 .7.1v-2.1c-.2 0-.5-.1-.7-.1-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7 4.7-2.1 4.7-4.7V10.5c1 .7 2.2 1.1 3.5 1.1V9.2c-.8 0-1.6-.4-2.2-1.2z"
      />
    </g>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
    <path
      fill="#FFFFFF"
      d="M6.3 8.7H3.4V18h2.9V8.7zM4.9 4.5C3.9 4.5 3 5.3 3 6.3s.9 1.8 1.9 1.8 1.9-.8 1.9-1.8-.9-1.8-1.9-1.8zm15.7 7.7c0-2.8-1.5-4.1-3.5-4.1-1.6 0-2.3.9-2.7 1.5V8.7h-2.9c0 .8.1 9.3 0 9.3h2.9v-5.2c0-.3 0-.6.1-.8.2-.6.8-1.3 1.8-1.3 1.3 0 1.8 1 1.8 2.4v4.9h2.9v-5.4z"
    />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════
   IntegrationsStrip — A two-row infinite marquee of tool/platform
   chips with authentic brand SVG icons and tailored colors.
   ═══════════════════════════════════════════════════════════════════════ */
const ROW1 = [
  { icon: GeminiIcon, label: 'Google Gemini', hoverBorder: 'hover:border-[#546EE5]/60 hover:bg-[#546EE5]/10 hover:shadow-[#546EE5]/10' },
  { icon: ClaudeIcon, label: 'Claude 3.5 Sonnet', hoverBorder: 'hover:border-[#D97757]/60 hover:bg-[#D97757]/10 hover:shadow-[#D97757]/10' },
  { icon: OpenAIIcon, label: 'GPT-4o', hoverBorder: 'hover:border-[#10A37F]/60 hover:bg-[#10A37F]/10 hover:shadow-[#10A37F]/10' },
  { icon: DeepSeekIcon, label: 'DeepSeek R1', hoverBorder: 'hover:border-[#0066FF]/60 hover:bg-[#0066FF]/10 hover:shadow-[#0066FF]/10' },
  { icon: GmailIcon, label: 'Gmail', hoverBorder: 'hover:border-[#EA4335]/60 hover:bg-[#EA4335]/10 hover:shadow-[#EA4335]/10' },
  { icon: GoogleCalendarIcon, label: 'Google Calendar', hoverBorder: 'hover:border-[#4285F4]/60 hover:bg-[#4285F4]/10 hover:shadow-[#4285F4]/10' },
  { icon: GoogleDriveIcon, label: 'Google Drive', hoverBorder: 'hover:border-[#00AC47]/60 hover:bg-[#00AC47]/10 hover:shadow-[#00AC47]/10' },
];

const ROW2 = [
  { icon: YouTubeIcon, label: 'YouTube', hoverBorder: 'hover:border-[#FF0000]/60 hover:bg-[#FF0000]/10 hover:shadow-[#FF0000]/10' },
  { icon: InstagramIcon, label: 'Instagram', hoverBorder: 'hover:border-[#E1306C]/60 hover:bg-[#E1306C]/10 hover:shadow-[#E1306C]/10' },
  { icon: FacebookIcon, label: 'Facebook', hoverBorder: 'hover:border-[#0866FF]/60 hover:bg-[#0866FF]/10 hover:shadow-[#0866FF]/10' },
  { icon: XIcon, label: 'X', hoverBorder: 'hover:border-zinc-400/60 hover:bg-zinc-500/10 hover:shadow-zinc-500/10' },
  { icon: PinterestIcon, label: 'Pinterest', hoverBorder: 'hover:border-[#E60023]/60 hover:bg-[#E60023]/10 hover:shadow-[#E60023]/10' },
  { icon: TikTokIcon, label: 'TikTok', hoverBorder: 'hover:border-[#FE2C55]/60 hover:bg-[#FE2C55]/10 hover:shadow-[#FE2C55]/10' },
  { icon: LinkedInIcon, label: 'LinkedIn', hoverBorder: 'hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/10 hover:shadow-[#0A66C2]/10' },
];

const MarqueeRow = ({ items, reverse = false }) => (
  <div className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
    <div
      className="marquee-track flex w-max gap-3 py-1.5"
      data-reverse={reverse ? '1' : '0'}
    >
      {[...items, ...items].map((it, i) => {
        const IconComponent = it.icon;
        return (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className={`inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs transition-colors ${it.hoverBorder}`}
          >
            <IconComponent />
            <span>{it.label}</span>
          </span>
        );
      })}
    </div>
  </div>
);

export const IntegrationsStrip = () => {
  const ref = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('.marquee-track', ref.current).forEach((track) => {
        const rev = track.dataset.reverse === '1';
        const tw = gsap.fromTo(
          track,
          { xPercent: rev ? -50 : 0 },
          { xPercent: rev ? 0 : -50, ease: 'none', duration: 38, repeat: -1 },
        );
        const host = track.parentElement;
        host.addEventListener('mouseenter', () =>
          gsap.to(tw, { timeScale: 0.2, duration: 0.5 }),
        );
        host.addEventListener('mouseleave', () =>
          gsap.to(tw, { timeScale: 1, duration: 0.5 }),
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={ref}
      className="relative z-10 border-t border-zinc-200/80 dark:border-white/5 py-14 sm:py-20"
    >
      <div className="section-header mx-auto mb-8 max-w-2xl px-4 text-center">
        <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
          Works with the tools you already use
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Four AI models, Google Workspace, and seven social networks in one
          workspace. Connect only what you need.
        </p>
      </div>
      <div className="space-y-3">
        <MarqueeRow items={ROW1} />
        <MarqueeRow items={ROW2} reverse />
      </div>
    </section>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   SupportCard — "Still have questions?" card placed under the FAQ
   list to fill the blank space.
   ═══════════════════════════════════════════════════════════════════════ */
export const SupportCard = () => (
  <div className="mt-10 relative overflow-hidden rounded-3xl border border-[var(--accent-cyan)]/30 bg-gradient-to-br from-[var(--accent-cyan)]/10 via-transparent to-sky-500/10 p-6 sm:p-8">
    <h3 className="font-display text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
      Still have questions?
    </h3>
    <p className="mt-1.5 mb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
      Reach out, read the policies, or manage what PARSU AI can access.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        { to: '/contact', icon: RiCustomerService2Line, label: 'Contact support' },
        { to: '/privacy', icon: RiFileTextLine, label: 'Privacy Policy' },
        { to: '/status', icon: RiTimeLine, label: 'System status' },
        {
          href: 'https://myaccount.google.com/permissions',
          icon: RiShieldKeyholeLine,
          label: 'Manage Google access',
        },
      ].map(({ to, href, icon: Icon, label }) => {
        const cls =
          'flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:border-[var(--accent-cyan)]/50 transition-colors';
        const inner = (
          <>
            <Icon size={18} className="text-[var(--accent-cyan)] shrink-0" />
            {label}
          </>
        );
        return to ? (
          <Link key={label} to={to} className={cls}>
            {inner}
          </Link>
        ) : (
          <a key={label} href={href} target="_blank" rel="noreferrer" className={cls}>
            {inner}
          </a>
        );
      })}
    </div>
  </div>
);


/* ═══════════════════════════════════════════════════════════════════════
   EXTRA_FAQ — Additional Q&A items rendered alongside the main FAQ.
   ═══════════════════════════════════════════════════════════════════════ */
export const EXTRA_FAQ = [
  {
    q: 'Which AI models does PARSU AI use?',
    a: 'Google Gemini, Anthropic Claude, OpenAI GPT-4o and DeepSeek. You choose the model per conversation and can switch at any time.',
  },
  {
    q: 'Will PARSU AI post or send anything without my approval?',
    a: 'No. PARSU AI prepares drafts for emails and social posts. Nothing is sent, scheduled or published until you review and confirm it.',
  },
  {
    q: 'Can PARSU AI control my computer or phone?',
    a: 'Device actions are optional. When enabled, they run only on devices signed in to your account, and sensitive actions ask for your confirmation first.',
  },
  {
    q: 'How do I delete my data?',
    a: 'You can delete conversations from your workspace, disconnect any integration in Settings, and contact us to request full account deletion.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   FinalCtaCard — High-end Figma-inspired CTA with animated morphing
   blobs, dual gradient layers, grain texture, and iridescent glow.
   ═══════════════════════════════════════════════════════════════════════ */
export const FinalCtaCard = ({ user }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Float drift for wrappers
      gsap.utils.toArray('.cta-blob-wrap', root).forEach((el, i) => {
        gsap.to(el, {
          x: i % 2 ? 30 : -30,
          y: i % 2 ? -20 : 20,
          duration: 9 + i * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      // Morph border-radius
      gsap.utils.toArray('.cta-blob-base, .cta-blob-light', root).forEach((el, i) => {
        gsap.to(el, {
          borderRadius: SHAPE_B,
          duration: 7 + (i % 3),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="final-cta relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 group">
      {/* Outer ambient glow backlight */}
      <div
        aria-hidden="true"
        className="absolute -inset-4 bg-gradient-to-r from-cyan-500/30 via-sky-500/25 to-teal-500/25 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10"
      />

      {/* Internal Multi-Layer Animated Figma Blobs */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-[#07090d] dark:bg-[#050608]" />

        {/* Blob 1 */}
        <div className="cta-blob-wrap absolute -top-[35%] -left-[20%] w-[80%] h-[120%] pointer-events-none">
          <div
            className="cta-blob-base absolute inset-0 bg-gradient-to-br from-[#22d3ee]/35 via-[#38bdf8]/25 to-[#1e3a8a]/30 blur-[80px] sm:blur-[110px]"
            style={{ borderRadius: SHAPE_A }}
          />
          <div
            className="cta-blob-light absolute inset-[20%] bg-gradient-to-tr from-white/40 via-[#cffafe]/30 to-[#38bdf8]/20 blur-[40px] sm:blur-[60px]"
            style={{ borderRadius: SHAPE_A }}
          />
        </div>

        {/* Blob 2 */}
        <div className="cta-blob-wrap absolute -bottom-[30%] -right-[15%] w-[75%] h-[110%] pointer-events-none">
          <div
            className="cta-blob-base absolute inset-0 bg-gradient-to-tl from-[#1d4ed8]/35 via-[#0e7490]/25 to-[#22d3ee]/20 blur-[70px] sm:blur-[100px]"
            style={{ borderRadius: SHAPE_B }}
          />
          <div
            className="cta-blob-light absolute inset-[20%] bg-gradient-to-bl from-white/30 via-[#a5f3fc]/20 to-[#99f6e4]/20 blur-[35px] sm:blur-[55px]"
            style={{ borderRadius: SHAPE_B }}
          />
        </div>

        {/* Central accent blob */}
        <div className="cta-blob-wrap absolute top-[15%] left-[25%] w-[50%] h-[60%] pointer-events-none">
          <div
            className="cta-blob-base absolute inset-0 bg-gradient-to-tr from-[#38bdf8]/25 via-[#67e8f9]/15 to-transparent blur-[60px]"
            style={{ borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%' }}
          />
        </div>

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-35 mix-blend-overlay"
          style={{ backgroundImage: `url(${GRAIN_PATTERN_DATA})`, backgroundSize: '160px 160px' }}
        />

        {/* Top edge glass reflection highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 py-16 sm:py-24 px-6 sm:px-16 text-center">
        {/* Rare Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-white/[0.08] border border-white/20 backdrop-blur-md text-[var(--accent-cyan)] text-xs font-semibold mb-6 shadow-sm shadow-cyan-500/20">
          <RiSparkling2Line size={14} className="text-[var(--accent-cyan)] animate-spin-slow shrink-0" />
          <span className="tracking-wide text-xs sm:text-[13px] text-white font-medium">
            Next-Gen Autonomous AI & Multi-Platform Engine
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping ml-1 shrink-0" />
        </div>

        {/* Headline */}
        <h3 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-5 leading-[1.08]">
          Step Into the Future of AI.
        </h3>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-300/90 max-w-xl mx-auto mb-9 sm:mb-11 leading-relaxed font-normal">
          Join thousands of creators, researchers, and engineers leveraging PARSU AI daily for deep reasoning and automated publishing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              to="/ai"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-11 py-4 sm:py-4.5 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.04] active:scale-[0.97] cursor-pointer group"
            >
              <RiSparkling2Line size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Launch PARSU AI Workspace</span>
              <RiArrowRightLine size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/auth?mode=register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-11 py-4 sm:py-4.5 rounded-2xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.04] active:scale-[0.97] cursor-pointer group"
            >
              <RiSparkling2Line size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Get Started Free with PARSU AI</span>
              <RiArrowRightLine size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Trust Badges under CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[12px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <RiCheckLine size={15} className="text-emerald-400 shrink-0" />
            Free tier included
          </span>
          <span className="flex items-center gap-1.5">
            <RiCheckLine size={15} className="text-emerald-400 shrink-0" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <RiCheckLine size={15} className="text-emerald-400 shrink-0" />
            OAuth 2.0 Verified
          </span>
        </div>
      </div>
    </div>
  );
};
