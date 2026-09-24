import React, { useState, useEffect, useRef } from 'react';
import {
    RiSettings3Line, RiTranslate2, RiPaletteLine, RiPulseLine,
    RiSearchLine, RiLoader4Line, RiCheckLine, RiMoonLine, RiSunLine, RiComputerLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';
import { getWebSearchSetting, setWebSearchSetting } from '../../../../utils/aiSettingsSync';

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

// ─── Theme Picker ────────────────────────────────────────────────────────────
const THEMES = [
    { value: 'system', label: 'System', icon: RiComputerLine },
    { value: 'light', label: 'Light', icon: RiSunLine },
    { value: 'dark', label: 'Dark', icon: RiMoonLine },
];

const ThemePicker = ({ value, onChange }) => (
    <div className="grid grid-cols-3 gap-2">
        {THEMES.map(({ value: v, label, icon: Icon }) => (
            <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={[
                    'flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                    'active:scale-95',
                    value === v
                        ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)]'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-white/8 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/14'
                ].join(' ')}
            >
                <Icon size={18} />
                {label}
            </button>
        ))}
    </div>
);

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
];

// ─── General Settings Page ───────────────────────────────────────────────────
const GeneralSettingsPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [theme, setTheme] = useState('system');
    const [language, setLanguage] = useState('en');
    const [haptic, setHaptic] = useState(true);
    const [webSearch, setWebSearch] = useState(getWebSearchSetting);

    useEffect(() => {
        const handler = (e) => setWebSearch(Boolean(e.detail));
        window.addEventListener('parsu_web_search_change', handler);
        return () => window.removeEventListener('parsu_web_search_change', handler);
    }, []);

    useEffect(() => {
        getUserSettings()
            .then(data => {
                const p = data.preferences || {};
                setTheme(p.theme || 'system');
                setLanguage(p.language || 'en');
                setHaptic(p.hapticFeedback !== false);
                if (p.webSearchEnabled !== undefined) {
                    setWebSearch(p.webSearchEnabled);
                    setWebSearchSetting(p.webSearchEnabled);
                }
            })
            .catch(() => dispatch(addToast({ type: 'error', message: 'Failed to load settings' })))
            .finally(() => setLoading(false));
    }, [dispatch]);

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
            );
        }
    }, [loading]);

    // Apply theme immediately on change
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            // System
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
        }
        localStorage.setItem('parsu_theme', theme);
    }, [theme]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserSettings({
                preferences: { theme, language, hapticFeedback: haptic, webSearchEnabled: webSearch }
            });
            // Persist web search preference and notify all components
            setWebSearchSetting(webSearch);
            localStorage.setItem('parsu_haptic', haptic ? '1' : '0');
            dispatch(addToast({ type: 'success', message: 'General settings saved!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to save settings' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsPageLayout
            title="General"
            icon={RiSettings3Line}
            description="App appearance, language and behaviour preferences"
        >
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RiLoader4Line size={28} className="text-[var(--accent-cyan)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-6">

                    {/* ── Theme ─────────────────────────────────────────── */}
                    <div>
                        <SectionLabel>Appearance</SectionLabel>
                        <Surface className="py-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(32,184,205,0.08)' }}>
                                    <RiPaletteLine size={16} className="text-[var(--accent-cyan)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Theme</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Choose your preferred color scheme</p>
                                </div>
                            </div>
                            <ThemePicker value={theme} onChange={setTheme} />
                        </Surface>
                    </div>

                    {/* ── Language ──────────────────────────────────────── */}
                    <div>
                        <SectionLabel>Language</SectionLabel>
                        <Surface className="py-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(32,184,205,0.08)' }}>
                                    <RiTranslate2 size={16} className="text-[var(--accent-cyan)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">App Language</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Interface display language</p>
                                </div>
                            </div>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-xl
                                    bg-zinc-100 dark:bg-zinc-800/80
                                    border border-zinc-200 dark:border-white/8
                                    text-zinc-900 dark:text-zinc-100
                                    focus:outline-none focus:border-[var(--accent-cyan)]/60
                                    transition-all cursor-pointer"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code}>{l.name}</option>
                                ))}
                            </select>
                        </Surface>
                    </div>

                    {/* ── Behaviour ─────────────────────────────────────── */}
                    <div>
                        <SectionLabel>Behaviour</SectionLabel>
                        <Surface>
                            <SettingRow
                                icon={RiPulseLine}
                                title="Haptic Feedback"
                                description="Vibration on send, receive and other interactions"
                                action={<PremiumToggle checked={haptic} onChange={setHaptic} />}
                            />
                            <SettingRow
                                icon={RiSearchLine}
                                title="Web Search"
                                description="Automatically search the web for real-time information using Tavily"
                                noBorder
                                action={<PremiumToggle checked={webSearch} onChange={(val) => {
                                    setWebSearch(val);
                                    setWebSearchSetting(val);
                                }} />}
                            />
                        </Surface>
                        {webSearch && (
                            <p className="text-xs text-[var(--accent-cyan)] mt-2 px-1 flex items-center gap-1.5">
                                <RiSearchLine size={12} />
                                Live web search is active — Parsu AI will fetch real-time data.
                            </p>
                        )}
                    </div>

                    {/* ── Save ──────────────────────────────────────────── */}
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

export default GeneralSettingsPage;
