import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import {
  nextStep,
  prevStep,
  skipGuide,
  setStep,
  toggleAutoPlay,
  toggleSound,
} from "./guide.slice";
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiCheckLine,
  RiSparkling2Line,
  RiVolumeUpLine,
  RiVolumeMuteLine,
  RiPlayFill,
  RiPauseFill,
  RiExternalLinkLine,
  RiCursorLine,
  RiLoader4Line,
} from "@remixicon/react";
import {
  playSpotlightLockSound,
  playStepNextSound,
  playAutoPilotSound,
  playGuideCompleteSound,
  setGuideSoundMuted,
} from "./guideSounds";

// ─── Utility: Find DOM element by data-guide or id ────────────
function findTarget(targetId) {
  if (!targetId) return null;
  return (
    document.querySelector(`[data-guide="${targetId}"]`) ||
    document.getElementById(targetId)
  );
}

// ─── Compute tooltip position around spotlight rect ───────────
function computeTooltipStyle(rect, position = "bottom", viewportW, viewportH) {
  const GAP = 16;
  const TOOLTIP_W = Math.min(360, viewportW - 24);
  const TOOLTIP_H = 210;

  if (!rect) {
    return {
      top: Math.max(20, viewportH / 2 - TOOLTIP_H / 2),
      left: Math.max(12, viewportW / 2 - TOOLTIP_W / 2),
      width: TOOLTIP_W,
    };
  }

  let top, left;

  switch (position) {
    case "top":
      top = rect.top - TOOLTIP_H - GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left - TOOLTIP_W - GAP;
      break;
    case "right":
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.right + GAP;
      break;
    case "bottom":
    default:
      top = rect.bottom + GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
  }

  // Prevent overflowing viewport
  if (left < 14) left = 14;
  if (left + TOOLTIP_W > viewportW - 14) left = viewportW - TOOLTIP_W - 14;
  if (top < 14) top = 14;
  if (top + TOOLTIP_H > viewportH - 14) top = Math.max(14, viewportH - TOOLTIP_H - 14);

  return { top, left, width: TOOLTIP_W };
}

