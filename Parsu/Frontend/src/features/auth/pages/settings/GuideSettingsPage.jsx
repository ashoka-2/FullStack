import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  RiSparkling2Line,
  RiKey2Line,
  RiInstagramLine,
  RiBrainLine,
  RiCpuLine,
  RiGhost2Line,
  RiVoiceprintLine,
  RiCompass3Line,
  RiPlayCircleLine,
  RiRefreshLine,
  RiCheckLine,
  RiKeyboardLine,
  RiBookOpenLine,
  RiTerminalBoxLine,
  RiLightbulbLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import { useGuideEngine } from '../../../guide/useGuideEngine';

const TOURS = [
  {
    id: 'add_gemini_key',
    title: 'Add API Keys (BYOK)',
    category: 'Models & Keys',
    description: 'Learn how to bring your own API keys for Google Gemini, OpenAI, Claude, and Groq with zero rate limits.',
    icon: RiKey2Line,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    route: '/settings/api-keys'
  },
  {
    id: 'connect_instagram',
    title: 'Social Media & Channels',
    category: 'Automation',
    description: 'Tour automated cross-posting, video publishing, and direct multi-platform content scheduling.',
    icon: RiInstagramLine,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    route: '/social-connections'
  },
  {
    id: 'view_memory',
    title: 'AI Memory & Persona',
    category: 'Personalization',
    description: 'Discover how Parsu remembers your style, personal preferences, and custom instructions across conversations.',
    icon: RiBrainLine,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    route: '/settings/memory'
  },
  {
    id: 'change_model',
    title: 'Switch AI Models',
    category: 'Reasoning',
    description: 'Explore instant switching between ultra-fast Flash models and deep reasoning thinking models.',
    icon: RiCpuLine,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    route: '/ai'
  },
  {
    id: 'mascot_settings',
    title: 'Customize JellyBlob Mascot',
    category: 'Companion',
    description: 'Customize floating physics, emotional reactivity, color palettes, and interactive companion behaviors.',
    icon: RiGhost2Line,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    route: '/settings/mascot'
  },
  {
    id: 'voice_settings',
    title: 'Voice & Speech Mode',
    category: 'Audio',
    description: 'Learn how to enable real-time spoken audio responses, custom voices, and conversational speech output.',
    icon: RiVoiceprintLine,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    route: '/settings/voice'
  },
  {
    id: 'social_connections',
    title: 'Skills & MCP Servers',
    category: 'Extensibility',
    description: 'Load custom workflows from your local machine (ZIP, Markdown) and connect Blender, Figma, or databases via MCP.',
    icon: RiTerminalBoxLine,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    route: '/social-connections'
  }
];

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + /' , label: 'Open Global Search' },
  { key: 'Ctrl + K' , label: 'New Chat Thread' },
  { key: 'Ctrl + B' , label: 'Toggle Sidebar' },
  { key: 'Shift + Enter', label: 'New Line in Prompt' },
  { key: 'Esc', label: 'Close Active Drawers & Modals' }
];

export default function GuideSettingsPage() {
  const { startGuideTour, resetAllTours } = useGuideEngine();
  const navigate = useNavigate();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLaunch = (tour) => {
    if (tour.route && window.location.pathname !== tour.route) {
      navigate(tour.route);
      setTimeout(() => {
        startGuideTour(tour.id);
      }, 350);
    } else {
      startGuideTour(tour.id);
    }
  };

  const handleReset = () => {
    resetAllTours?.();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <SettingsPageLayout
      title="AI Guide & Interactive Tours"
      icon={RiCompass3Line}
      description="Interactive walkthroughs, feature demonstrations, and workflow tutorials."
    >
      <div className="space-y-8">
        {/* Hero Card */}
        <div className="rounded-[24px] sm:rounded-[28px] border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 mb-3">
                <RiSparkling2Line size={13} /> Interactive Onboarding
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Learn Parsu AI Step-by-Step
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Launch interactive highlight tours directly on the interface. The guide points to real controls, explains workflows, and helps you configure advanced settings effortlessly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
              >
                {resetSuccess ? <RiCheckLine size={15} className="text-emerald-500" /> : <RiRefreshLine size={15} />}
                {resetSuccess ? 'Tours Reset' : 'Reset All Tours'}
              </button>
            </div>
          </div>
        </div>

        {/* Tours Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Available Feature Tours ({TOURS.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Click to start any walkthrough</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {TOURS.map((tour) => {
              const Icon = tour.icon;
              return (
                <article
                  key={tour.id}
                  className="rounded-[20px] sm:rounded-[24px] border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 p-4 sm:p-5 shadow-sm transition hover:border-cyan-500/30 dark:hover:border-cyan-400/20 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${tour.color}`}>
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          {tour.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">
                        {tour.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {tour.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      ~1 min tour
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLaunch(tour)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan)] text-zinc-950 text-xs font-semibold hover:brightness-105 transition cursor-pointer shadow-xs"
                    >
                      <RiPlayCircleLine size={14} /> Start Tour
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Shortcuts & Best Practices Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Keyboard Shortcuts */}
          <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <RiKeyboardLine size={15} />
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Power User Shortcuts
              </h3>
            </div>
            <div className="space-y-2 mt-3">
              {KEYBOARD_SHORTCUTS.map((sc, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-xs border-b border-zinc-100 dark:border-white/[0.04] last:border-0">
                  <span className="text-zinc-600 dark:text-zinc-400">{sc.label}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 font-mono text-[11px] border border-zinc-200 dark:border-white/10">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <RiLightbulbLine size={15} />
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Pro Workflow Tips
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed list-disc list-inside">
              <li>Use <strong>@mentioning</strong> in chat to activate custom skills directly from your local machine.</li>
              <li>Daily prompt suggestions are cached globally once every 24 hours to maximize performance.</li>
              <li>Install Parsu as a PWA on mobile or desktop to receive background &quot;response ready&quot; push notifications.</li>
              <li>Connected Devices lets you broadcast clipboard text and execute remote scripts across your machines safely.</li>
            </ul>
          </div>
        </div>
      </div>
    </SettingsPageLayout>
  );
}
