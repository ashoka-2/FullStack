import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import {
  RiPlayFill,
  RiPauseFill,
  RiVolumeMuteLine,
  RiVolumeUpLine,
  RiFullscreenLine,
  RiImageLine,
  RiVideoLine,
  RiTerminalBoxLine,
  RiSearchLine,
  RiFlashlightLine,
  RiSendPlane2Fill,
  RiSparkling2Line,
  RiExternalLinkLine
} from '@remixicon/react';
import ParsuLogo from './ParsuLogo';

/**
 * ============================================================================
 * ⚙️ DEVELOPER QUICK CONFIGURATION
 * ============================================================================
 * Any developer can easily switch this landing page hero showcase between
 * 'image', 'video', or 'interactive' right here or via JSX props!
 * 
 * Examples:
 *   <HeroMediaShowcase type="image" src="/path/to/hero.png" />
 *   <HeroMediaShowcase type="video" src="/path/to/hero.mp4" />
 *   <HeroMediaShowcase type="interactive" />
 * ============================================================================
 */
export const DEFAULT_HERO_MEDIA_CONFIG = {
  // Mode: 'interactive' | 'image' | 'video'
  type: 'interactive',

  // 1. IMAGE MODE CONFIGURATION
  image: {
    // Set to true to use the same image for both themes; false for separate light/dark images
    useSameImage: true,
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop',
    darkSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop',
    lightSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2400&auto=format&fit=crop',
    alt: 'Parsu AI Autonomous Multi-Model Intelligence Studio',
    caption: 'Parsu AI Unified Neural Workspace',
    badge: 'Preview Screenshot'
  },

  // 2. VIDEO MODE CONFIGURATION
  video: {
    useSameVideo: true,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    darkSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    lightSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop',
    autoPlay: true,
    loop: true,
    muted: true,
    badge: 'Video Walkthrough'
  },

  // 3. INTERACTIVE TERMINAL CONFIGURATION
  interactive: {
    badge: 'Live Model Terminal',
    urlBar: 'https://parsuai.vercel.app/workspace'
  }
};

