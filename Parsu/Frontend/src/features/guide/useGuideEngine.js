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
  const user = useSelector((s) => s.auth?.user);
  const messages = useSelector((s) => s.chat.messages);
  const guideActive = useSelector((s) => s.guide.active);
  const lastProcessedIdRef = useRef(null);

  // ─── Trigger a guide smoothly ──────────────────────────────
  const launchGuide = useCallback(
    (guideId) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const guide = GUIDES[guideId];
      if (!guide) {
        console.warn(`[GuideEngine] Unknown guide ID: "${guideId}"`);
        return;
      }

      const isChatRoute = (pathname) => pathname === "/ai" || pathname?.startsWith("/chat/");
      // If target guide route is /ai, and current location is already in a chat route (/ai or /chat/:id), no navigation needed
      const needsNavigation = guide.route && (
        guide.route === "/ai"
          ? !isChatRoute(location.pathname)
          : location.pathname !== guide.route
      );

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
            const vt = document.startViewTransition(() => {
              doNavigate();
            });
            if (vt && vt.finished) {
              vt.finished.catch((err) => {
                // AbortError is normal when another transition supersedes the current one
                if (err?.name !== "AbortError") {
                  console.warn("[GuideEngine] ViewTransition warning:", err);
                }
              });
            }
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
    [dispatch, navigate, location.pathname, user]
  );

  // ─── Track Path & Hydrate Historical Messages ───────────────
  const currentPathRef = useRef(location.pathname);

  // When switching chats or routes, mark current latest message as already processed
  useEffect(() => {
    if (location.pathname !== currentPathRef.current) {
      currentPathRef.current = location.pathname;
      if (messages && messages.length > 0) {
        const lastAi = [...messages].reverse().find((m) => m.role === "ai");
        if (lastAi) {
          lastProcessedIdRef.current = lastAi._id;
        }
      }
    }
  }, [location.pathname, messages]);

  // On initial mount or first message hydration, treat existing history as already processed
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    if (lastProcessedIdRef.current === null) {
      const lastAi = [...messages].reverse().find((m) => m.role === "ai");
      if (lastAi) {
        lastProcessedIdRef.current = lastAi._id;
      }
    }
  }, [messages]);

  // ─── Watch for AI Message Triggers (Live Messages Only) ─────
  useEffect(() => {
    if (!user) return;
    if (guideActive) return;
    if (!messages || messages.length === 0) return;

    // Do NOT auto-navigate user away from an active chat route
    if (location.pathname.startsWith("/chat/")) return;

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
  }, [messages, guideActive, launchGuide, user, location.pathname]);

  return { launchGuide };
}

export default useGuideEngine;
