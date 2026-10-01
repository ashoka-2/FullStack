import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ParsuLogo from './ParsuLogo';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';

/**
 * Loading — "Convergence"
 *
 * A galaxy of particles swirls in the dark, then funnels into the word
 * "Parsu" as loading progresses. At 100% a light sweep crosses the letters,
 * the word detonates outward, and the screen lifts away like a curtain.
 * Particles scatter away from the cursor / finger.
 *
 * Same props as before: onFinished, authReady, isServerDown.
 * Tweak: WORD, PHASES (status copy), TOTAL_SECONDS.
 */

const WORD = 'Parsu AI';
const TOTAL_SECONDS = 2.4;
const MAX_PARTICLES = 4000;
const FONT_FAMILY = `Outfit, 'Plus Jakarta Sans', system-ui, sans-serif`;

const PHASES = [
  { at: 0, text: 'Waking your agents' },
  { at: 30, text: 'Connecting every model' },
  { at: 62, text: 'Loading your memory' },
  { at: 92, text: 'Ready when you are' },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

const Loading = ({ onFinished, authReady = true, isServerDown = false }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const brandRef = useRef(null);
  const counterRef = useRef(null);
  const statusWrapRef = useRef(null);
  const statusRef = useRef(null);
  const dotRef = useRef(null);

  const sim = useRef({ progress: 0, sweep: 0, burst: 0, bursting: false });
  const api = useRef({});
  const downRef = useRef(isServerDown);
  const phaseTextRef = useRef(PHASES[0].text);
  const onFinishedRef = useRef(onFinished);
  const exitCtxRef = useRef(null);
  const exitStartedRef = useRef(false);
  const [counterDone, setCounterDone] = useState(false);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  // ── Main scene: particles, progress, counter, status ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const S = sim.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let time = 0;
    let last = performance.now();
    let cancelled = false;
    let particles = [];
    let bbox = { x0: 0, x1: 1 };
    let progTween = null;
    let resizeTimer = null;
    let lastN = -1;
    let phaseIdx = -1;
    const mouse = { x: -9999, y: -9999, active: false };

    const renderCounter = (n) => {
      const el = counterRef.current;
      if (!el) return;
      const s = String(n).padStart(3, '0');
      const z = Math.min((s.match(/^0*/) || [''])[0].length, 2);
      el.innerHTML = `<span style="opacity:.22">${s.slice(0, z)}</span>${s.slice(z)}`;
    };

    const showStatus = (text, amber) => {
      const el = statusRef.current;
      const dot = dotRef.current;
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.to(el, {
        opacity: 0,
        y: -6,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          el.textContent = text;
          el.style.color = amber ? '#fcd34d' : '';
          if (dot) dot.style.background = amber ? '#fbbf24' : 'var(--accent-cyan)';
          gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
        },
      });
    };

    const buildTargets = () => {
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const o = off.getContext('2d', { willReadFrequently: true });
      o.font = `800 100px ${FONT_FAMILY}`;
      const m = o.measureText(WORD).width || 300;
      const fontSize = Math.min((100 * (w * 0.8)) / m, h * 0.4);
      o.font = `800 ${fontSize}px ${FONT_FAMILY}`;
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.fillStyle = '#fff';
      o.fillText(WORD, w / 2, h * 0.46);

      const data = o.getImageData(0, 0, w, h).data;
      let gap = clamp(Math.round(fontSize / 50), 3, 8);
      let pts = [];
      for (;; gap++) {
        pts = [];
        for (let y = 0; y < h; y += gap) {
          for (let x = 0; x < w; x += gap) {
            if (data[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);
          }
        }
        if (pts.length <= MAX_PARTICLES) break;
      }

      const maxR = Math.hypot(w, h) * 0.5;
      let x0 = Infinity;
      let x1 = -Infinity;
      particles = pts.map(([tx, ty]) => {
        x0 = Math.min(x0, tx);
        x1 = Math.max(x1, tx);
        const rad = (0.12 + Math.pow(Math.random(), 0.7) * 0.95) * maxR * 0.9;
        const ang = Math.random() * Math.PI * 2;
        return {
          tx,
          ty,
          x: w / 2 + Math.cos(ang) * rad,
          y: h / 2 + Math.sin(ang) * rad * 0.6,
          ox: 0,
          oy: 0,
          vx: 0,
          vy: 0,
          ang,
          rad,
          spd: (0.1 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1) * (1.4 - rad / maxR),
          delay: Math.random(),
          size: 0.8 + Math.random() * 1.4,
          spark: Math.random() < 0.06,
          phase: Math.random() * 6.28,
        };
      });
      bbox = { x0, x1: Math.max(x1, x0 + 1) };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);
      if (!S.bursting) buildTargets();
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      const p = S.progress;
      const cx = w / 2;
      const cy = h / 2;
      const follow = reduce ? 1 : 1 - Math.exp(-dt * 6);
      const burstFade = 1 - S.burst;
      const R = 120;
      const R2 = R * R;
      const decay = Math.pow(0.92, dt * 60);
      const bboxW = bbox.x1 - bbox.x0;
      const sweepPos = bbox.x0 + bboxW * (S.sweep * 1.4 - 0.2);

      // Fade previous frame for trails
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5,7,10,0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particles.length; i++) {
        const q = particles[i];
        let a = 1;

        if (S.bursting) {
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          const k = Math.pow(0.08, dt);
          q.vx *= k;
          q.vy *= k;
        } else {
          let sx = q.x;
          let sy = q.y;
          if (!reduce) {
            q.ang += q.spd * dt;
            sx = cx + Math.cos(q.ang) * q.rad;
            sy = cy + Math.sin(q.ang) * q.rad * 0.6;
          }
          const local = clamp((p - q.delay * 0.7) / 0.3, 0, 1);
          a = reduce ? 1 : smooth(local);
          const jx = reduce ? 0 : Math.sin(time * 1.8 + q.phase) * 0.6 * a;
          const jy = reduce ? 0 : Math.cos(time * 1.5 + q.phase) * 0.6 * a;
          const gx = sx + (q.tx + jx - sx) * a;
          const gy = sy + (q.ty + jy - sy) * a;
          q.x += (gx - q.x) * follow;
          q.y += (gy - q.y) * follow;

          if (mouse.active && !reduce) {
            const dx = q.x - mouse.x;
            const dy = q.y - mouse.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / R) * 4;
              q.ox += (dx / d) * f;
              q.oy += (dy / d) * f;
            }
          }
          q.ox *= decay;
          q.oy *= decay;
        }

        let boost = 0;
        if (S.sweep > 0 && S.sweep < 1) {
          const dd = Math.abs(q.tx - sweepPos) / (bboxW * 0.14);
          if (dd < 1) boost = 1 - dd;
        }

        const r = 110 + (95 - 110) * a + (255 - 110) * boost;
        const g = 160 + (225 - 160) * a + (255 - 160) * boost;
        const b = 215 + (240 - 215) * a + (255 - 215) * boost;
        const alpha = (0.28 + a * 0.62) * burstFade;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
        const s = q.size * (1 + a * 0.3) * (q.spark ? 1.8 : 1) * (1 + boost * 0.8);
        const px = q.x + q.ox;
        const py = q.y + q.oy;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }

      if (glowRef.current) {
        glowRef.current.style.opacity = String(
          (0.18 + p * 0.55 + Math.sin(S.sweep * Math.PI) * 0.35) * (1 - S.burst * 0.6)
        );
      }
    };

    api.current.startBurst = () => {
      S.bursting = true;
      for (const q of particles) {
        const dx = q.x - w / 2;
        const dy = q.y - h / 2;
        const d = Math.hypot(dx, dy) || 1;
        const sp = 500 + Math.random() * 1500;
        q.vx = (dx / d) * sp + (Math.random() - 0.5) * 300;
        q.vy = (dy / d) * sp + (Math.random() - 0.5) * 300 - 250;
      }
    };
    api.current.showStatus = showStatus;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    const init = async () => {
      try {
        await Promise.race([
          document.fonts.load(`800 120px ${FONT_FAMILY}`),
          new Promise((res) => setTimeout(res, 800)),
        ]);
      } catch (e) {
        /* fall back to system font */
      }
      if (cancelled) return;

      resize();
      raf = requestAnimationFrame(frame);

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', onLeave);
      window.addEventListener('blur', onLeave);
      window.addEventListener('resize', onResize);

      gsap.fromTo(
        [brandRef.current, counterRef.current, statusWrapRef.current],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 0.2, ease: 'power3.out' }
      );
      if (downRef.current) showStatus('Waking the server, one moment', true);

      const prog = { v: 0 };
      progTween = gsap.to(prog, {
        v: 100,
        duration: reduce ? 0.5 : TOTAL_SECONDS,
        ease: 'power1.inOut',
        onUpdate: () => {
          S.progress = prog.v / 100;
          const n = Math.floor(prog.v);
          if (n !== lastN) {
            lastN = n;
            renderCounter(n);
          }
          let idx = 0;
          PHASES.forEach((ph, i) => {
            if (n >= ph.at) idx = i;
          });
          if (idx !== phaseIdx) {
            phaseIdx = idx;
            phaseTextRef.current = PHASES[idx].text;
            if (!downRef.current) showStatus(PHASES[idx].text, false);
          }
        },
        onComplete: () => setCounterDone(true),
      });
    };

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      if (progTween) progTween.kill();
      gsap.killTweensOf([
        brandRef.current,
        counterRef.current,
        statusWrapRef.current,
        statusRef.current,
      ]);
      if (exitCtxRef.current) exitCtxRef.current.revert();
    };
  }, []);

  // ── Server status copy ────────────────────────────────────────────────────
  useEffect(() => {
    downRef.current = isServerDown;
    if (!api.current.showStatus) return;
    if (isServerDown) api.current.showStatus('Waking the server, one moment', true);
    else api.current.showStatus(phaseTextRef.current, false);
  }, [isServerDown]);

  // ── Exit: light sweep → burst → curtain lift ──────────────────────────────
  useEffect(() => {
    if (!counterDone || !authReady || isServerDown || exitStartedRef.current) return;
    exitStartedRef.current = true;

    const S = sim.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    exitCtxRef.current = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => typeof onFinishedRef.current === 'function' && onFinishedRef.current(),
      });

      if (reduce) {
        tl.to(containerRef.current, { opacity: 0, duration: 0.4, ease: 'power2.inOut' });
        return;
      }

      tl.to(S, { sweep: 1, duration: 0.75, ease: 'power2.inOut' })
        .call(() => api.current.startBurst?.(), null, '-=0.05')
        .to(S, { burst: 1, duration: 1.1, ease: 'power2.out' }, '<')
        .to(
          [brandRef.current, counterRef.current, statusWrapRef.current],
          { y: -24, opacity: 0, duration: 0.45, ease: 'power3.in', stagger: 0.05 },
          '<'
        )
        .to(
          containerRef.current,
          { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'expo.inOut' },
          '<+0.25'
        );
    }, containerRef);
  }, [counterDone, authReady, isServerDown]);

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      aria-label="Loading Parsu AI"
      className="fixed inset-0 z-[99999] w-screen h-[100dvh] overflow-hidden bg-[#05070a] select-none"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      {/* Glow that swells as the word forms */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[70vmin] h-[70vmin] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(32,184,205,0.35) 0%, rgba(25,45,104,0.18) 40%, transparent 70%)',
          filter: 'blur(30px)',
          opacity: 0.2,
        }}
      />

      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0" />

      {/* Film grain + vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `url(${GRAIN_PATTERN_DATA})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)' }}
      />

      {/* Brand */}
      <div
        ref={brandRef}
        className="absolute top-5 left-5 sm:top-8 sm:left-9 flex items-center gap-2.5 opacity-0"
      >
        <ParsuLogo size={22} className="text-white" />
        <span className="font-display text-sm font-semibold text-zinc-200 tracking-tight">Parsu AI</span>
      </div>

      {/* Counter + status */}
      <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-9 sm:right-9 flex items-end justify-between gap-6">
        <div
          ref={counterRef}
          className="font-display font-light leading-[0.8] tabular-nums text-white opacity-0"
          style={{ fontSize: 'clamp(4.5rem, 15vw, 13rem)' }}
        >
          000
        </div>
        <div
          ref={statusWrapRef}
          className="pb-1 sm:pb-3 flex items-center gap-2.5 text-xs sm:text-sm text-zinc-400 opacity-0"
        >
          <span
            ref={dotRef}
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: 'var(--accent-cyan)' }}
          />
          <span ref={statusRef}>Waking your agents</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;