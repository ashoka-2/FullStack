import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  RiMenuLine, 
  RiCloseLine, 
  RiArrowRightLine, 
  RiSparklingFill, 
  RiCheckFill,
  RiArrowLeftLine
} from '@remixicon/react';
import { useSelector } from 'react-redux';
import gsap from 'gsap';
import ParsuLogo from '../Components/ParsuLogo';
import Footer from '../Components/Footer';

const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQ' },
  { to: '/changelog', label: 'Changelog' },
  { to: '/contact', label: 'Contact' },
  { to: '/status', label: 'System Status' },
];

/**
 * InfoPageLayout — Standalone Public Page Layout
 * Independent from the AI Chat Sidebar and inner dashboard layout.
 * Crafted using Apple-design & AI-design engineering standards with GSAP transitions.
 */
export default function InfoPageLayout({ 
  title, 
  subtitle, 
  badge,
  children 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = useSelector(state => state.auth.user);
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  // GSAP entrance animation for standalone page
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col font-sans selection:bg-[var(--accent-cyan)]/25 overflow-x-hidden relative">
      
      {/* Ambient Diffused Studio Glows (Apple/AI Dark) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-[var(--accent-cyan)]/[0.04] rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[300px] bg-blue-600/[0.02] rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Standalone Top Floating Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#07080a]/85 backdrop-blur-2xl border-b border-white/[0.07] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-150">
              <ParsuLogo size={16} className="text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">PARSU</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1.5 py-0.5 rounded shadow-xs">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1 shadow-inner">
            {NAV_LINKS.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <Link
                to="/ai"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs hover:bg-[#1bb0c4] active:scale-[0.98] transition-all shadow-md shadow-cyan-500/15 cursor-pointer"
              >
                <span>Back to Chat</span>
                <RiArrowRightLine size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs hover:bg-[#1bb0c4] active:scale-[0.98] transition-all shadow-md shadow-cyan-500/15 cursor-pointer"
                >
                  <span>Start Free</span>
                  <RiArrowRightLine size={13} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.06] active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>

        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#090a0e]/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {NAV_LINKS.map(({ to, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] font-semibold border border-[var(--accent-cyan)]/25'
                        : 'text-zinc-300 hover:text-white bg-white/[0.02]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
              {user ? (
                <Link
                  to="/ai"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  Back to Chat Workspace
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-1/2 text-center py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.05] border border-white/[0.08]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-1/2 text-center py-2 rounded-xl bg-[var(--accent-cyan)] text-zinc-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Header Area */}
      {(title || subtitle || badge) && (
        <section ref={heroRef} className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-4 sm:pb-6 text-center z-10">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] text-[11px] font-semibold mb-3.5 shadow-xs">
              <RiSparklingFill size={12} />
              <span>{badge}</span>
            </div>
          )}
          {title && (
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto mt-2.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </section>
      )}

      {/* Main Page Body (Centered, Full Width, No Sidebar Padding) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 z-10">
        {children}
      </main>

      {/* Full-width Standalone Footer */}
      <Footer />

    </div>
  );
}
