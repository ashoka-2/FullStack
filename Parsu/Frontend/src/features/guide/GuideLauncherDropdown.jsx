import React, { useState, useRef, useEffect } from "react";
import {
  RiSparkling2Line,
  RiKey2Line,
  RiInstagramLine,
  RiBrainLine,
  RiCpuLine,
  RiGhost2Line,
  RiVoiceprintLine,
  RiMapPinRangeLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useGuideEngine } from "./useGuideEngine";
import { PillBadge } from "../Components/PillButton";

const AVAILABLE_TOURS = [
  {
    id: "add_gemini_key",
    title: "Add API Key (BYOK)",
    subtitle: "Google Gemini, OpenAI, Claude",
    icon: RiKey2Line,
    color: "text-amber-400",
  },
  {
    id: "connect_instagram",
    title: "Connect Social Media",
    subtitle: "Instagram & Facebook automation",
    icon: RiInstagramLine,
    color: "text-pink-400",
  },
  {
    id: "view_memory",
    title: "AI Memory & Persona",
    subtitle: "Custom instructions & learned facts",
    icon: RiBrainLine,
    color: "text-purple-400",
  },
  {
    id: "change_model",
    title: "Switch AI Models",
    subtitle: "Thinking depth & model picker",
    icon: RiCpuLine,
    color: "text-cyan-400",
  },
  {
    id: "mascot_settings",
    title: "Customize Mascot",
    subtitle: "Colors, eye tracking & flame",
    icon: RiGhost2Line,
    color: "text-emerald-400",
  },
  {
    id: "voice_settings",
    title: "Voice & Speech (TTS)",
    subtitle: "Real-time speech & voices",
    icon: RiVoiceprintLine,
    color: "text-blue-400",
  },
  {
    id: "plan_trip",
    title: "Plan Live Road Trip",
    subtitle: "Interactive turn-by-turn map",
    icon: RiMapPinRangeLine,
    color: "text-rose-400",
  },
];

export default function GuideLauncherDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { launchGuide } = useGuideEngine();
  const dropdownRef = useRef(null);
  const user = useSelector((s) => s.auth?.user);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("pointerdown", handleOutside);
    }
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleSelectTour = (tourId) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsOpen(false);
    launchGuide(tourId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <PillBadge
        onClick={handleToggle}
        className="cursor-pointer font-semibold py-1.5 px-2.5 sm:px-3 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-all active:scale-95"
        title="Interactive AI Feature Walkthroughs"
      >
        <RiSparkling2Line size={14} className="shrink-0 text-[var(--accent-cyan)] animate-pulse" />
        <span className="hidden sm:inline font-bold">AI Tours</span>
      </PillBadge>

      {isOpen && user && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-zinc-950/95 dark:bg-[#141416]/98 border border-white/10 shadow-2xl backdrop-blur-2xl p-2 z-[9999] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <RiSparkling2Line size={13} className="text-[var(--accent-cyan)]" />
                <span>Interactive AI Guides</span>
              </p>
              <p className="text-[10px] text-zinc-400">
                Smooth live interactive feature tours
              </p>
            </div>
            <span className="text-[9px] font-mono uppercase bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] px-1.5 py-0.5 rounded font-bold">
              Live
            </span>
          </div>

          <div className="py-1 max-h-[340px] overflow-y-auto custom-scrollbar space-y-0.5">
            {AVAILABLE_TOURS.map((tour) => {
              const Icon = tour.icon;
              return (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => handleSelectTour(tour.id)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${tour.color} group-hover:scale-105 transition-transform`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-[var(--accent-cyan)] transition-colors truncate">
                        {tour.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {tour.subtitle}
                      </p>
                    </div>
                  </div>
                  <RiArrowRightSLine
                    size={16}
                    className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
