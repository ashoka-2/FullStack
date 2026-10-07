import React, { useState, useRef, useEffect } from 'react';
import { GRAIN_PATTERN_DATA } from '../../assets/grainData';
import poolsideSvg from '../../assets/Poolside.svg';

// Vite serves /public assets from the root path; do not `import` them.
const heroVideo = '/Poolside.mp4';
const heroVideoFallback = '/poolside.mp4';

/**
 * Hero backdrop: SVG poster → video crossfade, glow orbs, color wash, grain, page fade.
 * Shows the Poolside.svg immediately, fades in the mp4 once it can play.
 */
const HeroGradientBackground = () => {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);

  // Detect slow connection or Data Saver to save 14MB video download
  const isSlowConnection = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return false;
    return Boolean(conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.effectiveType === '3g');
  }, []);

  useEffect(() => {
    if (isSlowConnection) return;
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => setVideoReady(true);
    v.addEventListener('canplaythrough', onCanPlay);
    // If already buffered
    if (v.readyState >= 4) setVideoReady(true);
    return () => v.removeEventListener('canplaythrough', onCanPlay);
  }, [isSlowConnection]);

  return (
    <div aria-hidden="true" className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[55vw] max-w-[850px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--accent-cyan)]/35 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/20 blur-[130px] animate-pulse duration-[8000ms] -rotate-6" />
      <div className="absolute top-[15%] right-[-5%] w-[45vw] max-w-[700px] h-[450px] rounded-full bg-gradient-to-bl from-[var(--color-deep-teal)]/40 via-[var(--color-deep-hanada)]/30 to-[var(--accent-cyan)]/20 blur-[120px] animate-pulse duration-[10000ms]" />

      {/* Visual backdrop: SVG poster + video (responsive) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] md:w-[2048px] h-[900px] md:h-[1190px] max-w-none overflow-hidden">
        {/* SVG poster — always rendered immediately, smoothly fades when video is buffered */}
        <img
          src={poolsideSvg}
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-0' : 'opacity-75 dark:opacity-85'}`}
        />
        {/* Video — only downloaded on high-speed connections to save 14MB cellular data */}
        {!isSlowConnection && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            poster={poolsideSvg}
            preload="metadata"
            onCanPlayThrough={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            className={`absolute inset-0 w-full h-full object-cover dark:mix-blend-screen transition-opacity duration-1000 ${videoReady ? 'opacity-75 dark:opacity-85' : 'opacity-0'}`}
          >
            <source src={heroVideo} type="video/mp4" />
            <source src={heroVideoFallback} type="video/mp4" />
          </video>
        )}
        {/* Color wash overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-cyan)]/20 via-[var(--color-clear-hanada)]/25 to-[var(--color-deep-hanada)]/60 mix-blend-color dark:mix-blend-overlay pointer-events-none" />

        {/* Grain texture — strictly ONLY inside the video layer */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30 mix-blend-overlay pointer-events-none z-[1]"
          style={{ backgroundImage: `url(${GRAIN_PATTERN_DATA})`, backgroundRepeat: 'repeat', backgroundSize: '160px 160px' }}
        />

        {/* Soft edge radial vignette so the video blends seamlessly into the surrounding page */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--bg-primary)_95%)] pointer-events-none z-[2]" />
      </div>

      {/* Fade to page bg at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-b from-transparent to-[var(--bg-primary)] z-[2]" />
    </div>
  );
};

export default HeroGradientBackground;