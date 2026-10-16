import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { RiShieldCheckLine, RiCloseLine } from '@remixicon/react';

const CONSENT_KEY = 'parsu_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        // Small delay so it smoothly slides up after page load
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable in sandbox
    }
  }, []);

  const handleChoice = (level) => {
    try {
      localStorage.setItem(CONSENT_KEY, level);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and storage consent"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[3500] w-[calc(100%-1.5rem)] max-w-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto"
    >
      <div className="rounded-[24px] bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.1] shadow-2xl p-4 sm:p-5 text-zinc-900 dark:text-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
            <RiShieldCheckLine size={18} />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
              Privacy by Design
            </p>
            <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We use strictly essential local storage for authentication and interface settings. No third-party ad tracking or cross-site pixels.{' '}
              <Link
                to="/cookies"
                className="text-[var(--accent)] hover:underline font-medium inline-flex items-center"
              >
                Learn more
              </Link>
            </p>
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={() => handleChoice('essential')}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] rounded-full transition-all cursor-pointer whitespace-nowrap text-center"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => handleChoice('all')}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-zinc-950 bg-white dark:bg-[var(--accent)] hover:opacity-90 dark:text-zinc-950 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap text-center border border-zinc-200 dark:border-transparent"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => handleChoice('dismiss')}
            aria-label="Dismiss cookie notice"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0 hidden sm:inline-flex"
          >
            <RiCloseLine size={16} />
          </button>
        </div>

      </div>
    </aside>
  );
}
