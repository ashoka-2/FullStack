import React, { useState, useEffect, useRef } from 'react';
import {
    RiBugLine, RiSendPlaneLine, RiLoader4Line, RiCheckLine,
    RiAlertLine, RiFileList2Line, RiHistoryLine, RiRefreshLine,
    RiTimeLine, RiShieldCheckLine, RiCheckboxCircleLine, RiInformationLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import { submitBugReport, getUserBugReports } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';

const CATEGORIES = [
    { value: 'ui', label: '🎨 UI / Visual' },
    { value: 'chat', label: '💬 Chat / AI' },
    { value: 'auth', label: '🔐 Login / Auth' },
    { value: 'voice', label: '🎤 Voice / Speech' },
    { value: 'performance', label: '⚡ Performance' },
    { value: 'billing', label: '💳 Billing / Plan' },
    { value: 'other', label: '🔧 Other' },
];

const SEVERITIES = [
    { value: 'low', label: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    { value: 'medium', label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
    { value: 'high', label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
    { value: 'critical', label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
];

const STATUS_MAP = {
    open: { label: 'Under Review', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    in_progress: { label: 'Investigating', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    resolved: { label: 'Resolved', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    closed: { label: 'Closed', color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
    wont_fix: { label: "Won't Fix", color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
};

const inputClass = `w-full px-4 py-2.5 text-sm rounded-xl
    bg-zinc-100 dark:bg-zinc-800/80
    border border-zinc-200 dark:border-white/8
    text-zinc-900 dark:text-zinc-100
    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
    focus:outline-none focus:border-[var(--accent-cyan)]/60
    transition-all`;

const Label = ({ children, required }) => (
    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
        {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
);

const ReportBugPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const successRef = useRef(null);
    const pastReportsRef = useRef(null);

    const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'history'
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'other',
        severity: 'medium',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        browserInfo: typeof navigator !== 'undefined' ? navigator?.userAgent?.slice(0, 200) || '' : '',
    });
    const [errors, setErrors] = useState({});

    // Past reports state
    const [pastReports, setPastReports] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await getUserBugReports();
            if (res.success) {
                setPastReports(res.reports || []);
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to load past bug reports' }));
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'submit' && containerRef.current && !submitted) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }, [submitted, activeTab]);

    const set = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Title is required';
        if (!form.description.trim() || form.description.trim().length < 20)
            e.description = 'Please describe the bug in at least 20 characters';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const e2 = validate();
        if (Object.keys(e2).length) { setErrors(e2); return; }
        setSubmitting(true);
        try {
            await submitBugReport(form);
            setSubmitted(true);
            setTimeout(() => {
                if (successRef.current) {
                    gsap.fromTo(successRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
                }
            }, 50);
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to submit report. Please try again.' }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SettingsPageLayout
            title="Report a Bug"
            icon={RiBugLine}
            description="Help us improve Parsu AI — report issues or track responses to your past reports"
        >
            {/* ── Sub-Navigation Tabs ── */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 mb-6">
                <button
                    type="button"
                    onClick={() => setActiveTab('submit')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'submit'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <RiBugLine size={15} />
                    <span>Report a Bug</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'history'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <RiHistoryLine size={15} />
                    <span>My Past Reports</span>
                    {pastReports.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--accent-cyan)] text-white">
                            {pastReports.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Tab 1: Submit Form ── */}
            {activeTab === 'submit' && (
                submitted ? (
                    <div ref={successRef} className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: 'rgba(32,184,205,0.12)' }}>
                            <RiCheckLine size={32} className="text-[var(--accent-cyan)]" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Report Submitted!</h2>
                        <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-6">
                            Thank you for helping improve Parsu AI. Our engineering team reviews all reports. You can track our reply in the "My Past Reports" tab.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setSubmitted(false); setForm(f => ({ ...f, title: '', description: '', stepsToReproduce: '', expectedBehavior: '', actualBehavior: '' })); }}
                                className="px-5 py-2.5 rounded-xl text-xs font-semibold
                                    bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                                    hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                            >
                                Submit another report
                            </button>
                            <button
                                onClick={() => { setActiveTab('history'); setSubmitted(false); }}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold
                                    bg-[var(--accent-cyan)] text-white hover:bg-[var(--accent-cyan-hover)] transition-all cursor-pointer shadow-xs"
                            >
                                View My Reports
                            </button>
                        </div>
                    </div>
                ) : (
                    <form ref={containerRef} onSubmit={handleSubmit} className="space-y-5">
                        {/* ── Title ── */}
                        <div>
                            <Label required>Bug Title</Label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                placeholder="e.g. Voice transcription cuts off after 10 seconds"
                                maxLength={200}
                                className={`${inputClass} ${errors.title ? 'border-red-400' : ''}`}
                            />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* ── Category + Severity ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Category</Label>
                                <select
                                    value={form.category}
                                    onChange={e => set('category', e.target.value)}
                                    className={inputClass}
                                >
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Severity</Label>
                                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                                    {SEVERITIES.map(s => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => set('severity', s.value)}
                                            className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${form.severity === s.value ? `${s.bg} ${s.color}` : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/8 text-zinc-500'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Description ── */}
                        <div>
                            <Label required>What happened?</Label>
                            <textarea
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                placeholder="Describe the issue clearly. What were you doing when it occurred?"
                                rows={4}
                                maxLength={3000}
                                className={`${inputClass} resize-none ${errors.description ? 'border-red-400' : ''}`}
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        {/* ── Steps to Reproduce ── */}
                        <div>
                            <Label>Steps to Reproduce</Label>
                            <textarea
                                value={form.stepsToReproduce}
                                onChange={e => set('stepsToReproduce', e.target.value)}
                                placeholder="1. Go to...\n2. Click on...\n3. Observe the bug"
                                rows={3}
                                maxLength={2000}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        {/* ── Expected vs Actual ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Expected Behavior</Label>
                                <textarea
                                    value={form.expectedBehavior}
                                    onChange={e => set('expectedBehavior', e.target.value)}
                                    placeholder="What should have happened?"
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                            <div>
                                <Label>Actual Behavior</Label>
                                <textarea
                                    value={form.actualBehavior}
                                    onChange={e => set('actualBehavior', e.target.value)}
                                    placeholder="What actually occurred?"
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        </div>

                        {/* ── Info notice ── */}
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5">
                            <RiAlertLine size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Diagnostic browser metadata is attached to aid debugging. Your privacy is protected; no personal credentials are included.
                            </p>
                        </div>

                        {/* ── Submit button ── */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                                bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)]
                                text-white font-semibold text-sm
                                active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer shadow-md"
                        >
                            {submitting ? <RiLoader4Line size={16} className="animate-spin" /> : <RiSendPlaneLine size={16} />}
                            {submitting ? 'Submitting…' : 'Submit Bug Report'}
                        </button>
                    </form>
                )
            )}

            {/* ── Tab 2: Past Reports History ── */}
            {activeTab === 'history' && (
                <div ref={pastReportsRef} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/5">
                        <p className="text-xs font-semibold text-zinc-500">
                            {pastReports.length} {pastReports.length === 1 ? 'report' : 'reports'} submitted
                        </p>
                        <button
                            onClick={fetchHistory}
                            disabled={loadingHistory}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        >
                            <RiRefreshLine size={13} className={loadingHistory ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {loadingHistory ? (
                        <div className="py-16 text-center">
                            <RiLoader4Line size={28} className="animate-spin mx-auto text-zinc-400 mb-2" />
                            <p className="text-xs text-zinc-500">Loading your bug reports...</p>
                        </div>
                    ) : pastReports.length === 0 ? (
                        <div className="py-16 text-center px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10">
                            <RiFileList2Line size={36} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No bug reports yet</h3>
                            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 mb-4">
                                You haven't reported any issues. If you notice a bug, let us know!
                            </p>
                            <button
                                onClick={() => setActiveTab('submit')}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-cyan)] text-white hover:bg-[var(--accent-cyan-hover)] transition-all cursor-pointer"
                            >
                                Report a Bug
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pastReports.map((report) => {
                                const status = STATUS_MAP[report.status] || STATUS_MAP.open;
                                const sev = SEVERITIES.find(s => s.value === report.severity) || SEVERITIES[1];
                                const hasAdminReply = Boolean(report.adminReply && report.adminReply.trim());

                                return (
                                    <div
                                        key={report._id}
                                        className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/8 space-y-3.5 transition-all"
                                    >
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${sev.bg} ${sev.color}`}>
                                                    {sev.label}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-200/80 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 uppercase">
                                                    {report.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                                <RiTimeLine size={13} />
                                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <div>
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                                {report.title}
                                            </h4>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">
                                                {report.description}
                                            </p>
                                        </div>

                                        {/* Steps to Reproduce */}
                                        {report.stepsToReproduce && (
                                            <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-zinc-200/70 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400">
                                                <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                                                    Steps to Reproduce:
                                                </span>
                                                <p className="whitespace-pre-wrap font-mono text-[11px]">{report.stepsToReproduce}</p>
                                            </div>
                                        )}

                                        {/* Official Admin Reply Card */}
                                        {hasAdminReply ? (
                                            <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 animate-in fade-in duration-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                        <RiShieldCheckLine size={15} />
                                                        <span>Official Response from Parsu AI Team</span>
                                                    </div>
                                                    {report.adminRepliedAt && (
                                                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                                                            {new Date(report.adminRepliedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap pl-5">
                                                    {report.adminReply}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-white/5 text-xs text-zinc-500">
                                                <RiInformationLine size={15} className="shrink-0 text-zinc-400" />
                                                <span>Under review by the dev team. An admin response will appear here once reviewed.</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </SettingsPageLayout>
    );
};

export default ReportBugPage;
