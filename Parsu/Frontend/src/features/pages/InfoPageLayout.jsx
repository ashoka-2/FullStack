import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import gsap from 'gsap';
import { LiquidGlassNav } from '../Components/LiquidGlassNav';
import Footer from '../Components/Footer';
import { RiSparklingFill } from '@remixicon/react';

/**
 * InfoPageLayout — Standalone Public Page Shell
 * Uses the exact same sticky LiquidGlassNav as the landing page and the rich Footer.
 * Zero AI Chat Sidebar or inner chat chrome.
 */
export default function InfoPageLayout({ 
  title, 
  subtitle, 
  badge,
  children 
}) {
  const location = useLocation();
  const heroRef = useRef(null);
  const contentRef = useRef(null);

  // Theme synced with localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? 32;
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);
    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

  // GSAP entrance animation for standalone page
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: 'power2.out' }
      );
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-[var(--accent-cyan)]/25 overflow-x-hidden relative transition-colors duration-300">
      
      {/* Ambient Diffused Studio Glows (Apple/AI Dark) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-[var(--accent-cyan)]/[0.04] dark:bg-[var(--accent-cyan)]/[0.06] rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-10 right-10 w-[420px] h-[300px] bg-blue-600/[0.02] dark:bg-blue-600/[0.04] rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Main Landing Page Sticky LiquidGlassNav */}
      <LiquidGlassNav theme={theme} toggleTheme={toggleTheme} />

      {/* Hero Header Area (Offset by pt-28 for sticky navbar) */}
      {(title || subtitle || badge) && (
        <section ref={heroRef} className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-6 sm:pb-10 text-center z-10 relative">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] text-xs font-semibold mb-4 shadow-sm shadow-cyan-500/10">
              <RiSparklingFill size={13} className="shrink-0" />
              <span>{badge}</span>
            </div>
          )}
          {title && (
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.15] mb-3">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </section>
      )}

      {/* Main Page Body (Centered, Full Width, Clean) */}
      <main ref={contentRef} className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 z-10 relative">
        {children}
      </main>

      {/* Rich Footer with All Navigation & Policy Links */}
      <Footer />

    </div>
  );
}
