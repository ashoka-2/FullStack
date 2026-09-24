import React, { useState, useRef } from 'react';
import {
    RiBugLine, RiSendPlaneLine, RiLoader4Line, RiCheckLine,
    RiAlertLine, RiFileList2Line
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import { submitBugReport } from '../../service/settings.api';
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
        browserInfo: navigator?.userAgent?.slice(0, 200) || '',
    });
    const [errors, setErrors] = useState({});

    React.useEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' }
            );
        }
    }, [submitted]);

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
            // Success animation
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
            description="Help us fix issues — your report goes directly to our team"
        >
            {submitted ? (
                <div ref={successRef} className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                        style={{ background: 'rgba(32,184,205,0.12)' }}>
                        <RiCheckLine size={32} className="text-[var(--accent-cyan)]" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Report Submitted!</h2>
                    <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                        Thank you for helping improve Parsu AI. Our team will review and respond to your report soon.
                    </p>
                    <button
                        onClick={() => { setSubmitted(false); setForm(f => ({ ...f, title: '', description: '', stepsToReproduce: '', expectedBehavior: '', actualBehavior: '' })); }}
                        className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold
                            bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                            hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                    >
                        Submit another report
                    </button>
                </div>
            ) : (
                <form ref={containerRef} onSubmit={handleSubmit} className="space-y-5">

                    {/* ── Title ──────────────────────────────────────────── */}
                    <div>
                        <Label required>Bug Title</Label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Chat freezes when sending image"
                            maxLength={200}
                            className={`${inputClass} ${errors.title ? 'border-red-400' : ''}`}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* ── Category + Severity ────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
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

                    {/* ── Description ───────────────────────────────────── */}
                    <div>
                        <Label required>What happened?</Label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Describe the bug clearly. Include what you were doing when it happened..."
                            rows={4}
                            maxLength={3000}
                            className={`${inputClass} resize-none ${errors.description ? 'border-red-400' : ''}`}
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>

                    {/* ── Steps to Reproduce ─────────────────────────────── */}
                    <div>
                        <Label>Steps to Reproduce</Label>
                        <textarea
                            value={form.stepsToReproduce}
                            onChange={e => set('stepsToReproduce', e.target.value)}
                            placeholder="1. Go to...\n2. Click on...\n3. See error"
                            rows={3}
                            maxLength={2000}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* ── Expected vs Actual ─────────────────────────────── */}
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
                                placeholder="What actually happened?"
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                    </div>

                    {/* ── Info notice ────────────────────────────────────── */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5">
                        <RiAlertLine size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Your browser info will be attached automatically to help us diagnose the issue. No personal data beyond your account is included.
                        </p>
                    </div>

                    {/* ── Submit ─────────────────────────────────────────── */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                            bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)]
                            text-white font-semibold text-sm
                            active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                    >
                        {submitting ? <RiLoader4Line size={16} className="animate-spin" /> : <RiSendPlaneLine size={16} />}
                        {submitting ? 'Submitting…' : 'Submit Bug Report'}
                    </button>
                </form>
            )}
        </SettingsPageLayout>
    );
};

export default ReportBugPage;
