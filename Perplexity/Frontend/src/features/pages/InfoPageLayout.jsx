import React, { useState } from 'react';
import { Link } from 'react-router';
import { RiMenuLine, RiArrowLeftLine } from '@remixicon/react';
import Sidebar from '../Components/Sidebar';
import Footer from '../Components/Footer';

/**
 * InfoPageLayout
 * Reusable layout for informational and legal pages (Privacy, Terms, About, Contact, FAQ).
 * Provides the global Sidebar for quick switching, mobile hamburger navigation,
 * responsive container, and consistent footer branding.
 */
export default function InfoPageLayout({ 
    title, 
    subtitle, 
    badge,
    children 
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-[#f4f5f7] dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#60A6AF]/30 overflow-hidden">
            {/* Shared Application Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Page Body */}
            <div className="flex-1 flex flex-col min-h-screen lg:pl-56 overflow-y-auto custom-scrollbar transition-all duration-300">
                {/* Sticky Header */}
                <header className="sticky top-0 z-30 bg-[#f4f5f7]/85 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200/70 dark:border-white/5 px-4 sm:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile Sidebar Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer rounded-xl hover:bg-zinc-200/60 dark:hover:bg-white/5"
                            title="Open Sidebar"
                        >
                            <RiMenuLine size={20} />
                        </button>

                        <Link 
                            to="/" 
                            className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/5"
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

                {/* Page Body Container */}
                <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
                    {children}
                </main>

                {/* Footer with Perplexity Branding */}
                <Footer />
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
