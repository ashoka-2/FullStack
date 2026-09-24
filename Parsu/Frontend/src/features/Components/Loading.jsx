import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ParsuLogo from './ParsuLogo';

/**
 * Loading — Ultra-Luxury OLED GSAP Preloader
 * Designed with AI-Design skill specifications:
 * - Deep OLED dark canvas (#000000 / #050505) with ambient cyan radial illumination
 * - Minimalist, high-end floating insignia with subtle pulsing halo
 * - Precision numeric percentage counter (0% -> 100%) with hairline progress bar
 * - Real-time system telemetry status indicators
 * - Buttery smooth GSAP exit transition
 */
const Loading = ({ onFinished, authReady = true }) => {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const counterTextRef = useRef(null);
  const progressBarRef = useRef(null);
  const statusTextRef = useRef(null);

  const [counterDone, setCounterDone] = useState(false);
  const exitStartedRef = useRef(false);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 1. Initial State Setup
      gsap.set(cardRef.current, { opacity: 0, y: 15, scale: 0.96 });
      gsap.set(logoWrapperRef.current, { scale: 0.9, opacity: 0 });

      // 2. Entrance Sequence
      const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      introTl
        .to(logoWrapperRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.7,
        })
        .to(
          cardRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
          },
          '-=0.4'
        );

      // 3. Subtle Ambient Logo Breathing
      gsap.to(logoWrapperRef.current, {
        scale: 1.03,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // 4. Status Messages based on progress
      const getStatusMsg = (val) => {
        if (val < 30) return 'INITIALIZING RUNTIME...';
        if (val < 60) return 'CALIBRATING NEURAL MODELS...';
        if (val < 90) return 'SYNCHRONIZING WORKSPACE...';
        return 'READY';
      };

      // 5. Interpolate 0% to 100% counter
      const progress = { val: 0 };

      gsap.to(progress, {
        val: 100,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          const rounded = Math.floor(progress.val);

          if (counterTextRef.current) {
            counterTextRef.current.innerText = rounded;
          }

          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progress.val}%`;
          }

          if (statusTextRef.current) {
            statusTextRef.current.innerText = getStatusMsg(rounded);
          }
        },
        onComplete: () => {
          setCounterDone(true);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 6. Monitor Exit Trigger (when count reaches 100 and auth is ready)
  useEffect(() => {
    if (!counterDone || !authReady || exitStartedRef.current) return;
    exitStartedRef.current = true;

    let ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          if (typeof onFinished === 'function') {
            onFinished();
          }
        },
      });

      exitTl
        .to(cardRef.current, {
          opacity: 0,
          scale: 1.03,
          y: -10,
          filter: 'blur(8px)',
          duration: 0.45,
          ease: 'power3.in',
        })
        .to(
          containerRef.current,
          {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut',
          },
          '-=0.15'
        );
    }, containerRef);

    return () => ctx.revert();
  }, [counterDone, authReady, onFinished]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] w-screen h-[100dvh] overflow-hidden pointer-events-auto bg-[#050505] select-none flex items-center justify-center"
    >
      {/* ── Subtle Ambient Cyan Spotlight Behind Center ── */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[var(--accent-cyan)]/10 blur-[140px] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none" />

      {/* ── Centerpiece Glass Surface ── */}
      <div
        ref={cardRef}
        className="relative z-10 w-[90vw] max-w-[380px] px-8 py-9 rounded-2xl bg-[#0B0B0B]/80 border border-white/[0.08] backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] flex flex-col items-center text-center"
      >
        {/* Animated Glowing Logo Mark */}
        <div ref={logoWrapperRef} className="relative mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-white/[0.12] flex items-center justify-center text-[var(--accent-cyan)] shadow-[0_0_25px_rgba(32,184,205,0.25)]">
            <ParsuLogo size={26} className="text-[var(--accent-cyan)]" />
          </div>
          {/* Subtle outer breathing ring */}
          <div className="absolute -inset-1 rounded-2xl border border-[var(--accent-cyan)]/25 animate-pulse -z-10" />
        </div>

        {/* Brand Name */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[15px] font-black tracking-[0.25em] text-white uppercase">
            PARSU
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider text-black bg-[var(--accent-cyan)] shadow-xs">
            AI
          </span>
        </div>

        {/* Numeric Counter Display */}
        <div className="flex items-baseline justify-center mb-5">
          <span
            ref={counterTextRef}
            className="text-5xl sm:text-6xl font-black tracking-tight tabular-nums text-white"
          >
            0
          </span>
          <span className="text-xl font-light text-[var(--accent-cyan)] ml-1">
            %
          </span>
        </div>

        {/* Sleek Hairline Progress Bar */}
        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-6 relative border border-white/[0.04]">
          <div
            ref={progressBarRef}
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-cyan-300 shadow-[0_0_12px_rgba(32,184,205,0.8)] transition-all duration-75"
            style={{ width: '0%' }}
          />
        </div>

        {/* Status Telemetry */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-3 border-t border-white/[0.06]">
          <span ref={statusTextRef} className="text-zinc-300 font-medium tracking-wide">
            INITIALIZING RUNTIME...
          </span>
          <span className="text-[10px] tracking-wider text-zinc-600">v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;