import React from 'react';
import { Link } from 'react-router';
import {
  RiSparkling2Line,
  RiSearchLine,
  RiBookOpenLine,
  RiShareLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiFileTextLine,
  RiInformationLine,
  RiMailLine,
  RiQuestionLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiGithubLine,
  RiLinkedinBoxLine,
  RiYoutubeLine,
  RiDiscordLine,
  RiCheckboxCircleLine,
  RiPriceTag3Line,
  RiPulseLine,
  RiHistoryLine
} from '@remixicon/react';

import ParsuLogo from './ParsuLogo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { to: '/ai', label: 'Search', icon: RiSearchLine },
    { to: '/pricing', label: 'Pricing Plans', icon: RiPriceTag3Line },
    { to: '/library', label: 'Library', icon: RiBookOpenLine },
    { to: '/social-connections', label: 'Social Hub', icon: RiShareLine },
    { to: '/changelog', label: 'Changelog', icon: RiHistoryLine },
    { to: '/settings', label: 'Settings', icon: RiSettings3Line },
  ];

  const legalLinks = [
    { to: '/privacy', label: 'Privacy Policy', icon: RiShieldCheckLine },
    { to: '/terms', label: 'Terms of Service', icon: RiFileTextLine },
  ];

  const resourceLinks = [
    { to: '/about', label: 'About Us', icon: RiInformationLine },
    { to: '/contact', label: 'Contact', icon: RiMailLine },
    { to: '/faq', label: 'FAQ', icon: RiQuestionLine },
    { to: '/status', label: 'System Status', icon: RiPulseLine },
  ];

  const socialLinks = [
    { href: 'https://www.instagram.com/ashoka_3.0/', label: 'Instagram', icon: RiInstagramLine },
    { href: 'https://www.facebook.com/profile.php?id=61579561182682', label: 'Facebook', icon: RiFacebookCircleLine },
    { href: 'https://github.com/ashoka-2', label: 'GitHub', icon: RiGithubLine },
    { href: 'https://www.linkedin.com/in/ashok-kumar-016450379/', label: 'LinkedIn', icon: RiLinkedinBoxLine },
    { href: 'https://www.youtube.com/@ashoka_3.0', label: 'YouTube', icon: RiYoutubeLine },
    { href: 'https://discord.com/users/1409565502224863332', label: 'Discord', icon: RiDiscordLine },
  ];

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-[#0B0B0B] text-zinc-600 dark:text-zinc-400 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-[var(--accent-cyan)] shadow-sm">
                <ParsuLogo size={19} className="text-[var(--accent-cyan)]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">PARSU</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[var(--accent-cyan)] px-1.5 py-0.5 rounded shadow-xs">AI</span>
              </div>
            </div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mb-5">
              AI-powered research assistant with multi-model intelligence, real-time search, and universal social publishing.
            </p>
            
            {/* System Status Indicator — clickable to /status */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Link 
                to="/status" 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer group"
                title="View live service uptime & health"
              >
                <RiCheckboxCircleLine className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">All Systems Operational</span>
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4 mt-6">Resources</h4>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4">Connect</h4>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200 dark:hover:bg-[#222222] hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer"
                  title={social.label}
                >
                  <social.icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed">
              Follow us for updates, tips, and AI insights across all platforms.
            </p>
          </div>
        </div>

        {/* Bottom Divider & Copyright */}
        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500">
            © {currentYear} Parsu AI. Built with precision — All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <Link to="/privacy" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Terms</Link>
            <Link to="/faq" className="hover:text-zinc-950 dark:hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
