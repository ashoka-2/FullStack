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
    RiVipCrownLine,
    RiBrainLine,
    RiSettings3Line,
    RiNotificationLine,
    RiShieldLine,
    RiHardDriveLine,
    RiBugLine,
    RiSideBarLine,
    RiLogoutBoxRLine,
} from '@remixicon/react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { useAuth } from '../hook/useAuth';
import ConfirmationModal from '../../Components/ConfirmationModal';
import { toggleSidebarCollapse } from '../../chat/chat.slice';

const SETTING_GROUPS = [
    {
        label: 'Account',
        cards: [
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
        ],
    },
    {
        label: 'Preferences',
        cards: [
            {
                to: '/settings/memory',
                icon: RiBrainLine,
                title: 'Memory',
                description: 'Control what Parsu AI learns about you — nickname, occupation, and custom instructions.',
                color: '#6366f1',
                glow: 'rgba(99,102,241,0.12)',
            },
            {
                to: '/settings/general',
                icon: RiSettings3Line,
                title: 'General',
                description: 'App theme, language, haptic feedback and web search (Tavily) settings.',
                color: '#20b8cd',
                glow: 'rgba(32,184,205,0.10)',
            },
            {
                to: '/settings/notifications',
                icon: RiNotificationLine,
                title: 'Notifications',
                description: 'Manage when and how Parsu notifies you about AI responses and updates.',
                color: '#f87171',
                glow: 'rgba(248,113,113,0.12)',
            },
            {
                to: '/settings/safety',
                icon: RiShieldLine,
                title: 'Safety',
                description: 'Configure content filters to block harmful or sensitive AI-generated content.',
                color: '#10b981',
                glow: 'rgba(16,185,129,0.12)',
            },
        ],
    },
    {
        label: 'AI & Media',
        cards: [
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
                to: '/settings/storage',
                icon: RiHardDriveLine,
                title: 'Storage',
                description: 'View and delete images and videos you have uploaded in your chats.',
                color: '#60a5fa',
                glow: 'rgba(96,165,250,0.12)',
            },
            {
                to: '/social-connections',
                icon: RiApps2Line,
                title: 'Social Connections',
                description: 'Connect Instagram, YouTube, Twitter and other social accounts.',
                color: '#60A6AF',
                glow: 'rgba(96,166,175,0.12)',
            },
        ],
    },
    {
        label: 'Support',
        cards: [
            {
                to: '/settings/report-bug',
                icon: RiBugLine,
                title: 'Report a Bug',
                description: 'Found something broken? Tell us — your report goes directly to our team.',
                color: '#fb923c',
                glow: 'rgba(251,146,60,0.12)',
            },
        ],
    },
];

const Settings = () => {
    const { user } = useSelector(state => state.auth);
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { handleLogout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main column — dynamic padding based on sidebar collapse */}
            <div className={`flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>

                {/* ChatGPT-style Header — shrink-0: naturally pinned */}
                <header className="shrink-0 z-30 border-b border-white/[0.08] bg-[#0B0B0B]/90 backdrop-blur-md px-3.5 sm:px-8 h-12 sm:h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile sidebar toggle button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white transition-all cursor-pointer rounded-lg active:scale-95"
                            aria-label="Open navigation"
                        >
                            <RiMenuLine size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <RiSettingsLine size={17} className="text-[var(--accent-cyan)] shrink-0" />
                            <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Settings</h1>
                        </div>
                    </div>
                </header>

                {/* Scrollable content — data-lenis-prevent stops Lenis from intercepting */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <div className="max-w-3xl w-full mx-auto px-3.5 sm:px-8 py-6 sm:py-10 pb-32">

                        {/* User identity card */}
                        {user && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 p-4 rounded-2xl bg-[#111111] border border-white/[0.08] shadow-sm">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A1A1A] border border-white/[0.08] flex items-center justify-center text-[var(--accent-cyan)] font-black text-base sm:text-lg shrink-0 shadow-sm">
                                        {(user.name || user.username || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm sm:text-base text-white truncate">{user.name || user.username}</p>
                                        <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] w-full sm:w-auto justify-between sm:justify-end">
                                    <Link
                                        to="/settings/subscription"
                                        className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all flex items-center gap-1"
                                    >
                                        <RiVipCrownLine size={12} />
                                        <span>{(user.subscription?.plan || 'free').toUpperCase()}</span>
                                    </Link>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 px-2.5 py-1 rounded-full">
                                        <RiShieldCheckLine size={12} />
                                        <span>Active</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings card groups */}
                        {SETTING_GROUPS.map(({ label, cards }) => (
                            <div key={label} className="mb-8">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 px-0.5">{label}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {cards.map(({ to, icon: Icon, title, description }) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-[#111111] border border-white/[0.08] hover:border-white/20 hover:bg-[#161616] shadow-sm transition-all duration-200 active:scale-[0.98]"
                                        >
                                            {/* Icon badge - uniform monochrome with subtle hover transition */}
                                            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-[var(--accent-cyan)] group-hover:border-[var(--accent-cyan)]/30 group-hover:scale-105 transition-all">
                                                <Icon size={20} />
                                            </div>

                                            {/* Text */}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm text-zinc-100 mb-0.5 group-hover:text-[var(--accent-cyan)] transition-colors">{title}</p>
                                                <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
                                            </div>

                                            {/* Arrow */}
                                            <RiArrowRightLine
                                                size={16}
                                                className="text-zinc-600 group-hover:text-[var(--accent-cyan)] group-hover:translate-x-0.5 transition-all mt-1 shrink-0"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Account Actions / Logout Section */}
                        {user && (
                            <div className="pt-2 pb-6">
                                <div className="p-4 sm:p-5 rounded-2xl bg-[#111111] border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-sm text-white flex items-center gap-2">
                                            <RiLogoutBoxRLine size={17} className="text-red-400" />
                                            <span>Sign Out of Parsu AI</span>
                                        </p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            End your current session on this browser. You can sign back in at any time.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoutModal(true)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-[0.98]"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                    <Footer />
                </div>
            </div>

            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={async () => {
                    setShowLogoutModal(false);
                    await handleLogout();
                    navigate('/auth');
                }}
                title="Log Out of Parsu AI?"
                message="Are you sure you want to end your session? You will be returned to the sign-in screen."
            />

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
