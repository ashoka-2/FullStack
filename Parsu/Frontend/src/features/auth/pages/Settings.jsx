import React, { useState } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import Sidebar from '../../Components/Sidebar';
import Footer from '../../Components/Footer';
import {
    RiMenuLine,
    RiUserLine,
    RiLockPasswordLine,
    RiKeyLine,
    RiGhost2Line,
    RiVoiceprintLine,
    RiArrowRightLine,
    RiSettingsLine,
    RiApps2Line,
    RiShieldCheckLine,
    RiVipCrownLine
} from '@remixicon/react';

const SETTING_CARDS = [
    {
        to: '/settings/subscription',
        icon: RiVipCrownLine,
        title: 'Plan & Quotas',
        description: 'View your active plan, monitor daily query limits, and upgrade via Razorpay.',
        color: '#10b981',
        glow: 'rgba(16,185,129,0.15)',
    },
    {
        to: '/settings/profile',
        icon: RiUserLine,
        title: 'Profile',
        description: 'Update your display name, avatar, bio and account information.',
        color: '#20b8cd',
        glow: 'rgba(32,184,205,0.12)',
    },
    {
        to: '/settings/password',
        icon: RiLockPasswordLine,
        title: 'Change Password',
        description: 'Update your password and manage account security.',
        color: '#a78bfa',
        glow: 'rgba(167,139,250,0.12)',
    },
    {
        to: '/settings/api-keys',
        icon: RiKeyLine,
        title: 'API Keys',
        description: 'Add your own Gemini, OpenAI, Groq or other provider API keys.',
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.12)',
    },
    {
        to: '/settings/mascot',
        icon: RiGhost2Line,
        title: 'Mascot Companion',
        description: 'Customize your floating blob mascot size, mood and behavior.',
        color: '#34d399',
        glow: 'rgba(52,211,153,0.12)',
    },
    {
        to: '/settings/voice',
        icon: RiVoiceprintLine,
        title: 'Voice & Speech',
        description: 'Configure AI voice responses and speech-to-text settings.',
        color: '#f87171',
        glow: 'rgba(248,113,113,0.12)',
    },
    {
        to: '/social-connections',
        icon: RiApps2Line,
        title: 'Social Connections',
        description: 'Connect Instagram, YouTube, Twitter and other social accounts.',
        color: '#60A6AF',
        glow: 'rgba(96,166,175,0.12)',
    },
];

const Settings = () => {
    const { user } = useSelector(state => state.auth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main column — NO overflow here */}
            <div className="flex-1 flex flex-col min-h-0 lg:pl-56">

                {/* Header — shrink-0: naturally pinned */}
                <header className="shrink-0 z-30 border-b border-zinc-200 dark:border-white/5 bg-[var(--bg-primary)]/90 dark:bg-[var(--bg-primary)]/85 backdrop-blur-md px-3.5 sm:px-8 h-12 sm:h-14 flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer rounded-lg active:scale-95"
                        aria-label="Open navigation"
                    >
                        <RiMenuLine size={20} />
                    </button>
                    <RiSettingsLine size={17} className="text-[var(--accent-cyan)] shrink-0" />
                    <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Settings</h1>
                </header>

                {/* Scrollable content — data-lenis-prevent stops Lenis from intercepting */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <div className="max-w-3xl w-full mx-auto px-3.5 sm:px-8 py-6 sm:py-10 pb-32">

                        {/* User identity card */}
                        {user && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/8 shadow-sm">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--color-clear-hanada)] flex items-center justify-center text-white font-black text-base sm:text-lg shrink-0 shadow-lg shadow-[var(--accent-cyan)]/20">
                                        {(user.name || user.username || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">{user.name || user.username}</p>
                                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/5 w-full sm:w-auto justify-between sm:justify-end">
                                    <Link
                                        to="/settings/subscription"
                                        className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-all flex items-center gap-1"
                                    >
                                        <RiVipCrownLine size={12} />
                                        <span>{(user.subscription?.plan || 'free').toUpperCase()}</span>
                                    </Link>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 px-2.5 py-1 rounded-full">
                                        <RiShieldCheckLine size={12} />
                                        <span>Active</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings cards grid */}
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-4 px-0.5">Account Settings</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {SETTING_CARDS.map(({ to, icon: Icon, title, description, color, glow }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/8 shadow-sm hover:shadow-md hover:border-zinc-300/80 dark:hover:border-white/15 transition-all duration-200 active:scale-[0.98]"
                                    style={{ '--glow': glow }}
                                >
                                    {/* Icon badge */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                        style={{ background: glow, color }}
                                    >
                                        <Icon size={20} />
                                    </div>

                                    {/* Text */}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-zinc-900 dark:text-white mb-0.5 group-hover:text-[var(--accent-cyan)] transition-colors">{title}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
                                    </div>

                                    {/* Arrow */}
                                    <RiArrowRightLine
                                        size={16}
                                        className="text-zinc-300 dark:text-zinc-700 group-hover:text-[var(--accent-cyan)] group-hover:translate-x-0.5 transition-all mt-1 shrink-0"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>

            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                />
            )}
        </div>
    );
};

export default Settings;
