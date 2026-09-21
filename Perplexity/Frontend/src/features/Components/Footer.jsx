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
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiYoutubeLine,
  RiDiscordLine,
  RiCheckboxCircleLine
} from '@remixicon/react';

import PerplexityIcon from './PerplexityIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { to: '/', label: 'Search', icon: RiSearchLine },
    { to: '/library', label: 'Library', icon: RiBookOpenLine },
    { to: '/social-connections', label: 'Social Hub', icon: RiShareLine },
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
  ];

  const socialLinks = [
    { href: '#', label: 'Instagram', icon: RiInstagramLine },
    { href: '#', label: 'Facebook', icon: RiFacebookCircleLine },
    { href: '#', label: 'GitHub', icon: RiGithubLine },
    { href: '#', label: 'X (Twitter)', icon: RiTwitterXLine },
    { href: '#', label: 'LinkedIn', icon: RiLinkedinBoxLine },
    { href: '#', label: 'YouTube', icon: RiYoutubeLine },
    { href: '#', label: 'Discord', icon: RiDiscordLine },
  ];

  return (
    <footer className="w-full border-t border-zinc-200/70 dark:border-white/5 bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
                <PerplexityIcon size={19} className="text-white" />
              </div>
              <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Perplexity</span>
            </div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mb-5">
              AI-powered research assistant with multi-model intelligence, RAG search, and universal social publishing.
            </p>
            
            {/* System Status Indicator */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <RiCheckboxCircleLine className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-cyan-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-cyan-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-4 mt-6">Resources</h4>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-cyan-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-4">Connect</h4>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:border-cyan-500/30 transition-all"
                  title={social.label}
                >
                  <social.icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                </a>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-4 leading-relaxed">
              Follow us for updates, tips, and AI insights across all platforms.
            </p>
          </div>
        </div>

        {/* Bottom Divider & Copyright */}
        <div className="mt-10 pt-6 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            © {currentYear} Perplexity AI Clone. Built with ❤️ — All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-600">
            <Link to="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms</Link>
            <Link to="/faq" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
