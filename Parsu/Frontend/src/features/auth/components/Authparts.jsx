import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { RiArrowLeftLine, RiArrowRightLine, RiSparklingFill, RiMailSendLine, RiCheckboxCircleFill, RiRefreshLine } from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import PrimaryButton from '../../Components/PrimaryButton';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import { GRAIN_PATTERN_DATA } from '../../../assets/grainData';

const SHAPE = '63% 37% 54% 46% / 55% 48% 52% 45%';
const SHAPE_B = '38% 62% 47% 53% / 44% 56% 44% 56%';
export const DISPLAY = "'Bricolage Grotesque','Outfit',system-ui,sans-serif";
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useDisplayFont = () => {
  useEffect(() => {
    if (document.getElementById('parsu-hero-fonts')) return;
    const l = document.createElement('link');
    l.id = 'parsu-hero-fonts';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(l);
  }, []);
};

/** All GSAP for the Auth page: intro, blob loops, pointer effects, form swaps, error shake, bubble pop. */
export const useAuthMotion = (rootRef, { mode, step, done, bubble, error }) => {
  const firstSwap = useRef(true);
  const firstBubble = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', mouse: '(hover: hover) and (pointer: fine)' }, (ctx) => {
      if (!ctx.conditions.motion) return;
      const off = [];
      const q = (s) => root.querySelector(s);

      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.auth-head', { y: -20, opacity: 0, duration: 0.7 })
        .from('.auth-bubble', { y: 12, opacity: 0, scale: 0.9, duration: 0.6 }, '-=0.4')
        .from('.auth-mascot', { scale: 0.6, opacity: 0, rotate: -8, duration: 1.2, ease: 'elastic.out(1, 0.6)' }, '-=0.5')
        .from('.auth-card', { y: 60, opacity: 0, filter: 'blur(14px)', duration: 1.1 }, '-=1')
        .from('.auth-card .auth-heading, .auth-card .auth-swap > *', { y: 14, opacity: 0, duration: 0.6, stagger: 0.06 }, '-=0.6')
        .from('.auth-foot', { opacity: 0, duration: 0.6 }, '-=0.3');

      root.querySelectorAll('.auth-blob').forEach((el, i) => {
        gsap.to(el, { x: i % 2 ? 40 : -40, y: i % 2 ? -30 : 30, duration: 12 + i * 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to(el.children, { borderRadius: SHAPE_B, rotate: i % 2 ? -14 : 14, scale: 1.08, duration: 8 + i * 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      });

      if (ctx.conditions.mouse) {
        const card = q('.auth-card');
        const glow = q('.card-glow');
        gsap.set(glow, { xPercent: -50, yPercent: -50, x: 120, y: 80 });
        const gx = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' });
        const gy = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' });
        const onCard = (e) => { const r = card.getBoundingClientRect(); gx(e.clientX - r.left); gy(e.clientY - r.top); };
        card.addEventListener('pointermove', onCard);
        off.push(() => card.removeEventListener('pointermove', onCard));

        const par = q('.auth-mascot-parallax');
        const px = gsap.quickTo(par, 'x', { duration: 1, ease: 'power3' });
        const py = gsap.quickTo(par, 'y', { duration: 1, ease: 'power3' });
        const onMove = (e) => { px((e.clientX / window.innerWidth - 0.5) * 24); py((e.clientY / window.innerHeight - 0.5) * 18); };
        root.addEventListener('pointermove', onMove);
        off.push(() => root.removeEventListener('pointermove', onMove));
      }
      return () => off.forEach((fn) => fn());
    }, root);
    return () => mm.revert();
  }, [rootRef]);

  useEffect(() => {
    if (firstSwap.current) { firstSwap.current = false; return; }
    if (reduced()) return;
    gsap.fromTo(rootRef.current.querySelectorAll('.auth-card .auth-heading, .auth-card .auth-swap > *'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out', overwrite: 'auto' });
  }, [mode, step, done, rootRef]);

  useEffect(() => {
    if (firstBubble.current) { firstBubble.current = false; return; }
    if (!reduced()) gsap.fromTo(rootRef.current.querySelector('.auth-bubble-inner'), { y: 6, opacity: 0.3, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' });
  }, [bubble, rootRef]);

  useEffect(() => {
    if (!error || reduced()) return;
    gsap.to(rootRef.current.querySelector('.auth-card'), {
      keyframes: [{ x: -10, duration: 0.07 }, { x: 10, duration: 0.07 }, { x: -6, duration: 0.07 }, { x: 6, duration: 0.07 }, { x: 0, duration: 0.07 }],
      ease: 'power1.inOut',
    });
  }, [error, rootRef]);
};

export const AuthBackground = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    {[
      ['-top-[20%] -left-[15%] h-[60vw] w-[70vw] max-h-[620px] max-w-[760px]', 'from-[#0891b2] via-[#0e7490] to-[#1e3a8a]', 'from-[#a5f3fc] via-[#22d3ee] to-[#38bdf8]'],
      ['top-[30%] -right-[20%] h-[50vw] w-[60vw] max-h-[520px] max-w-[640px]', 'from-[#155e75] via-[#1d4ed8] to-[#0f766e]', 'from-[#67e8f9] via-[#38bdf8] to-[#99f6e4]'],
      ['-bottom-[25%] left-[20%] h-[45vw] w-[55vw] max-h-[460px] max-w-[600px]', 'from-[#0b3b8c] via-[#0e7490] to-[#164e63]', 'from-[#38bdf8] via-[#67e8f9] to-[#a5f3fc]'],
    ].map(([pos, a, b], i) => (
      <div key={i} className={`auth-blob absolute ${pos}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${a} opacity-50 blur-[90px]`} style={{ borderRadius: SHAPE }} />
        <div className={`absolute inset-[22%] bg-gradient-to-tr ${b} opacity-25 blur-[50px]`} style={{ borderRadius: SHAPE }} />
      </div>
    ))}
    <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(${GRAIN_PATTERN_DATA})`, backgroundSize: '160px 160px' }} />
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,5,7,.85) 100%)' }} />
  </div>
);

export const AuthTopBar = ({ onHome }) => (
  <header className="auth-head relative z-10 mx-auto flex h-12 w-full max-w-5xl shrink-0 items-center justify-between pt-2 sm:pt-3">
    <button type="button" onClick={onHome} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-zinc-300 backdrop-blur-xl transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]">
      <RiArrowLeftLine size={15} />Home
    </button>
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-xl">
      <ParsuLogo size={20} className="text-white" />
      <span className="text-sm font-bold tracking-tight text-white">Parsu</span>
      <span className="rounded bg-[var(--accent-cyan)] px-1.5 py-0.5 text-[9px] font-black text-black">AI</span>
    </span>
  </header>
);

export const MascotStage = ({ bubbleText, pose, mascot, onPoke }) => (
  <div className="flex select-none flex-col items-center text-center">
    <div className="auth-bubble mb-4 flex min-h-9 items-center">
      <div className="auth-bubble-inner inline-flex max-w-[280px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-xl">
        <RiSparklingFill className="h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
        <span className="truncate">{bubbleText}</span>
      </div>
    </div>
    <div className="auth-mascot-parallax">
      <div onClick={onPoke} title="Say hi" className="auth-mascot group relative flex h-36 w-36 cursor-pointer items-center justify-center xs:h-40 xs:w-40 sm:h-52 sm:w-52 lg:h-72 lg:w-72">
        <div className="absolute inset-4 rounded-full bg-[var(--accent-cyan)]/15 blur-3xl transition-colors group-hover:bg-[var(--accent-cyan)]/25" />
        <div className="blob-floating-levitate h-full w-full origin-bottom transition-transform duration-500 ease-out" style={{ transform: pose }}>
          <JellyBlobMascot {...mascot} onPoke={onPoke} eyeStyle="v2" className="h-full w-full drop-shadow-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export const AuthCard = ({ children }) => (
  <div className="auth-card relative w-full max-w-[440px] rounded-[28px] bg-gradient-to-b from-white/20 via-white/[0.04] to-[var(--accent-cyan)]/25 p-px shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
    <div className="relative overflow-hidden rounded-[27px] bg-[var(--bg-secondary)]/90 p-6 backdrop-blur-3xl sm:p-8">
      <div aria-hidden="true" className="card-glow pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.16), transparent 65%)' }} />
      <div className="relative">{children}</div>
    </div>
  </div>
);

const HEADINGS = {
  login: ['Welcome back', 'Sign in to continue'],
  register: ['Create account', 'Start in seconds'],
  forgot: [['Reset password', "We'll email you a code"], ['Enter code', 'Six digits, sent to your email'], ['New password', 'Make it a strong one']],
};
export const FormHeading = ({ mode, forgotStep }) => {
  const [title, sub] = mode === 'forgot' ? HEADINGS.forgot[forgotStep - 1] : HEADINGS[mode];
  return (
    <div className="auth-heading mb-6">
      <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-3xl" style={{ fontFamily: DISPLAY }}>{title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{sub}</p>
    </div>
  );
};

export const ModeSwitch = ({ mode, onSwitch }) => {
  const [text, label, target] = mode === 'login' ? ["New here?", 'Create account', 'register'] : mode === 'register' ? ['Have an account?', 'Sign in', 'login'] : ['Remembered it?', 'Sign in', 'login'];
  return (
    <p className="mt-6 border-t border-white/[0.06] pt-4 text-center text-sm text-zinc-400">
      {text}{' '}
      <button type="button" onClick={() => onSwitch(target)} className="cursor-pointer font-semibold text-[var(--accent-cyan)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]">{label}</button>
    </p>
  );
};

export const VerifyEmailPanel = ({ email, resendStatus, onProceed, onResend }) => (
  <div className="auth-swap space-y-6 py-2 text-center">
    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[var(--accent-cyan)]/25 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] shadow-lg shadow-cyan-500/10"><RiMailSendLine size={32} /></div>
    <div>
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400"><RiCheckboxCircleFill size={14} />Account created</span>
      <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-white" style={{ fontFamily: DISPLAY }}>Check your inbox</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-400">Activation link sent to <strong className="break-all font-semibold text-[var(--accent-cyan)]">{email}</strong></p>
    </div>
    <div className="space-y-3">
      <PrimaryButton type="button" onClick={onProceed} fullWidth size="md" icon={RiArrowRightLine} iconPosition="right">Continue to sign in</PrimaryButton>
      <button type="button" onClick={onResend} disabled={resendStatus === 'Sending...'} className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-[var(--accent-cyan)]">
        <RiRefreshLine size={13} className={resendStatus === 'Sending...' ? 'animate-spin' : ''} />
        {resendStatus === 'Sent!' ? 'Sent. Check your inbox' : 'Resend link'}
      </button>
    </div>
  </div>
);

export const AuthFooter = () => (
  <footer className="auth-foot relative z-10 mx-auto flex w-full max-w-5xl shrink-0 flex-col items-center justify-between gap-2 py-4 text-[11px] text-zinc-500 sm:flex-row">
    <span>By continuing you agree to our <Link to="/terms" className="underline-offset-2 hover:text-zinc-200 hover:underline">Terms</Link> and <Link to="/privacy" className="underline-offset-2 hover:text-zinc-200 hover:underline">Privacy Policy</Link>.</span>
    <span className="flex items-center gap-4">
      <span>Â© {new Date().getFullYear()} Parsu AI</span>
      <Link to="/status" className="hover:text-zinc-200">Status</Link>
    </span>
  </footer>
);