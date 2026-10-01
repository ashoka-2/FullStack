import React from 'react';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';

// Vite serves /public assets from the root path; do not `import` them.
const heroVideo = '/Poolside.mp4';
const heroVideoFallback = '/poolside.mp4';

/** Hero backdrop: glow orbs, looping video (md+ only, saves mobile data), color wash, grain, fade to page. */
const HeroGradientBackground = () => (
  <div aria-hidden="true" className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
    <div className="absolute top-[-10%] left-[20%] w-[55vw] max-w-[850px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--accent-cyan)]/35 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/20 blur-[130px] animate-pulse duration-[8000ms] -rotate-6" />
    <div className="absolute top-[15%] right-[-5%] w-[45vw] max-w-[700px] h-[450px] rounded-full bg-gradient-to-bl from-[var(--color-deep-teal)]/40 via-[var(--color-deep-hanada)]/30 to-[var(--accent-cyan)]/20 blur-[120px] animate-pulse duration-[10000ms]" />

    <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[2048px] h-[1190px] max-w-none">
      <video autoPlay loop muted playsInline preload="metadata" className="w-full h-full object-cover opacity-75 dark:opacity-85 dark:mix-blend-screen">
        <source src={heroVideo} type="video/mp4" />
        <source src={heroVideoFallback} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-cyan)]/20 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/60 mix-blend-color dark:mix-blend-overlay" />
    </div>

    <div
      className="absolute inset-0 opacity-45 dark:opacity-35 mix-blend-overlay z-[1]"
      style={{ backgroundImage: `url(${GRAIN_PATTERN_DATA})`, backgroundRepeat: 'repeat', backgroundSize: '160px 160px' }}
    />
    <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-b from-transparent to-[var(--bg-primary)] z-[2]" />
  </div>
);

export default HeroGradientBackground;  