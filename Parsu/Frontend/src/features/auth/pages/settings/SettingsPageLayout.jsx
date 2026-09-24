import React, { useState } from 'react';
import { Link } from 'react-router';
import { RiMenuLine, RiArrowLeftLine } from '@remixicon/react';
import Sidebar from '../../../Components/Sidebar';
import Footer from '../../../Components/Footer';
import useSEO from '../../../../utils/useSEO';

/**
 * SettingsPageLayout
 * Shared layout for all Settings sub-pages.
 * App Shell: outer h-[100dvh] overflow-hidden, header shrink-0 pinned, 
 * inner flex-1 overflow-y-auto data-lenis-prevent for scroll.
 */
const SettingsPageLayout = ({ title, icon: Icon, description, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useSEO({
        title,
        description: description || `${title} — Manage your Parsu settings.`,
        noIndex: true,
    });

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main column — NO overflow here */}
            <div className="flex-1 flex flex-col min-h-0 lg:pl-56">

                {/* Header — shrink-0: naturally pinned */}
                <header className="shrink-0 z-30 border-b border-zinc-200 dark:border-white/5 bg-[var(--bg-primary)]/90 dark:bg-[var(--bg-primary)]/85 backdrop-blur-md px-3 sm:px-8 h-12 sm:h-14 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer rounded-lg active:scale-95 shrink-0"
                            aria-label="Open navigation"
                        >
                            <RiMenuLine size={20} />
                        </button>

                        <Link
                            to="/settings"
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-[var(--accent-cyan)] transition-colors shrink-0 group py-1 px-1.5 -ml-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                            title="Back to Settings"
                        >
                            <RiArrowLeftLine size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="font-medium text-[11px] sm:text-xs">Settings</span>
                        </Link>

                        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 shrink-0" />

                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            {Icon && <Icon size={16} className="text-[var(--accent-cyan)] shrink-0" />}
                            <h1 className="text-xs sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white truncate">{title}</h1>
                        </div>
                    </div>

                    {description && (
                        <p className="hidden md:block text-xs text-zinc-400 truncate ml-auto shrink-0 max-w-xs">{description}</p>
                    )}
                </header>

                {/* Scrollable content — data-lenis-prevent stops Lenis from intercepting */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col justify-between">
                    <div className="max-w-3xl w-full mx-auto px-3 sm:px-8 py-5 sm:py-10 pb-20 sm:pb-28">
                        {children}
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

export default SettingsPageLayout;
