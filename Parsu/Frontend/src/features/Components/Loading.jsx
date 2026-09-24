import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ParsuLogo from './ParsuLogo';

/**
 * Loading — Cybernetic Liquid Wave Preloader
 * Features:
 * - Dynamic undulating multi-path cubic Bezier liquid waves that surge upwards as the counter progresses (0% -> 100%).
 * - Rich ambient background with pulsing cyan/teal glow orbs and tactile film grain texture (NEVER a flat single color).
 * - Floating Apple Liquid Glass centerpiece HUD with glowing Parsu insignia and rotating halo.
 * - Tabular italic gradient counter (0 -> 100%) with liquid glowing capsule progress bar.
 * - Real-time streaming telemetry and status logs.
 * - Unidirectional downward liquid wave exit reveal when 100% and auth complete.
 */
const Loading = ({ onFinished, authReady = true }) => {
  const containerRef = useRef(null);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const path3Ref = useRef(null);
  const hudCardRef = useRef(null);
  const counterTextRef = useRef(null);
  const progressBarRef = useRef(null);
  const statusTextRef = useRef(null);

  const [counterDone, setCounterDone] = useState(false);
  const exitStartedRef = useRef(false);

  useEffect(() => {
    const paths = [path1Ref.current, path2Ref.current, path3Ref.current].filter(Boolean);
    const numPaths = paths.length || 3;
    const numPoints = 10;

    let ctx = gsap.context(() => {
      // Set initial HUD state
      gsap.set(hudCardRef.current, { opacity: 0, scale: 0.92, y: 20 });

      // Animate HUD card entrance
      gsap.to(hudCardRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      });

      // Status text steps
      const getStatusMsg = (val) => {
        if (val < 25) return 'INITIALIZING NEURAL RUNTIME...';
        if (val < 50) return 'SYNTHESIZING KNOWLEDGE GRAPH...';
        if (val < 75) return 'CONNECTING MULTI-MODEL INFERENCE...';
        if (val < 95) return 'CALIBRATING WORKSPACE MEMORY...';
        return 'PARSU INTELLIGENCE READY';
      };

      // Progress counter object
      const progress = { value: 0 };

      // Render rising Bezier wave anchored to bottom
      const renderRisingWave = (val) => {
        const time = Date.now() * 0.003;

        for (let i = 0; i < numPaths; i++) {
          const path = paths[i];
          if (!path) continue;

          // Layer 0 is deep, Layer 2 is leading crest
          // When val=0, baseY is 106 (hidden below bottom edge)
          // When val=100, baseY is -2 (completely covers the screen)
          const layerOffset = (2 - i) * 3;
          const baseY = 106 - val * 1.08 + layerOffset;

          const points = [];
          for (let j = 0; j < numPoints; j++) {
            // Smooth undulating sine wave that dampens slightly as it covers
            const undulation = Math.sin(time + j * 0.8 + i * 1.3) * (3.8 * (1 - val / 130));
            const y = Math.max(0, Math.min(105, baseY + undulation));
            points.push(y);
          }

          let d = `M 0 ${points[0]} C`;
          for (let j = 0; j < numPoints - 1; j++) {
            const p = ((j + 1) / (numPoints - 1)) * 100;
            const cp = p - ((1 / (numPoints - 1)) * 100) / 2;
            d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
          }
          d += ` V 100 H 0 Z`;
          path.setAttribute('d', d);
        }
      };

      // Main 0 -> 100 timeline
      const tl = gsap.timeline({
        onComplete: () => {
          setCounterDone(true);
        },
      });

      tl.to(progress, {
        value: 100,
        duration: 1.65,
        ease: 'power2.inOut',
        onUpdate: () => {
          const currentVal = Math.floor(progress.value);

          // Update percentage number
          if (counterTextRef.current) {
            counterTextRef.current.innerText = currentVal;
          }

          // Update progress bar width
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progress.value}%`;
          }

          // Update telemetry status text
          if (statusTextRef.current) {
            statusTextRef.current.innerText = getStatusMsg(currentVal);
          }

          // Dynamically animate rising liquid wave paths
          renderRisingWave(progress.value);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Monitor when both count reaches 100 and auth is confirmed ready
  useEffect(() => {
    if (!counterDone || !authReady || exitStartedRef.current) return;
    exitStartedRef.current = true;

    const paths = [path1Ref.current, path2Ref.current, path3Ref.current].filter(Boolean);
    if (!paths.length) {
      if (onFinished) onFinished();
      return;
    }

    const numPoints = 10;
    const numPaths = paths.length;
    const delayPointsMax = 0.12;
    const delayPerPath = 0.08;
    const duration = 0.65;

    // All exit points start at 0 (meaning screen is 100% covered from y=0 to y=100)
    const allExitPoints = [];
    for (let i = 0; i < numPaths; i++) {
      const points = [];
      for (let j = 0; j < numPoints; j++) {
        points.push(0);
      }
      allExitPoints.push(points);
    }

    const pointsDelay = [];
    for (let i = 0; i < numPoints; i++) {
      pointsDelay[i] = Math.random() * delayPointsMax;
    }

    // Render downward exit: top boundary pours down from y=0 to y=100, peeling off bottom
    const renderExit = () => {
      for (let i = 0; i < numPaths; i++) {
        const path = paths[i];
        const points = allExitPoints[i];
        if (!path || !points) continue;

        let d = `M 0 ${points[0]} C`;
        for (let j = 0; j < numPoints - 1; j++) {
          const p = ((j + 1) / (numPoints - 1)) * 100;
          const cp = p - ((1 / (numPoints - 1)) * 100) / 2;
          d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
        }
        d += ` V 100 H 0 Z`;
        path.setAttribute('d', d);
      }
    };

    let ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          if (onFinished) onFinished();
        },
      });

      // 1. Elegantly fade and scale HUD card out
      exitTl.to(hudCardRef.current, {
        opacity: 0,
        scale: 0.94,
        y: -15,
        duration: 0.3,
        ease: 'power2.in',
      });

      // 2. Animate points 0 -> 100: liquid waves cascade strictly downward off the bottom
      const waveOutTl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration },
        onUpdate: renderExit,
      });

      for (let i = 0; i < numPaths; i++) {
        const points = allExitPoints[i];
        const pathDelay = delayPerPath * (numPaths - i - 1);

        for (let j = 0; j < numPoints; j++) {
          const delay = pointsDelay[j];
          waveOutTl.to(points, { [j]: 100 }, delay + pathDelay);
        }
      }

      exitTl.add(waveOutTl, '-=0.1');
    }, containerRef);

    return () => ctx.revert();
  }, [counterDone, authReady, onFinished]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] w-screen h-[100dvh] overflow-hidden pointer-events-auto bg-[#07090d] select-none flex items-center justify-center"
    >
      {/* ── Ambient Radial Glow Orbs (Never a single flat color) ── */}
      <div className="absolute top-1/4 -left-20 w-[420px] h-[420px] rounded-full bg-[var(--accent-cyan)]/20 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[460px] h-[460px] rounded-full bg-[var(--color-clear-hanada)]/15 blur-[150px] pointer-events-none animate-pulse [animation-delay:1.5s]" />
      <div className="absolute inset-0 bg-radial from-[var(--color-deep-hanada)]/15 via-transparent to-transparent pointer-events-none" />

      {/* ── Subtle Cybernetic Coordinate Grid ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--accent-cyan, #20b8cd) 1px, transparent 1px), linear-gradient(to bottom, var(--accent-cyan, #20b8cd) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Multi-Path Organic Liquid Wave Overlays (Blake Bowen algorithm) ── */}
      <svg
        className="w-full h-full absolute inset-0 preserve-3d pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Deep dark foundation wave */}
          <linearGradient id="load-liquid-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-deep-teal, #081e23)" />
            <stop offset="100%" stopColor="var(--color-deep-hanada, #192D68)" />
          </linearGradient>

          {/* Primary middle wave */}
          <linearGradient id="load-liquid-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-clear-hanada, #3F63A8)" />
            <stop offset="100%" stopColor="var(--accent-cyan, #20b8cd)" />
          </linearGradient>

          {/* Radiant leading wave crest */}
          <linearGradient id="load-liquid-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-cyan, #20b8cd)" />
            <stop offset="100%" stopColor="var(--color-sky-haze, #8DAAD3)" />
          </linearGradient>
        </defs>

        <path ref={path1Ref} fill="url(#load-liquid-1)" d="" />
        <path ref={path2Ref} fill="url(#load-liquid-2)" d="" />
        <path ref={path3Ref} fill="url(#load-liquid-3)" d="" />
      </svg>

      {/* ── Floating Apple Liquid Glass HUD Centerpiece ── */}
      <div
        ref={hudCardRef}
        className="relative z-20 w-[90vw] max-w-[440px] p-8 sm:p-10 rounded-3xl backdrop-blur-3xl bg-[#0b0e14]/75 border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(32,184,205,0.12)] border-t-white/20"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] via-[#0ea5e9] to-teal-400 flex items-center justify-center text-black shadow-lg shadow-cyan-500/25">
                <ParsuLogo size={22} className="text-black" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-sm -z-10 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-[0.2em] uppercase text-white drop-shadow-xs">
                  Parsu AI
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Neural Orchestration Platform</p>
            </div>
          </div>

          {/* Active status pulse badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 -ml-3" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Counter Display */}
        <div className="flex items-baseline justify-between mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
            System Initialization
          </span>
          <div className="flex items-baseline">
            <span
              ref={counterTextRef}
              className="text-6xl sm:text-7xl font-black italic tracking-tight tabular-nums bg-gradient-to-br from-white via-cyan-100 to-[var(--accent-cyan)] bg-clip-text text-transparent leading-none drop-shadow-lg"
            >
              0
            </span>
            <span className="text-2xl sm:text-3xl font-light italic text-[var(--accent-cyan)] ml-1 opacity-90">
              %
            </span>
          </div>
        </div>

        {/* Glowing Capsule Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/10 p-0.5 border border-white/10 overflow-hidden mb-6 relative shadow-inner">
          <div
            ref={progressBarRef}
            className="h-full rounded-full bg-gradient-to-r from-[#0ea5e9] via-[var(--accent-cyan)] to-[#67e8f9] shadow-[0_0_12px_rgba(32,184,205,0.7)] transition-all duration-75 relative overflow-hidden"
            style={{ width: '0%' }}
          >
            {/* Shimmer line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Telemetry Status Log */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5 font-mono">
          <span ref={statusTextRef} className="text-cyan-400 font-semibold tracking-wide">
            INITIALIZING NEURAL RUNTIME...
          </span>
          <span className="text-zinc-500">256-BIT TLS</span>
        </div>
      </div>

      {/* ── Tactile Cinema Grain Texture Layer ── */}
      <div className="absolute inset-0 opacity-[0.18] pointer-events-none mix-blend-overlay bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E&quot;)]" />
    </div>
  );
};

export default Loading;