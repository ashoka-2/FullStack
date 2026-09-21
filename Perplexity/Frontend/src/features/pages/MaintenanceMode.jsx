import React, { useState, useEffect } from "react";
import {
  RiToolsLine,
  RiSparklingLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiTimeLine,
  RiServerLine,
  RiDatabase2Line,
  RiCpuLine,
  RiSunLine,
  RiMoonLine,
  RiTwitterXLine,
  RiGithubLine,
  RiHeart2Line
} from "@remixicon/react";
import PerplexityIcon from "../Components/PerplexityIcon";
import { JellyBlobMascot } from "../Components/JellyBlobMascot";

const QUOTES = [
  "Tightening screws on the AI server! 🔧✨",
  "Adding more GPU horsepower! ⚡🚀",
  "Don't worry, your chats are 100% safe! 🛡️",
  "Polishing our neural networks! 🧠💡",
  "We'll be right back, promise! 💖",
  "Quick maintenance nap in progress... 💤"
];

export default function MaintenanceMode() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  const [blobMood, setBlobMood] = useState("curious");
  const [speechText, setSpeechText] = useState("Scheduled maintenance in progress! 🛠️");
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState("Just now");

  // Sync theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const handleBlobClick = () => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setSpeechText(randomQuote);
    setBlobMood(prev => (prev === "happy" ? "surprised" : "happy"));
    setCelebrateCount(c => c + 1);
  };

  const handleRefreshCheck = () => {
    setIsChecking(true);
    setSpeechText("Checking server availability... ⏳");
    setBlobMood("hmm");

    setTimeout(() => {
      // Reload page to re-evaluate environment variables and connection
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] dark:bg-[#070809] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-[#20b8cd]/30 selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-gradient-to-b from-[#20b8cd]/10 via-[#20b8cd]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
            <PerplexityIcon size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">Perplexity AI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Maintenance Mode</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121314] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 text-center max-w-3xl mx-auto">
        
        {/* Interactive JellyBlob Mascot */}
        <div 
          onClick={handleBlobClick}
          className="relative mb-6 cursor-pointer transform hover:scale-105 transition-transform select-none group"
          title="Click to interact with the maintenance mascot!"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-blue-500/20 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <JellyBlobMascot
              size={130}
              mood={blobMood}
              celebrate={celebrateCount}
              speechText={speechText}
            />
          </div>
          <p className="mt-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Click mascot for update 💬
          </p>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/80 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-4 shadow-sm">
          <RiToolsLine size={15} className="text-[#20b8cd]" />
          <span>Under Scheduled Maintenance</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-zinc-900 dark:text-white leading-tight">
          We’re Fine-Tuning <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#20b8cd] via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Our AI Engines
          </span>
        </h1>

        {/* Description */}
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
          Perplexity is currently undergoing brief technical maintenance to upgrade AI model clusters and optimize response speeds. All user data, chats, and keys are safely secured.
        </p>

        {/* Progress Bar Shimmer */}
        <div className="w-full max-w-md bg-zinc-200 dark:bg-zinc-800/80 rounded-full h-2.5 mb-8 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-[#20b8cd] via-teal-400 to-[#20b8cd] rounded-full animate-pulse w-3/4" />
        </div>

        {/* System Safeguard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-8 text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121314] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <RiDatabase2Line size={16} />
              <span>Database Safe</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Your accounts, messages, and threads are securely preserved.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121314] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1">
              <RiCpuLine size={16} />
              <span>AI Upgrades</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Updating Gemini 3.6 & Mistral NeMo models for top performance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121314] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
              <RiShieldCheckLine size={16} />
              <span>Offline Shield</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Server network calls paused to prevent data conflicts.
            </p>
          </div>
        </div>

        {/* Refresh Check Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRefreshCheck}
            disabled={isChecking}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RiRefreshLine size={17} className={isChecking ? "animate-spin" : ""} />
            <span>{isChecking ? "Checking Status..." : "Check If We’re Back"}</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3">
          Status checked: <span className="font-semibold">{lastChecked}</span>
        </p>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span>Perplexity AI Platform</span>
          <span>•</span>
          <span>All rights reserved</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <RiTwitterXLine size={14} />
            <span>Updates</span>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <RiGithubLine size={14} />
            <span>GitHub</span>
          </a>
        </div>
      </footer>

    </div>
  );
}
