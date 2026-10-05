// ============================================================
// useGuideEngine — Advanced orchestrator for AI Guided Walkthroughs
//
// Features:
//   1. Seamless route transitions: No jarring jump, lag, or white flashes.
//   2. View Transitions API integration when available in browser.
//   3. Ambient guidance veil: Mascot accompanies the user across pages.
//   4. Programmatic + AI message trigger support.
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import GUIDES from "./guides.registry";
import { startGuide, setIsTransitioning } from "./guide.slice";
import { playTransitionWarpSound } from "./guideSounds";

// Regex to extract guide ID from ```guide\n<ID>\n```
const GUIDE_BLOCK_REGEX = /```guide\s*\n\s*(\S+)\s*\n\s*```/;

export function useGuideEngine() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const messages = useSelector((s) => s.chat.messages);
  const guideActive = useSelector((s) => s.guide.active);
  const lastProcessedIdRef = useRef(null);

  // ─── Trigger a guide smoothly ──────────────────────────────
  const launchGuide = useCallback(
    (guideId) => {
      const guide = GUIDES[guideId];
      if (!guide) {
        console.warn(`[GuideEngine] Unknown guide ID: "${guideId}"`);
        return;
      }

      const needsNavigation = guide.route && location.pathname !== guide.route;

      if (needsNavigation) {
        // Activate smooth transition veil
        dispatch(
          setIsTransitioning({
            transitioning: true,
            title: guide.pageTitle || guide.title,
          })
        );
        playTransitionWarpSound();

        // Dispatch mascot anticipation
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("blob_trigger_mood", {
              detail: {
                mood: "wave",
                speech: `Taking you to ${guide.pageTitle || guide.title}... Follow me! 🚀`,
                duration: 2500,
                revert: false,
              },
            })
          );
        }

        // Perform seamless route transition
        const doNavigate = () => {
          navigate(guide.route);
        };

        if (typeof document !== "undefined" && document.startViewTransition) {
          try {
            document.startViewTransition(() => {
              doNavigate();
            });
          } catch (e) {
            doNavigate();
          }
        } else {
          doNavigate();
        }

        // Once the new page has begun rendering, smoothly transition from veil to guide spotlight
        setTimeout(() => {
          dispatch(
            startGuide({
              guideId: guide.id,
              guideTitle: guide.title,
              steps: guide.steps,
              route: guide.route,
            })
          );
        }, 450);
      } else {
        // Already on the target page: start guide immediately with zero delay
        dispatch(
          startGuide({
            guideId: guide.id,
            guideTitle: guide.title,
            steps: guide.steps,
            route: guide.route,
          })
        );
      }
    },
    [dispatch, navigate, location.pathname]
  );

  // ─── Watch for AI Message Triggers ─────────────────────────
  useEffect(() => {
    if (guideActive) return;
    if (!messages || messages.length === 0) return;

    // Find the latest AI message
    const lastAi = [...messages].reverse().find((m) => m.role === "ai");
    if (!lastAi || !lastAi.content) return;
    if (lastAi._id === lastProcessedIdRef.current) return;

    // Check for ```guide ... ``` code block
    const match = lastAi.content.match(GUIDE_BLOCK_REGEX);
    if (!match) return;

    const guideId = match[1].trim();
    lastProcessedIdRef.current = lastAi._id;

    // Give the user a brief second to read the AI's opening sentence before smoothly gliding
    const timer = setTimeout(() => {
      launchGuide(guideId);
    }, 600);

    return () => clearTimeout(timer);
  }, [messages, guideActive, launchGuide]);

  return { launchGuide };
}

export default useGuideEngine;