export default function HeroMediaShowcase({
  type = DEFAULT_HERO_MEDIA_CONFIG.type,
  src,
  darkSrc,
  lightSrc,
  useSameImage,
  poster,
  alt,
  caption,
  autoPlay,
  loop,
  muted,
  className = "",
  showDevSwitcher = true // Allows instant previewing between Image / Video / Interactive on the page
}) {
  // Current active mode (initialized from prop or config, can be toggled by developer)
  const [activeType, setActiveType] = useState(type);

  // Theme reactivity
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Video playback states
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay ?? DEFAULT_HERO_MEDIA_CONFIG.video.autoPlay);
  const [isMuted, setIsMuted] = useState(muted ?? DEFAULT_HERO_MEDIA_CONFIG.video.muted);
  const [videoProgress, setVideoProgress] = useState(0);

  // Interactive model states
  const [activeModel, setActiveModel] = useState('gemini');

  const models = [
    { id: 'gemini', name: 'Gemini 3.6 Flash', provider: 'Google', badge: 'Ultra Fast', color: 'text-cyan-400' },
    { id: 'claude', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Deep Reasoning', color: 'text-amber-400' },
    { id: 'gpt4', name: 'GPT-4o Omnimodal', provider: 'OpenAI', badge: 'Code & Logic', color: 'text-emerald-400' },
    { id: 'deepseek', name: 'DeepSeek R1', provider: 'DeepSeek', badge: 'Math & Proofs', color: 'text-blue-400' },
  ];

  const samplePrompts = {
    gemini: {
      query: "Analyze latest trends in multimodal AI agent tool-use and draft a technical briefing...",
      result: "Based on real-time 2026 developer indices, autonomous tool-use has surged by 340% YoY. Key drivers include structured JSON output schema validation, ephemeral session sandboxing, and parallel function calling across Gemini 3.6 and Claude 3.5 architectures.",
      tokens: "248 tokens/sec",
      latency: "112ms",
    },
    claude: {
      query: "Audit our React 19 server actions for security vulnerabilities and race conditions...",
      result: "Analysis complete: Identified 2 potential idempotency hazards in concurrent checkout hooks. Refactoring with React 19 useOptimistic and optimistic locking prevents double-charges during network flaps.",
      tokens: "185 tokens/sec",
      latency: "190ms",
    },
    gpt4: {
      query: "Write a high-converting carousel script for LinkedIn announcing our new design system...",
      result: "Slide 1: We spent 6 months rebuilding our UI from scratch. Here's why 90% of design tokens fail at scale...\nSlide 2: Rule 1 - Optical alignment over strict pixel grids. FeralUI spring physics feel alive.",
      tokens: "195 tokens/sec",
      latency: "140ms",
    },
    deepseek: {
      query: "Derive the loss function for mixture-of-experts routing with auxiliary load-balancing loss...",
      result: "The unified auxiliary loss enforces uniform expert utilization: L_aux = α * N * Σ(f_i * P_i) where f_i is expert fraction and P_i is routing probability. This prevents single-expert collapse.",
      tokens: "210 tokens/sec",
      latency: "135ms",
    },
  };

  // Sync prop changes
  useEffect(() => {
    setActiveType(type);
  }, [type]);

  // Video controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(progress);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const effectiveUseSameImage = useSameImage ?? DEFAULT_HERO_MEDIA_CONFIG.image.useSameImage;
  const imageSrc = src || (
    effectiveUseSameImage
      ? DEFAULT_HERO_MEDIA_CONFIG.image.src
      : (isDark
          ? (darkSrc || DEFAULT_HERO_MEDIA_CONFIG.image.darkSrc)
          : (lightSrc || DEFAULT_HERO_MEDIA_CONFIG.image.lightSrc))
  );
  const imageAlt = alt || DEFAULT_HERO_MEDIA_CONFIG.image.alt;
  const imageCaption = caption || DEFAULT_HERO_MEDIA_CONFIG.image.caption;

  const videoSrc = src || (
    DEFAULT_HERO_MEDIA_CONFIG.video.useSameVideo
      ? DEFAULT_HERO_MEDIA_CONFIG.video.src
      : (isDark
          ? (darkSrc || DEFAULT_HERO_MEDIA_CONFIG.video.darkSrc)
          : (lightSrc || DEFAULT_HERO_MEDIA_CONFIG.video.lightSrc))
  );
  const videoPoster = poster || DEFAULT_HERO_MEDIA_CONFIG.video.poster;

  return (
    <div
      id="preview"
      className={`mt-12 sm:mt-16 rounded-3xl border border-zinc-300/80 dark:border-white/15 bg-white/80 dark:bg-[var(--bg-primary)]/85 backdrop-blur-2xl p-3 sm:p-5 shadow-2xl shadow-cyan-500/10 transition-all ${className}`}
    >
      {/* ── Apple Liquid Glass Top Window Bar ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-zinc-200/80 dark:border-white/5 mb-4 text-xs">
        
        {/* Left: Window Dots & URL */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400/90 shadow-xs" />
          <span className="w-3 h-3 rounded-full bg-amber-400/90 shadow-xs" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-xs" />
          <span className="ml-2 font-mono text-[11px] text-zinc-400 hidden sm:inline">
            {DEFAULT_HERO_MEDIA_CONFIG.interactive.urlBar}
          </span>
        </div>

        {/* Center: Developer Quick Media Mode Switcher */}
        {showDevSwitcher && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold">
            <button
              onClick={() => setActiveType('interactive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeType === 'interactive'
                  ? 'bg-white dark:bg-zinc-800 text-[var(--accent-cyan)] shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <RiTerminalBoxLine size={13} />
              <span>Interactive</span>
            </button>
            <button
              onClick={() => setActiveType('image')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeType === 'image'
                  ? 'bg-white dark:bg-zinc-800 text-[var(--accent-cyan)] shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <RiImageLine size={13} />
              <span>Image</span>
            </button>
            <button
              onClick={() => setActiveType('video')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeType === 'video'
                  ? 'bg-white dark:bg-zinc-800 text-[var(--accent-cyan)] shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <RiVideoLine size={13} />
              <span>Video</span>
            </button>
          </div>
        )}

        {/* Right: Live Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-ping" />
          <span className="text-[11px] font-bold text-[var(--accent-cyan)] uppercase tracking-wider">
            {activeType === 'interactive'
              ? DEFAULT_HERO_MEDIA_CONFIG.interactive.badge
              : activeType === 'video'
              ? DEFAULT_HERO_MEDIA_CONFIG.video.badge
              : DEFAULT_HERO_MEDIA_CONFIG.image.badge}
          </span>
        </div>

      </div>

      {/* ── 1. IMAGE MODE VIEW ─────────────────────────────────────── */}
      {activeType === 'image' && (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 group bg-zinc-950">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-auto max-h-[560px] object-cover object-top transition-transform duration-700 group-hover:scale-[1.01]"
          />
          {/* Subtle glossy glass reflection gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* Caption & Quick Action Overlay */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-xs text-white">
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15">
              <span className="font-semibold text-zinc-200">{imageCaption}</span>
            </div>
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-cyan)] text-black font-bold hover:bg-[var(--accent-cyan-hover)] transition-all shadow-lg hover:scale-105 cursor-pointer"
            >
              <span>Explore Live UI</span>
              <RiExternalLinkLine size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ── 2. VIDEO MODE VIEW ─────────────────────────────────────── */}
      {activeType === 'video' && (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-zinc-950 group">
          <video
            ref={videoRef}
            src={videoSrc}
            poster={videoPoster}
            autoPlay={autoPlay ?? DEFAULT_HERO_MEDIA_CONFIG.video.autoPlay}
            loop={loop ?? DEFAULT_HERO_MEDIA_CONFIG.video.loop}
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            className="w-full h-auto max-h-[560px] object-cover cursor-pointer"
          />

          {/* Video Control Bar Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2 transition-opacity duration-300">
            {/* Scrubber Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-[var(--accent-cyan)] transition-all duration-100"
                style={{ width: `${videoProgress}%` }}
              />
            </div>

            {/* Play, Mute, Fullscreen Buttons */}
            <div className="flex items-center justify-between text-white text-xs pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <RiPauseFill size={15} /> : <RiPlayFill size={15} />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <RiVolumeMuteLine size={15} /> : <RiVolumeUpLine size={15} />}
                </button>
                <span className="text-[11px] text-zinc-300 font-mono">Parsu AI Walkthrough</span>
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Fullscreen"
              >
                <RiFullscreenLine size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. INTERACTIVE TERMINAL VIEW ───────────────────────────── */}
      {activeType === 'interactive' && (
        <div>
          {/* Model Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-zinc-200/50 dark:border-white/5">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeModel === m.id
                    ? 'bg-zinc-900 text-white dark:bg-white/10 dark:text-white shadow-xs border border-white/15'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeModel === m.id ? 'bg-[var(--accent-cyan)]' : 'bg-zinc-400'}`} />
                <span>{m.name}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                  {m.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Terminal Preview Stage */}
          <div className="p-4 sm:p-6 text-left bg-zinc-50/70 dark:bg-[var(--bg-primary)]/80 rounded-2xl border border-zinc-200/60 dark:border-white/5 font-mono text-xs">
            
            {/* User Input Prompt */}
            <div className="flex items-start gap-2.5 mb-4 text-zinc-800 dark:text-zinc-200 font-sans">
              <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300">
                <RiSearchLine size={13} />
              </div>
              <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 w-full shadow-xs">
                <span className="text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">
                  "{samplePrompts[activeModel].query}"
                </span>
              </div>
            </div>

            {/* AI Response Output */}
            <div className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300 font-sans">
              <div className="w-6 h-6 rounded-lg bg-[var(--accent-cyan)] flex items-center justify-center text-black shrink-0 mt-0.5 shadow-sm shadow-cyan-500/30">
                <ParsuLogo size={13} className="text-black" />
              </div>
              <div className="bg-white/90 dark:bg-zinc-900/60 border border-cyan-500/20 rounded-xl p-4 w-full shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-200 dark:border-white/5 pb-1.5">
                  <span className="font-bold text-[var(--accent-cyan)] flex items-center gap-1">
                    <RiFlashlightLine size={11} /> {models.find((m) => m.id === activeModel)?.name}
                  </span>
                  <span>
                    {samplePrompts[activeModel].tokens} • {samplePrompts[activeModel].latency}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                  {samplePrompts[activeModel].result}
                </p>
              </div>
            </div>

            {/* Try in Workspace Button */}
            <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="font-sans">Ready to explore full multi-turn conversations and citations?</span>
              <Link
                to="/auth"
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-black font-bold text-xs shrink-0 hover:bg-[var(--accent-cyan-hover)] transition-colors flex items-center gap-1 font-sans cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <span>Open Studio</span>
                <RiSendPlane2Fill size={11} />
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
