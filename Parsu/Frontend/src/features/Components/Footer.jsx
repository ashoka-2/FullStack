import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { useDispatch } from 'react-redux';
import {
  RiSparkling2Line,
  RiMailLine,
  RiGithubLine,
  RiLinkedinBoxLine,
  RiInstagramLine,
  RiYoutubeLine,
  RiDiscordLine,
  RiFacebookCircleLine,
  RiCheckLine,
  RiArrowRightLine,
  RiPulseLine,
  RiSearchLine,
  RiPriceTag3Line,
  RiBookOpenLine,
  RiShareLine,
  RiHistoryLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiFileTextLine,
  RiInformationLine,
  RiSendPlaneLine,
  RiMailSendLine
} from '@remixicon/react';
import gsap from 'gsap';
import ParsuLogo from './ParsuLogo';
import PrimaryButton from './PrimaryButton';
import customAxios from '../../utils/axios';
import { addToast } from '../../utils/toast.slice';

const DISPLAY = "'Bricolage Grotesque','Outfit',system-ui,sans-serif";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const footerRef = useRef(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      dispatch(addToast({ type: 'error', message: 'Please enter a valid email address.' }));
      return;
    }

    setSubscribing(true);
    try {
      let res;
      try {
        res = await customAxios.post('/api/newsletter/subscribe', { email });
      } catch (err) {
        if (err.response?.status === 404) {
          res = await customAxios.post('/api/newsletter', { email });
        } else {
          throw err;
        }
      }

      setSubscribed(true);
      setEmail('');
      dispatch(
        addToast({
          type: 'success',
          message: res?.data?.message || '🎉 Subscribed to Parsu AI weekly briefings!'
        })
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to subscribe. Please try again.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setSubscribing(false);
    }
  };

  /* ── GSAP Micro-Interactions ── */
  useEffect(() => {
    const root = footerRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        mouse: '(hover: hover) and (pointer: fine)'
      },
      (ctx) => {
        const { motion, mouse } = ctx.conditions;
        if (!motion || !mouse) return;

        const off = [];
        const on = (el, ev, fn) => {
          if (!el) return;
          el.addEventListener(ev, fn);
          off.push(() => el.removeEventListener(ev, fn));
        };

        // Magnetic hover on social buttons
        const socials = root.querySelectorAll('[data-magnetic-social]');
        socials.forEach((el) => {
          on(el, 'pointermove', (e) => {
            const r = el.getBoundingClientRect();
            gsap.to(el, {
              x: (e.clientX - r.left - r.width / 2) * 0.3,
              y: (e.clientY - r.top - r.height / 2) * 0.3,
              duration: 0.25,
              ease: 'power2.out'
            });
          });
          on(el, 'pointerleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
          });
        });

        // Hover nudge on link items
        const links = root.querySelectorAll('[data-link-nudge]');
        links.forEach((l) => {
          on(l, 'pointerenter', () => {
            gsap.to(l, { x: 4, duration: 0.2, ease: 'power2.out' });
          });
          on(l, 'pointerleave', () => {
            gsap.to(l, { x: 0, duration: 0.3, ease: 'power2.out' });
          });
        });

        return () => off.forEach((fn) => fn());
      },
      root
    );

    return () => mm.revert();
  }, []);

  const productLinks = [
    { to: '/ai', label: 'AI Workspace', icon: RiSearchLine },
    { to: '/pricing', label: 'Pricing Plans', icon: RiPriceTag3Line },
    { to: '/library', label: 'Research Library', icon: RiBookOpenLine },
    { to: '/social-connections', label: 'Social Channels', icon: RiShareLine },
    { to: '/changelog', label: 'Changelog', icon: RiHistoryLine },
    { to: '/settings', label: 'Preferences', icon: RiSettings3Line }
  ];

  const companyLinks = [
    { to: '/about', label: 'About Us', icon: RiInformationLine },
    { to: '/contact', label: 'Contact Team', icon: RiMailLine },
    { to: '/status', label: 'System Health', icon: RiPulseLine },
    { to: '/privacy', label: 'Privacy Policy', icon: RiShieldCheckLine },
    { to: '/terms', label: 'Terms of Service', icon: RiFileTextLine }
  ];

  const socialLinks = [
    { href: 'https://github.com/ashoka-2', label: 'GitHub', icon: RiGithubLine },
    { href: 'https://www.linkedin.com/in/ashok-kumar-016450379/', label: 'LinkedIn', icon: RiLinkedinBoxLine },
    { href: 'https://www.instagram.com/ashoka_3.0/', label: 'Instagram', icon: RiInstagramLine },
    { href: 'https://www.youtube.com/@ashoka_3.0', label: 'YouTube', icon: RiYoutubeLine },
    { href: 'https://discord.com/users/1409565502224863332', label: 'Discord', icon: RiDiscordLine },
    { href: 'https://www.facebook.com/profile.php?id=61579561182682', label: 'Facebook', icon: RiFacebookCircleLine }
  ];

  return (
    <footer
      ref={footerRef}
      className="relative z-10 w-full border-t border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#07080c]/90 backdrop-blur-2xl text-zinc-600 dark:text-zinc-400 mt-auto transition-colors duration-300"
    >
      {/* Razor-thin top cyan ambient highlight rim */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-[var(--accent-cyan)]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10">
        
        {/* ── MAIN CONTENT GRID: BRAND + NEWSLETTER + LINK COLUMNS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 pb-10 sm:pb-12 border-b border-zinc-200/80 dark:border-white/[0.06]">
          
          {/* Column 1 & 2: Brand + Integrated Newsletter Box (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 group cursor-pointer"
              aria-label="Parsu AI Home"
            >
              <ParsuLogo size={30} className="text-zinc-900 dark:text-white group-hover:scale-105 transition-transform" />
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight" style={{ fontFamily: DISPLAY }}>
                  PARSU
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1.5 py-0.5 rounded shadow-xs">
                  AI
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
              Autonomous multi-model intelligence, live web reasoning, and automated publishing unified into one workspace.
            </p>

            {/* Live Operational Status Pill */}
            <div>
              <Link
                to="/status"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-all group"
                title="View live service health"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </Link>
            </div>

            {/* Integrated Newsletter Subscription Card */}
            <div className="pt-2">
              <div className="rounded-2xl p-4 sm:p-5 bg-white/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs backdrop-blur-md max-w-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white mb-1.5">
                  <RiMailSendLine size={15} className="text-[var(--accent-cyan)]" />
                  <span>Stay on the Frontier</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Weekly intelligence briefings and multi-model release notes. Zero spam.
                </p>

                {subscribed ? (
                  <div className="h-10 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
                    <RiCheckLine size={16} />
                    <span>You're subscribed to AI briefings!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <div className="relative flex-1">
                      <RiMailLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email..."
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-100/90 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)] transition-all"
                      />
                    </div>
                    <PrimaryButton
                      type="submit"
                      disabled={subscribing}
                      loading={subscribing}
                      size="sm"
                      className="shrink-0 h-10 px-4"
                    >
                      Subscribe
                    </PrimaryButton>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Product Links (2.5 cols) */}
          <div className="lg:col-span-2 sm:pl-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      data-link-nudge
                      className="group inline-flex items-center gap-2 text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    >
                      <Icon size={14} className="text-zinc-400 dark:text-zinc-500 group-hover:text-[var(--accent-cyan)] transition-colors shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 4: Company & Legal Links (2.5 cols) */}
          <div className="lg:col-span-2 sm:pl-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      data-link-nudge
                      className="group inline-flex items-center gap-2 text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    >
                      <Icon size={14} className="text-zinc-400 dark:text-zinc-500 group-hover:text-[var(--accent-cyan)] transition-colors shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 5: Social Channels & Community (2 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">
              Connect
            </h4>
            <div className="grid grid-cols-3 gap-2 max-w-[200px]">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-magnetic-social
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 hover:border-[var(--accent-cyan)]/50 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer group shadow-xs"
                    title={social.label}
                    aria-label={social.label}
                  >
                    <Icon size={16} className="text-zinc-500 dark:text-zinc-400 group-hover:text-[var(--accent-cyan)] transition-colors" />
                  </a>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">
              Real-time model announcements, product drops, and community changelogs.
            </p>
          </div>

        </div>

        {/* ── BOTTOM COPYRIGHT & SECONDARY NAVIGATION ── */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="text-[11px] font-medium">
            © {currentYear} Parsu AI. Autonomous Multi-Model Intelligence — All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <Link to="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
