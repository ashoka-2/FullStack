import React, { useState } from 'react';
import { Link } from 'react-router';
import { RiMenuLine, RiArrowLeftLine, RiSideBarLine } from '@remixicon/react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapse } from '../chat/chat.slice';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';

/**
 * InfoPageLayout
 * Reusable layout for informational and legal pages (Privacy, Terms, About, Contact, FAQ).
 * App Shell pattern: outer = h-[100dvh] overflow-hidden, inner column = flex-col min-h-0 (no overflow),
 * header = shrink-0 (pinned naturally at top), scroller = flex-1 overflow-y-auto min-h-0.
 */
export default function InfoPageLayout({ 
    title, 
    subtitle, 
    badge,
    children 
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--color-clear-hanada)]/30">
            {/* Shared Application Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Page Body — dynamic padding based on sidebar collapse */}
            <div className={`flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>

                {/* Header — shrink-0 pins it; column doesn't scroll so header stays fixed */}
                <header className="shrink-0 z-30 bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 h-12 sm:h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-all cursor-pointer rounded-xl hover:bg-white/[0.06]"
                            title="Open Sidebar"
                        >
                            <RiMenuLine size={20} />
                        </button>

                        <Link 
                            to={user ? "/ai" : "/"} 
                            className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
                        >
                            <RiArrowLeftLine size={16} />
                            <span>Home</span>
                        </Link>

                        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                                {title}
                            </h1>
                            {badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>

                    {subtitle && (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden md:block">
                            {subtitle}
                        </p>
                    )}
                </header>

                {/* Scrollable Content — only this area scrolls */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                />
            )}
        </div>
    );
}

