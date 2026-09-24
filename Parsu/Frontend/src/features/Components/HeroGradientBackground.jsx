import React, { useState, useEffect } from 'react';
import poolsideSvg from '../../assets/Poolside.svg';
import blueSkySvg from '../../assets/Blue sky-2048x1152.svg';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';

/**
 * ============================================================================
 * ⚙️ DEVELOPER HERO BACKDROP CONFIGURATION
 * ============================================================================
 * Developers can choose to:
 * 1. Keep the SAME image for both themes (set useSameImage: true)
 * 2. Or use DIFFERENT images for light and dark themes (set useSameImage: false)
 * 
 * Props can also be passed directly to <HeroGradientBackground />:
 *   <HeroGradientBackground useSameImage={false} darkImage={...} lightImage={...} />
 * ============================================================================
 */
export const HERO_BACKGROUND_CONFIG = {
  // Set to true to use the same image for both themes; false to use separate images per theme
  useSameImage: true,

  // When useSameImage is true (used across all themes):
  sameImage: poolsideSvg,

  // When useSameImage is false:
  darkImage: poolsideSvg,
  lightImage: blueSkySvg, // or any custom image for light theme
};

const HeroGradientBackground = ({
  useSameImage = HERO_BACKGROUND_CONFIG.useSameImage,
  sameImage = HERO_BACKGROUND_CONFIG.sameImage,
  darkImage = HERO_BACKGROUND_CONFIG.darkImage,
  lightImage = HERO_BACKGROUND_CONFIG.lightImage,
}) => {
  // Theme reactivity (supports view transitions and manual toggles)
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Determine current image based on developer configuration & theme
  const currentHeroImage = useSameImage ? sameImage : (isDark ? darkImage : lightImage);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
    >
      {/* ── 1. Parsu Cyan & Hanada Ambient Glow Orbs (Fluid floating animation) ── */}
      <div className="absolute top-[-10%] left-[20%] w-[55vw] max-w-[850px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--accent-cyan)]/35 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/20 blur-[130px] dark:blur-[150px] animate-pulse duration-[8000ms] transform -rotate-6" />
      <div className="absolute top-[15%] right-[-5%] w-[45vw] max-w-[700px] h-[450px] rounded-full bg-gradient-to-bl from-[var(--color-deep-teal)]/40 via-[var(--color-deep-hanada)]/30 to-[var(--accent-cyan)]/20 blur-[120px] dark:blur-[140px] animate-pulse duration-[10000ms]" />
      <div className="absolute top-[35%] left-[5%] w-[35vw] max-w-[600px] h-[350px] rounded-full bg-gradient-to-r from-[var(--accent-cyan)]/20 via-[var(--color-sky-haze)]/15 to-transparent blur-[110px] dark:blur-[130px]" />

      {/* ── 2. User's Configurable Hero Backdrop (Same or Theme-Specific) ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2048px] h-[1190px] max-w-none">
        <img
          key={currentHeroImage}
          src={currentHeroImage}
          alt=""
          className="w-full h-full object-cover opacity-80 dark:opacity-90 transition-opacity duration-700 mix-blend-normal dark:mix-blend-screen scale-[1.01]"
        />

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