export const GuideOverlay = () => {
  const dispatch = useDispatch();
  const {
    active,
    guideTitle,
    stepIndex,
    steps,
    isTransitioning,
    transitionTargetTitle,
    autoPlay,
    soundEnabled,
  } = useSelector((s) => s.guide);

  const [rect, setRect] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const rafRef = useRef(null);
  const observerRef = useRef(null);

  const currentStep = steps[stepIndex] || null;

  // Sync sound settings with Web Audio
  useEffect(() => {
    setGuideSoundMuted(!soundEnabled);
  }, [soundEnabled]);

  // ─── Target Rect Tracker with Smooth Settle ─────────────────
  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const el = findTarget(currentStep.target);
    if (!el) {
      setRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    const pad = 8;
    const newRect = {
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    };
    setRect(newRect);

    const style = computeTooltipStyle(
      newRect,
      currentStep.position,
      window.innerWidth,
      window.innerHeight
    );
    setTooltipStyle(style);
  }, [currentStep]);

  // ─── Locate Target & Observe DOM ───────────────────────────
  useEffect(() => {
    if (!active || !currentStep) return;
    setActionDone(false);

    let isMounted = true;
    setIsSearching(true);

    const locate = () => {
      const el = findTarget(currentStep.target);
      if (el) {
        setIsSearching(false);
        try {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        } catch (e) {}

        updateTargetRect();
        playSpotlightLockSound();

        // Broadcast to mascot companion
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("blob_trigger_mood", {
              detail: {
                mood: currentStep.mood || "curious",
                speech: currentStep.speech || "",
                duration: 4000,
                revert: false,
              },
            })
          );
        }
        return true;
      }
      return false;
    };

    // If target is inside a sheet or modal (like model-selector-btn), ensure sheet opens
    if (currentStep.target === "model-selector-btn" && !findTarget(currentStep.target)) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open_add_to_chat_sheet"));
      }
    }

    // Try immediately
    if (locate()) return;

    // Observe DOM mutations for dynamically mounted elements (modals, accordions, lazy routes)
    const observer = new MutationObserver(() => {
      if (locate()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;

    // Polling fallback
    const interval = setInterval(() => {
      if (!isMounted) return;
      if (locate()) {
        clearInterval(interval);
      }
    }, 250);

    const timeout = setTimeout(() => {
      if (isMounted) setIsSearching(false);
    }, 3000);

    return () => {
      isMounted = false;
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, stepIndex, currentStep, updateTargetRect]);

  // Continuous animation frame loop to adapt to scroll/resizing
  useEffect(() => {
    if (!active || !currentStep) return;
    let running = true;

    const loop = () => {
      if (!running) return;
      updateTargetRect();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, currentStep, updateTargetRect]);

  // ─── Auto-Play Timer ───────────────────────────────────────
  useEffect(() => {
    if (!active || !autoPlay) return;

    const timer = setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        playStepNextSound();
        dispatch(nextStep());
      } else {
        playGuideCompleteSound();
        dispatch(nextStep());
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [active, autoPlay, stepIndex, steps.length, dispatch]);

  // ─── Keyboard Shortcuts ────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (e.key === "Escape") dispatch(skipGuide());
      if (e.key === "ArrowRight" || e.key === "Enter") {
        playStepNextSound();
        dispatch(nextStep());
      }
      if (e.key === "ArrowLeft") dispatch(prevStep());
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, dispatch]);

  // ─── Auto-Pilot Action Execution ───────────────────────────
  const handleAutoPilot = () => {
    if (!currentStep?.action) return;
    const action = currentStep.action;
    playAutoPilotSound();

    if (action.type === "open_url" && action.url) {
      window.open(action.url, "_blank", "noopener,noreferrer");
      setActionDone(true);
      return;
    }

    const el = findTarget(currentStep.target);
    if (!el) return;

    if (action.type === "click") {
      el.click();
      setActionDone(true);
      // Mascot cheer
      window.dispatchEvent(
        new CustomEvent("blob_trigger_mood", {
          detail: { mood: "happy", speech: "Done! Look at that! ✨", duration: 2500 },
        })
      );
    } else if (action.type === "focus") {
      el.focus();
      setActionDone(true);
      window.dispatchEvent(
        new CustomEvent("blob_trigger_mood", {
          detail: { mood: "wave", speech: "Focused and ready for you! ✍️", duration: 2500 },
        })
      );
    }
  };

  const isLastStep = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex === 0;

  // ─── Render Portal ─────────────────────────────────────────
  if (!active && !isTransitioning) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-none select-none font-sans">
      {/* ── Seamless Route Transition Veil ── */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 max-w-sm"
            >
              <div className="relative w-16 h-16 rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)] shadow-[0_0_40px_rgba(32,184,205,0.35)]">
                <RiSparkling2Line size={32} className="animate-spin" style={{ animationDuration: "3s" }} />
              </div>

              <div>
                <span className="text-[11px] font-mono tracking-widest text-[var(--accent-cyan)] uppercase font-bold">
                  AI Guided Navigation
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Gliding to {transitionTargetTitle || "Next Page"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Preparing your interactive walkthrough...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Guide Walkthrough ── */}
      {active && !isTransitioning && currentStep && (
        <>
          {/* Spotlight Mask (SVG with smooth cutout hole) */}
          <svg className="fixed inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="guide-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <rect
                    x={rect.left}
                    y={rect.top}
                    width={rect.width}
                    height={rect.height}
                    rx="14"
                    ry="14"
                    fill="black"
                    className="transition-all duration-300 ease-out"
                  />
                )}
              </mask>
            </defs>

            {/* Darkened backdrop with cutout hole */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.68)"
              mask="url(#guide-spotlight-mask)"
              onClick={() => dispatch(skipGuide())}
              className="cursor-pointer"
            />
          </svg>

          {/* Glowing Animated Ring Around Spotlight Target */}
          {rect && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed pointer-events-none rounded-2xl"
              style={{
                top: rect.top - 3,
                left: rect.left - 3,
                width: rect.width + 6,
                height: rect.height + 6,
                boxShadow:
                  "0 0 0 2px rgba(32,184,205,0.7), 0 0 28px 6px rgba(32,184,205,0.3), inset 0 0 12px rgba(32,184,205,0.15)",
                borderRadius: "16px",
              }}
            >
              {/* Corner accent sparkles */}
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_8px_#20b8cd] animate-ping" />
            </motion.div>
          )}

          {/* Interactive Tooltip Card */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed pointer-events-auto z-[100001]"
            style={{
              top: tooltipStyle.top || 40,
              left: tooltipStyle.left || 20,
              width: tooltipStyle.width || 340,
            }}
          >
            <div className="bg-zinc-950/95 dark:bg-[#121214]/98 border border-white/15 dark:border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-white">
              {/* Header: Title, Step badge, Sound & Auto-Play toggles */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/20 border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] text-[10px] font-mono font-bold uppercase tracking-wider">
                    {guideTitle || "Guide"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    {stepIndex + 1} of {steps.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Auto-Play Toggle */}
                  <button
                    type="button"
                    onClick={() => dispatch(toggleAutoPlay())}
                    title={autoPlay ? "Pause Auto-Walkthrough" : "Play Auto-Walkthrough"}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      autoPlay
                        ? "bg-[var(--accent-cyan)] text-zinc-950"
                        : "hover:bg-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {autoPlay ? <RiPauseFill size={14} /> : <RiPlayFill size={14} />}
                  </button>

                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={() => dispatch(toggleSound())}
                    title={soundEnabled ? "Mute Guide Sounds" : "Enable Guide Sounds"}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {soundEnabled ? <RiVolumeUpLine size={14} /> : <RiVolumeMuteLine size={14} />}
                  </button>

                  {/* Close Guide Button */}
                  <button
                    type="button"
                    onClick={() => dispatch(skipGuide())}
                    title="Exit Walkthrough"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                  >
                    <RiCloseLine size={16} />
                  </button>
                </div>
              </div>

              {/* Step Title & Mascot Speech Bubble */}
              <div className="mb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentStep.title}</span>
                </h4>
                <p className="text-xs text-zinc-300 dark:text-zinc-400 leading-relaxed mt-1">
                  {currentStep.body}
                </p>
              </div>

              {/* Optional Auto-Pilot Action Trigger */}
              {currentStep.action && (
                <div className="my-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAutoPilot}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      actionDone
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-[var(--accent-cyan)]/15 hover:bg-[var(--accent-cyan)]/25 border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] hover:scale-[1.01] active:scale-[0.98]"
                    }`}
                  >
                    {actionDone ? (
                      <>
                        <RiCheckLine size={15} />
                        <span>Action Performed!</span>
                      </>
                    ) : (
                      <>
                        {currentStep.action.type === "open_url" ? (
                          <RiExternalLinkLine size={15} />
                        ) : (
                          <RiCursorLine size={15} />
                        )}
                        <span>{currentStep.action.label || "Do It For Me (Auto-Pilot)"}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step Navigation Dots Timeline */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  {steps.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playStepNextSound();
                        dispatch(setStep(idx));
                      }}
                      title={`Jump to: ${s.title}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === stepIndex
                          ? "w-6 bg-[var(--accent-cyan)] shadow-[0_0_8px_#20b8cd]"
                          : idx < stepIndex
                          ? "w-2 bg-emerald-400/80"
                          : "w-2 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                {/* Back & Next Controls */}
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      type="button"
                      onClick={() => dispatch(prevStep())}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RiArrowLeftLine size={13} />
                      <span>Back</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (isLastStep) {
                        playGuideCompleteSound();
                        dispatch(nextStep());
                      } else {
                        playStepNextSound();
                        dispatch(nextStep());
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--accent-cyan)] hover:brightness-110 text-zinc-950 text-xs font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    {isLastStep ? (
                      <>
                        <RiCheckLine size={14} />
                        <span>Finish</span>
                      </>
                    ) : (
                      <>
                        <span>Next</span>
                        <RiArrowRightLine size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Searching element indicator if taking longer than 400ms */}
          {isSearching && !rect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100002] bg-zinc-900/90 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2.5 text-xs text-zinc-300 shadow-xl backdrop-blur-md"
            >
              <RiLoader4Line size={14} className="animate-spin text-[var(--accent-cyan)]" />
              <span>Locating {currentStep.title}...</span>
            </motion.div>
          )}
        </>
      )}
    </div>,
    document.body
  );
};

export default GuideOverlay;
