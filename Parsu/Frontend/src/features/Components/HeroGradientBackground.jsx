import React from 'react';

// ============================================================================
// 🖼️ HERO BACKGROUND MEDIA ASSETS
// ============================================================================
// Currently active background: Poolside.svg (used for both dark & light themes across all devices)
// import poolsideSvg from '../../assets/Poolside.svg';

// Example secondary assets (uncomment and supply paths when needed):
// import blueSkySvg from '../../assets/Blue sky-2048x1152.svg';
import heroVideoDark from '../../../public/poolside.mp4';
// import heroVideoLight from '../../assets/hero-background-light.mp4';

import { GRAIN_PATTERN_DATA } from '../../assets/grainData';

/**
 * ============================================================================
 * ⚙️ DEVELOPER GUIDE — HERO SECTION BACKGROUND COMPONENT
 * ============================================================================
 * This component renders the entire background for the landing page hero section.
 *
 * HOW DEVELOPERS CAN CHANGE THE HERO BACKGROUND:
 * ----------------------------------------------------------------------------
 * 1. TO USE A BACKGROUND VIDEO:
 *    - Comment out [OPTION 1: ACTIVE IMAGE - POOLSIDE.SVG] below.
 *    - Uncomment [OPTION 5: BACKGROUND VIDEO (AUTOPLAY LOOP)].
 *
 * 2. TO USE DIFFERENT BACKGROUND IMAGES FOR LIGHT & DARK THEMES:
 *    - Comment out [OPTION 1].
 *    - Uncomment [OPTION 2: THEME-SPECIFIC BACKGROUND IMAGES (DARK vs LIGHT)].
 *
 * 3. TO USE RESPONSIVE BACKGROUND IMAGES (MOBILE / TABLET / DESKTOP):
 *    - Comment out [OPTION 1].
 *    - Uncomment [OPTION 3: RESPONSIVE BACKGROUND IMAGES].
 *
 * 4. TO USE SEPARATE BACKGROUND VIDEOS FOR LIGHT & DARK THEMES:
 *    - Comment out [OPTION 1].
 *    - Uncomment [OPTION 6: THEME-SPECIFIC BACKGROUND VIDEOS].
 * ============================================================================
 */

const HeroGradientBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
    >
      {/* ── 1. Parsu Cyan & Hanada Ambient Glow Orbs (Atmospheric Depth) ── */}
      <div className="absolute top-[-10%] left-[20%] w-[55vw] max-w-[850px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--accent-cyan)]/35 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/20 blur-[130px] dark:blur-[150px] animate-pulse duration-[8000ms] transform -rotate-6" />
      <div className="absolute top-[15%] right-[-5%] w-[45vw] max-w-[700px] h-[450px] rounded-full bg-gradient-to-bl from-[var(--color-deep-teal)]/40 via-[var(--color-deep-hanada)]/30 to-[var(--accent-cyan)]/20 blur-[120px] dark:blur-[140px] animate-pulse duration-[10000ms]" />
      <div className="absolute top-[35%] left-[5%] w-[35vw] max-w-[600px] h-[350px] rounded-full bg-gradient-to-r from-[var(--accent-cyan)]/20 via-[var(--color-sky-haze)]/15 to-transparent blur-[110px] dark:blur-[130px]" />

      {/* ── 2. Hero Background Media Container (2048x1190 centered canvas) ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2048px] h-[1190px] max-w-none">

        {/* =====================================================================
            ⭐ OPTION 1: [CURRENT ACTIVE]
            Poolside.svg background image for BOTH Dark & White Themes on ALL devices
            ===================================================================== */}
        {/* <img
          src={poolsideSvg}
          alt=""
          className="w-full h-full object-cover opacity-80 dark:opacity-90 transition-opacity duration-700 mix-blend-normal dark:mix-blend-screen scale-[1.01]"
          loading="eager"
        /> */}

        {/* =====================================================================
            💡 OPTION 2: [COMMENTED]
            Different Background Images for Dark Mode vs Light Mode
            To use: Comment Option 1 above, and uncomment this block.
            =====================================================================
        {/*
        <picture className="w-full h-full">
          <!-- Dark mode background image (shown when document has .dark) -->
          <img
            src={poolsideSvg}
            alt=""
            className="w-full h-full object-cover opacity-90 dark:block hidden mix-blend-screen scale-[1.01]"
          />
          <!-- Light mode background image (shown when in light mode) -->
          <img
            src="/path/to/hero-light-backdrop.svg"
            alt=""
            className="w-full h-full object-cover opacity-80 dark:hidden block mix-blend-normal scale-[1.01]"
          />
        </picture>
        */}

        {/* =====================================================================
            💡 OPTION 3: [COMMENTED]
            Responsive Background Images for Mobile, Tablet, and Desktop
            To use: Comment Option 1 above, and uncomment this block.
            =====================================================================
        {/*
        <picture className="w-full h-full">
          <!-- Mobile viewport (<640px) -->
          <source media="(max-width: 639px)" srcSet="/path/to/hero-bg-mobile.svg" />
          <!-- Tablet viewport (640px - 1023px) -->
          <source media="(max-width: 1023px)" srcSet="/path/to/hero-bg-tablet.svg" />
          <!-- Desktop default (>=1024px) -->
          <img
            src={poolsideSvg}
            alt=""
            className="w-full h-full object-cover opacity-80 dark:opacity-90 mix-blend-normal dark:mix-blend-screen scale-[1.01]"
          />
        </picture>
        */}

        {/* =====================================================================
            💡 OPTION 4: [COMMENTED]
            Full Matrix: Responsive Devices (Mobile/Tablet/Desktop) × Theme (Dark/Light)
            To use: Comment Option 1 above, and uncomment this block.
            =====================================================================
        {/*
        <picture className="w-full h-full">
          <source media="(prefers-color-scheme: dark) and (max-width: 639px)" srcSet="/path/to/hero-dark-mobile.svg" />
          <source media="(prefers-color-scheme: dark) and (max-width: 1023px)" srcSet="/path/to/hero-dark-tablet.svg" />
          <source media="(prefers-color-scheme: dark)" srcSet={poolsideSvg} />
          <source media="(max-width: 639px)" srcSet="/path/to/hero-light-mobile.svg" />
          <source media="(max-width: 1023px)" srcSet="/path/to/hero-light-tablet.svg" />
          <img
            src="/path/to/hero-light-desktop.svg"
            alt=""
            className="w-full h-full object-cover opacity-80 dark:opacity-90 mix-blend-normal dark:mix-blend-screen scale-[1.01]"
          />
        </picture>
        */}

        {/* =====================================================================
            🎬 OPTION 5: [COMMENTED]
            Background Video (Autoplay, Looping, Muted Ambient Hero Video)
            To use: Comment Option 1 above, and uncomment this block.
            =====================================================================
        */}
        <video
          autoPlay
          loop
          muted
          playsInline
          // poster={poolsideSvg}
          className="w-full h-full object-cover opacity-75 dark:opacity-85 mix-blend-normal dark:mix-blend-screen scale-[1.01]"
        >
          <source src={heroVideoDark} type="video/webm" />
          <source src={heroVideoDark} type="video/mp4" />
        </video>
        

        {/* =====================================================================
            🎥 OPTION 6: [COMMENTED]
            Theme-Specific Background Videos (Separate Videos for Dark vs Light Mode)
            To use: Comment Option 1 above, and uncomment this block.
            =====================================================================
        {/*
        <div className="w-full h-full">
          <!-- Dark Mode Video -->
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={poolsideSvg}
            className="w-full h-full object-cover opacity-85 dark:block hidden mix-blend-screen scale-[1.01]"
          >
            <source src="/path/to/hero-dark.mp4" type="video/mp4" />
          </video>
          <!-- Light Mode Video -->
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={poolsideSvg}
            className="w-full h-full object-cover opacity-75 dark:hidden block mix-blend-normal scale-[1.01]"
          >
            <source src="/path/to/hero-light.mp4" type="video/mp4" />
          </video>
        </div>
        */}

        {/* Parsu Theme Color Wash Overlay: Injects signature palette shades into the SVG */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[var(--accent-cyan)]/20 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/60 mix-blend-color dark:mix-blend-overlay pointer-events-none"
        />

        {/* ── 3. Animated Decorative Cyan Vector Waves & Splines ────── */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          viewBox="0 0 2048 1190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Parsu Cyan & Hanada Theme Gradients */}
            <linearGradient id="parsuCyanWave1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent-cyan, #20b8cd)" stopOpacity="0" />
              <stop offset="20%" stopColor="var(--accent-cyan, #20b8cd)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="var(--color-sky-haze, #8daad3)" stopOpacity="0.9" />
              <stop offset="80%" stopColor="var(--color-clear-hanada, #3f63a8)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--color-deep-hanada, #192d68)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="parsuCyanWave2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-deep-teal, #081e23)" stopOpacity="0" />
              <stop offset="30%" stopColor="var(--color-deep-hanada, #192d68)" stopOpacity="0.6" />
              <stop offset="60%" stopColor="var(--accent-cyan, #20b8cd)" stopOpacity="0.75" />
              <stop offset="90%" stopColor="var(--color-ice-hanada, #cfddea)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent-cyan, #20b8cd)" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="parsuCyanWave3" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent-cyan, #20b8cd)" stopOpacity="0" />
              <stop offset="45%" stopColor="var(--color-sky-haze, #8daad3)" stopOpacity="0.5" />
              <stop offset="75%" stopColor="var(--color-clear-hanada, #3f63a8)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-cyan, #20b8cd)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Wave Path 1: Primary Sweeping Cyan Curve */}
          <path
            d="M-100 320 C 350 160, 750 520, 1250 280 C 1650 120, 1920 400, 2200 240"
            stroke="url(#parsuCyanWave1)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-wave-flow opacity-70 dark:opacity-85"
          />

          {/* Wave Path 2: Secondary Harmonic Teal-Cyan Ribbon */}
          <path
            d="M-50 460 C 380 290, 780 660, 1300 410 C 1700 240, 1960 540, 2180 370"
            stroke="url(#parsuCyanWave2)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-wave-flow-slow opacity-60 dark:opacity-75"
          />

          {/* Wave Path 3: Subtle High-Frequency Filament Wave */}
          <path
            d="M0 240 C 450 380, 950 180, 1450 340 C 1850 480, 2050 220, 2250 300"
            stroke="url(#parsuCyanWave3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="8 6"
            className="opacity-40 dark:opacity-60"
          />
        </svg>
      </div>

      {/* ── 4. Tactile Film Grain Texture Overlay (Analog Aesthetic) ────── */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-45 dark:opacity-35 mix-blend-overlay z-[1]"
        style={{
          backgroundImage: `url(${GRAIN_PATTERN_DATA})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
        }}
      />

      {/* ── 5. Bottom Edge Gradient Fade to Page Surface ──────────── */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-b from-transparent via-[#f4f5f7]/60 to-[#f4f5f7] dark:via-[#0e100f]/70 dark:to-[#0e100f] pointer-events-none z-[2]" />
    </div>
  );
};

export default HeroGradientBackground;
