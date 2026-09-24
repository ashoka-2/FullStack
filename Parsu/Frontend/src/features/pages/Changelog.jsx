import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    RiSparkling2Line,
    RiGitCommitLine,
    RiShieldCheckLine,
    RiGoogleFill,
    RiShareForwardLine,
    RiTerminalBoxLine,
    RiCheckLine,
    RiArrowRightLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';
import { Link } from 'react-router';

const RELEASES = [
    {
        version: 'v2.5.0',
        date: 'September 2026',
        title: 'Google Workspace Hub, Maps Grounding & Production Hardening',
        category: 'Integrations',
        badge: 'Latest',
        highlights: [
            {
                title: 'Google Workspace Hub',
                desc: 'Users can now connect their personal Google accounts to synchronize Gmail, Calendar, and Drive with zero server-side credential storage.'
            },
            {
                title: 'Per-User Gmail AI Dispatch',
                desc: 'The AI email tool now sends emails directly from the user\'s authentic Gmail account via the Google OAuth REST API.'
            },
            {
                title: 'Google Maps Platform Integration',
                desc: 'Real-time place discovery, directions, and geocoding with a built-in admin monthly free-tier quota monitor.'
            },
            {
                title: 'Apple-Grade Pricing & Status Pages',
                desc: 'Transparent pricing matrix with annual discount toggles and live 90-day system uptime telemetry.'
            }
        ]
    },
    {
        version: 'v2.4.0',
        date: 'September 2026',
        title: 'Apple-Designed Admin Portal & Real-Time Telemetry',
        category: 'Features',
        badge: 'Major',
        highlights: [
            {
                title: 'Dedicated Admin Portal',
                desc: 'Multi-route administration hub (/admin/dashboard, /admin/users, /admin/contacts, /admin/newsletter, /admin/api-usage) styled after Apple Human Interface Guidelines.'
            },
            {
                title: 'Real-Time Traffic Analytics',
                desc: 'Live telemetry tracking active real-time users, daily visitors, monthly, yearly, and total pageview trends.'
            },
            {
                title: 'Unified Contact & Subscriber Inboxes',
                desc: 'Searchable directory of public user inquiries with 1-click mailto replies, plus exportable newsletter subscriber lists.'
            }
        ]
    },
    {
        version: 'v2.2.0',
        date: 'August 2026',
        title: 'Multi-Model Intelligence & Custom Key Manager (BYOK)',
        category: 'Features',
        badge: 'AI Core',
        highlights: [
            {
                title: 'Instant Multi-Model Switching',
                desc: 'Seamlessly toggle between Google Gemini 2.5 Flash, Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, and Groq Llama 3.3 during active conversations.'
            },
            {
                title: 'Custom API Key Manager',
                desc: 'Users can bring their own API keys with AES-256 local encrypted storage for unlimited high-throughput research.'
            }
        ]
    },
    {
        version: 'v2.1.0',
        date: 'August 2026',
        title: 'Universal 1-Click Social Media Publisher',
        category: 'Integrations',
        badge: 'Social',
        highlights: [
            {
                title: 'Multi-Network Publishing',
                desc: 'Schedule and instantly publish content, images, and videos to 7 major platforms: YouTube, Instagram, Facebook, X, LinkedIn, TikTok, and Pinterest.'
            },
            {
                title: 'ImageKit CDN Asset Pipeline',
                desc: 'Automated video transcoding, image optimization, and permanent CDN storage for lightning-fast public delivery.'
            }
        ]
    },
    {
        version: 'v2.0.0',
        date: 'July 2026',
        title: 'Autonomous Research Assistant & Live Web Grounding',
        category: 'Improvements',
        badge: 'Genesis',
        highlights: [
            {
                title: 'Deep RAG Vector Memory',
                desc: 'Upload PDFs and documents to query complex research papers with verified inline source citations.'
            },
            {
                title: 'Interactive JellyBlob Mascot',
                desc: 'Fluid physics companion providing conversational voice feedback, mood expressions, and interactive engagement.'
            }
        ]
    }
];

export default function Changelog() {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Features', 'Integrations', 'Improvements'];

    const filteredReleases = selectedCategory === 'All'
        ? RELEASES
        : RELEASES.filter(r => r.category === selectedCategory);

    return (
        <InfoPageLayout
            title="Changelog"
            subtitle="Release notes, performance enhancements, and new feature rollouts"
            badge="Updates"
        >
            <div className="space-y-10 sm:space-y-12">
                
                {/* ── Category Filters ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-200/70 dark:bg-white/5 border border-zinc-300 dark:border-white/10">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <span className="text-[11px] text-zinc-400">
                        Showing {filteredReleases.length} release updates
                    </span>
                </div>

                {/* ── Releases Timeline ── */}
                <div className="relative pl-6 sm:pl-8 space-y-12 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-white/10">
                    {filteredReleases.map((release, idx) => (
                        <motion.div
                            key={release.version}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: idx * 0.08 }}
                            className="relative space-y-4"
                        >
                            {/* Timeline bullet icon */}
                            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-[var(--bg-surface)] border-2 border-cyan-500 flex items-center justify-center text-cyan-500 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                            </div>

                            {/* Release Header */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-mono text-sm sm:text-base font-extrabold text-cyan-600 dark:text-cyan-400">
                                    {release.version}
                                </span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                    {release.date}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                    {release.badge}
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                                {release.title}
                            </h3>

                            {/* Release Card */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {release.highlights.map((h, i) => (
                                        <div key={i} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 space-y-1">
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                                <span>{h.title}</span>
                                            </h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                {h.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Bottom Callout ── */}
                <div className="p-6 rounded-3xl bg-zinc-100/70 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-0.5 text-center sm:text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                            Have a feature request or feedback?
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Our team ships updates weekly based on community votes and user suggestions.
                        </p>
                    </div>
                    <Link
                        to="/contact"
                        className="shrink-0 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-xs transition-all"
                    >
                        Submit Idea
                    </Link>
                </div>

            </div>
        </InfoPageLayout>
    );
}
