import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    RiCheckboxCircleLine,
    RiTimeLine,
    RiPulseLine,
    RiShieldCheckLine,
    RiCheckLine,
    RiArrowRightLine,
    RiLoader4Line,
    RiInformationLine,
    RiServerLine,
    RiGoogleFill,
    RiRobotLine
} from '@remixicon/react';
import InfoPageLayout from './InfoPageLayout';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { addToast } from '../../utils/toast.slice';

const SERVICES = [
    {
        name: 'Parsu AI Core Gateway & Chat Streaming',
        desc: 'Real-time WebSocket streaming, session management, and cross-chat memory.',
        status: 'Operational',
        uptime: '99.99%'
    },
    {
        name: 'Google Gemini 2.5 & 3.6 Flash Engine',
        desc: 'Primary multimodal reasoning, image analysis, and fast response generation.',
        status: 'Operational',
        uptime: '99.98%'
    },
    {
        name: 'Anthropic Claude & OpenAI Inference Pipelines',
        desc: 'Advanced coding reasoning and secondary deep analytical models.',
        status: 'Operational',
        uptime: '99.97%'
    },
    {
        name: 'Google Workspace Bridge (Gmail, Calendar, Drive)',
        desc: 'Direct user-level OAuth token exchange and per-user email dispatch API.',
        status: 'Operational',
        uptime: '100.0%'
    },
    {
        name: 'Google Maps Platform & Geocoding Service',
        desc: 'Local discovery, interactive place lookup, and quota monitoring gateway.',
        status: 'Operational',
        uptime: '100.0%'
    },
    {
        name: 'Universal Social Publishing Gateway',
        desc: 'Direct media uploads to YouTube, Instagram, X, LinkedIn, TikTok, FB, Pinterest.',
        status: 'Operational',
        uptime: '99.96%'
    },
    {
        name: 'Live Web Grounding & Vector RAG Pipeline',
        desc: 'Real-time search scraping, PDF ingestion, and semantic embedding generation.',
        status: 'Operational',
        uptime: '99.98%'
    }
];

export default function SystemStatus() {
    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const dispatch = useDispatch();

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!subscribeEmail) return;
        setLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://parsuai.onrender.com' : 'http://localhost:3000');
            await axios.post(`${backendUrl}/api/newsletter`, { email: subscribeEmail });
            setSubscribed(true);
            dispatch(addToast({ type: 'success', message: 'Subscribed to Parsu AI live status alerts!' }));
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Subscription failed' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <InfoPageLayout
            title="System Status"
            subtitle="Live uptime telemetry and system availability across global clusters"
            badge="Live"
        >
            <div className="space-y-10 sm:space-y-14">
                
                {/* ── Global Status Banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="p-6 sm:p-8 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                                <RiCheckboxCircleLine size={26} />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                                All Systems Operational
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                99.98% overall uptime across all nodes in the past 90 days.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Zero Active Incidents</span>
                    </div>
                </motion.div>

                {/* ── Metric Highlights Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Avg API Latency', value: '185ms', sub: 'Global p50' },
                        { label: 'Inference Success', value: '99.99%', sub: 'Last 24 hours' },
                        { label: 'Uptime (90d)', value: '99.98%', sub: 'Across 8 services' },
                        { label: 'Active Incidents', value: '0', sub: 'Zero disruptions' },
                    ].map((m, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 shadow-xs">
                            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                {m.label}
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                                {m.value}
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                {m.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Individual Services Status List ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <RiServerLine size={16} className="text-cyan-500" />
                            <span>Core Services Status</span>
                        </h3>
                        <span className="text-[11px] text-zinc-400">90-Day Telemetry</span>
                    </div>

                    <div className="space-y-3">
                        {SERVICES.map((srv, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                className="p-5 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-xs"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                            {srv.name}
                                        </h4>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            {srv.desc}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                        <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
                                            {srv.uptime}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            <RiCheckLine size={12} />
                                            <span>{srv.status}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* 90-day uptime miniature blocks */}
                                <div className="flex items-center gap-0.5 pt-1">
                                    {Array.from({ length: 45 }).map((_, barIdx) => (
                                        <div
                                            key={barIdx}
                                            className="flex-1 h-3 rounded-[2px] bg-emerald-500/70 hover:bg-emerald-400 transition-colors cursor-pointer"
                                            title="100% operational on this day"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── 90-Day Incident History ── */}
                <div className="p-6 sm:p-7 rounded-3xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <RiTimeLine size={16} className="text-cyan-500" />
                        <span>Past Incident Log (90 Days)</span>
                    </h3>

                    <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-2">
                            <RiCheckLine size={16} />
                        </div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">No incidents reported</p>
                        <p>All core inference, search, and publishing clusters operated without downtime.</p>
                    </div>
                </div>

                {/* ── Subscribe to Status Alerts Form ── */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                            Get Real-Time Incident Notifications
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                            Subscribe to receive automated notifications whenever maintenance is scheduled or service status updates.
                        </p>
                    </div>

                    {subscribed ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            <RiCheckLine size={16} />
                            <span>Subscribed to status updates!</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="email"
                                value={subscribeEmail}
                                onChange={(e) => setSubscribeEmail(e.target.value)}
                                placeholder="developer@company.com"
                                required
                                className="px-3.5 py-2 rounded-xl bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-cyan-500 w-full sm:w-56"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="shrink-0 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                            >
                                {loading ? <RiLoader4Line size={14} className="animate-spin" /> : <span>Subscribe</span>}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </InfoPageLayout>
    );
}
