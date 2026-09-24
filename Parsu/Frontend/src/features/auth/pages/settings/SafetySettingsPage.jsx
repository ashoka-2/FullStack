import React, { useState, useEffect, useRef } from 'react';
import {
    RiShieldLine, RiEyeOffLine, RiLoader4Line, RiCheckLine,
    RiAlertLine, RiShieldCheckLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';

const SectionLabel = ({ children }) => (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600 mb-3 px-0.5">{children}</p>
);

const Surface = ({ children, className = '' }) => (
    <div className={`rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] px-4 ${className}`}>
        {children}
    </div>
);

const SettingRow = ({ icon: Icon, title, description, action, noBorder = false }) => (
    <div className={`flex items-center justify-between gap-4 py-4 ${!noBorder ? 'border-b border-zinc-100 dark:border-white/5' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
            {Icon && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(32,184,205,0.08)' }}>
                    <Icon size={16} className="text-[var(--accent-cyan)]" />
                </div>
            )}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
                {description && <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 leading-relaxed">{description}</p>}
            </div>
        </div>
        <div className="shrink-0">{action}</div>
    </div>
);

const SafetySettingsPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [safetyFilter, setSafetyFilter] = useState(true);

    useEffect(() => {
        getUserSettings()
            .then(data => {
                setSafetyFilter(data.preferences?.safetyFilter !== false);
            })
            .catch(() => dispatch(addToast({ type: 'error', message: 'Failed to load settings' })))
            .finally(() => setLoading(false));
    }, [dispatch]);

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
            );
        }
    }, [loading]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserSettings({ preferences: { safetyFilter } });
            localStorage.setItem('parsu_safety', safetyFilter ? '1' : '0');
            dispatch(addToast({ type: 'success', message: 'Safety settings saved!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to save settings' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsPageLayout
            title="Safety"
            icon={RiShieldLine}
            description="Control content filters and safety preferences"
        >
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RiLoader4Line size={28} className="text-[var(--accent-cyan)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-6">

                    {/* ── Safety Filter ─────────────────────────────────── */}
                    <Surface>
                        <SettingRow
                            icon={RiShieldCheckLine}
                            title="Safe Content Filter"
                            description="Block harmful, explicit, or sensitive content in AI responses"
                            action={<PremiumToggle checked={safetyFilter} onChange={setSafetyFilter} />}
                        />
                        <SettingRow
                            icon={RiEyeOffLine}
                            title="Sensitive Content Warnings"
                            description="Show a warning label before displaying potentially sensitive AI-generated content"
                            noBorder
                            action={<PremiumToggle checked={safetyFilter} onChange={setSafetyFilter} disabled />}
                        />
                    </Surface>

                    {/* ── Notice ────────────────────────────────────────── */}
                    {!safetyFilter && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                            <RiAlertLine size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Safety filter is OFF</p>
                                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5 leading-relaxed">
                                    Parsu AI may produce content that some users find offensive or disturbing. Use at your own discretion.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── What the filter covers ────────────────────────── */}
                    <div>
                        <SectionLabel>What the filter protects against</SectionLabel>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Hate Speech', icon: '🚫' },
                                { label: 'Adult Content', icon: '🔞' },
                                { label: 'Violence', icon: '⚔️' },
                                { label: 'Self-harm', icon: '🛡️' },
                                { label: 'Dangerous info', icon: '⚠️' },
                                { label: 'Harassment', icon: '🤐' },
                            ].map(item => (
                                <div
                                    key={item.label}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all
                                        ${safetyFilter
                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-white/5 text-zinc-500'
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                    {safetyFilter && <RiShieldCheckLine size={14} className="ml-auto text-emerald-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                            bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)]
                            text-white font-semibold text-sm
                            active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                    >
                        {saving ? <RiLoader4Line size={16} className="animate-spin" /> : <RiCheckLine size={16} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            )}
        </SettingsPageLayout>
    );
};

export default SafetySettingsPage;
