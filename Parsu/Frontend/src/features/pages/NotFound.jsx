import React from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
    RiArrowLeftLine,
    RiSearch2Line,
    RiBookOpenLine,
    RiPriceTag3Line,
    RiPulseLine,
    RiMailLine,
    RiSparkling2Line,
    RiCompassDiscoverLine
} from '@remixicon/react';
import ParsuLogo from '../Components/ParsuLogo';

export default function NotFound() {
    const navigate = useNavigate();

    const quickLinks = [
        { label: 'AI Assistant', desc: 'Ask questions & start research', to: '/', icon: RiSparkling2Line, color: 'text-cyan-500' },
        { label: 'Saved Library', desc: 'Browse your past research chats', to: '/library', icon: RiBookOpenLine, color: 'text-blue-500' },
        { label: 'Pricing Plans', desc: 'Explore tiers & capabilities', to: '/pricing', icon: RiPriceTag3Line, color: 'text-emerald-500' },
        { label: 'System Status', desc: 'Check live operational status', to: '/status', icon: RiPulseLine, color: 'text-purple-500' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col justify-between selection:bg-[var(--accent-cyan)]/30 overflow-hidden relative">
            
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500/10 blur-[90px] pointer-events-none rounded-full" />

            {/* Top Minimal Brand Bar */}
            <header className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between z-10">
                <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                        <ParsuLogo size={18} className="text-white" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">PARSU</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-1.5 py-0.5 rounded-md">AI</span>
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                    <RiArrowLeftLine size={16} />
                    <span>Go Back</span>
                </button>
            </header>

            {/* Main Center Content */}
            <main className="w-full max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center z-10">
                
                {/* Glowing 404 Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                    className="relative mb-6"
                >
                    <div className="text-7xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 dark:from-white dark:via-zinc-300 dark:to-zinc-700 bg-clip-text text-transparent select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md">
                            Page Not Found
                        </span>
                    </div>
                </motion.div>

                {/* Subtitle */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-3"
                >
                    We couldn't locate this coordinate
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed mb-8"
                >
                    The page you are looking for may have been archived, renamed, or moved. Let's get you back on track.
                </motion.p>

                {/* Primary Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-3 mb-10 w-full"
                >
                    <Link
                        to="/"
                        className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Return to Assistant
                    </Link>
                    <Link
                        to="/contact"
                        className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Report Issue
                    </Link>
                </motion.div>

                {/* Quick Directory Grid */}
                <div className="w-full text-left">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 px-1 flex items-center gap-1.5">
                        <RiCompassDiscoverLine size={14} />
                        <span>Quick Directory Destinations</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickLinks.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={i}
                                    to={item.to}
                                    className="p-3.5 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 shadow-xs hover:shadow-md transition-all group flex items-center gap-3.5"
                                >
                                    <div className={`w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {item.label}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                            {item.desc}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </main>

            {/* Bottom Footer Note */}
            <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
                Parsu AI • Autonomous Research & Universal Publishing
            </footer>

        </div>
    );
}
