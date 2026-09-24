import React, { useState, useEffect, useRef } from 'react';
import { RiBrainLine, RiUserSmileLine, RiBriefcaseLine, RiFileList2Line, RiBookLine, RiDeleteBin6Line, RiCheckLine, RiLoader4Line, RiInformationLine } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings, clearUserMemory } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';
import { getMemorySetting, setMemorySetting } from '../../../../utils/aiSettingsSync';

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600 mb-3 px-0.5">{children}</p>
);

// ─── Settings Row ────────────────────────────────────────────────────────────
const SettingRow = ({ icon: Icon, title, description, action, noBorder = false }) => (
    <div className={`flex items-center justify-between gap-4 py-4 ${!noBorder ? 'border-b border-white/5' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
            {Icon && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(32,184,205,0.08)' }}>
                    <Icon size={16} className="text-[var(--accent-cyan)]" />
                </div>
            )}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{title}</p>
                {description && <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 leading-relaxed">{description}</p>}
            </div>
        </div>
        <div className="shrink-0">{action}</div>
    </div>
);

// ─── Surface Block ───────────────────────────────────────────────────────────
const Surface = ({ children, className = '' }) => (
    <div className={`rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] px-4 ${className}`}>
        {children}
    </div>
);

// ─── Memory Settings Page ────────────────────────────────────────────────────
const MemorySettingsPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);

    const [memoryEnabled, setMemoryEnabled] = useState(getMemorySetting);
    const [nickname, setNickname] = useState('');
    const [occupation, setOccupation] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [librarySearch, setLibrarySearch] = useState(false);
    const [memorySummary, setMemorySummary] = useState('');
    const [memoryFacts, setMemoryFacts] = useState([]);

    // ── Listen for external toggle changes (e.g. from AddToChatSheet) ──────
    useEffect(() => {
        const handler = (e) => setMemoryEnabled(Boolean(e.detail));
        window.addEventListener('parsu_memory_change', handler);
        return () => window.removeEventListener('parsu_memory_change', handler);
    }, []);

    // ── Load settings ──────────────────────────────────────────────────────
    useEffect(() => {
        getUserSettings()
            .then(data => {
                const m = data.memory || {};
                if (m.enabled !== undefined) {
                    setMemoryEnabled(m.enabled);
                    setMemorySetting(m.enabled);
                }
                setNickname(m.nickname || '');
                setOccupation(m.occupation || '');
                setCustomInstructions(m.customInstructions || '');
                setLibrarySearch(m.librarySearchEnabled || false);
                setMemorySummary(m.summary || '');
                setMemoryFacts(m.facts || []);
            })
            .catch(() => dispatch(addToast({ type: 'error', message: 'Failed to load settings' })))
            .finally(() => setLoading(false));
    }, [dispatch]);

    // ── GSAP entrance ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
            );
        }
    }, [loading]);

    // ── Save ───────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserSettings({
                memory: {
                    enabled: memoryEnabled,
                    nickname,
                    occupation,
                    customInstructions,
                    librarySearchEnabled: librarySearch,
                }
            });
            // Persist memory preference across components and tabs
            setMemorySetting(memoryEnabled);
            dispatch(addToast({ type: 'success', message: 'Memory settings saved!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to save settings' }));
        } finally {
            setSaving(false);
        }
    };

    // ── Clear memory ───────────────────────────────────────────────────────
    const handleClearMemory = async () => {
        if (!window.confirm('Clear all learned facts and memory summary? This cannot be undone.')) return;
        setClearing(true);
        try {
            await clearUserMemory();
            setMemorySummary('');
            setMemoryFacts([]);
            dispatch(addToast({ type: 'success', message: 'Memory cleared successfully' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to clear memory' }));
        } finally {
            setClearing(false);
        }
    };

    return (
        <SettingsPageLayout
            title="Memory"
            icon={RiBrainLine}
            description="Manage what Parsu AI remembers about you"
        >
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RiLoader4Line size={28} className="text-[var(--accent-cyan)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-6">

                    {/* ── Master Memory Toggle ─────────────────────────── */}
                    <Surface>
                        <SettingRow
                            icon={RiBrainLine}
                            title="Enable Memory"
                            description="Allow Parsu AI to remember things about you across conversations"
                            noBorder
                            action={
                                <PremiumToggle
                                    checked={memoryEnabled}
                                    onChange={(val) => {
                                        setMemoryEnabled(val);
                                        setMemorySetting(val);
                                    }}
                                />
                            }
                        />
                    </Surface>

                    {/* ── Personal Info ─────────────────────────────────── */}
                    <div>
                        <SectionLabel>Personal Info</SectionLabel>
                        <Surface>
                            <SettingRow
                                icon={RiUserSmileLine}
                                title="Nickname"
                                description="How Parsu AI should address you"
                                action={null}
                            />
                            <input
                                type="text"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                placeholder="e.g. Alex, Bhai, Boss…"
                                maxLength={60}
                                disabled={!memoryEnabled}
                                className="w-full mb-4 px-4 py-2.5 text-sm rounded-xl
                                    bg-zinc-100 dark:bg-zinc-800/80
                                    border border-zinc-200 dark:border-white/8
                                    text-zinc-900 dark:text-zinc-100
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                                    focus:outline-none focus:border-[var(--accent-cyan)]/60
                                    disabled:opacity-40 transition-all"
                            />

                            <SettingRow
                                icon={RiBriefcaseLine}
                                title="Occupation"
                                description="Your role or profession"
                                action={null}
                            />
                            <input
                                type="text"
                                value={occupation}
                                onChange={e => setOccupation(e.target.value)}
                                placeholder="e.g. Software Engineer, Student, Designer…"
                                maxLength={100}
                                disabled={!memoryEnabled}
                                className="w-full mb-4 px-4 py-2.5 text-sm rounded-xl
                                    bg-zinc-100 dark:bg-zinc-800/80
                                    border border-zinc-200 dark:border-white/8
                                    text-zinc-900 dark:text-zinc-100
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                                    focus:outline-none focus:border-[var(--accent-cyan)]/60
                                    disabled:opacity-40 transition-all"
                            />
                        </Surface>
                    </div>

                    {/* ── Custom Instructions ───────────────────────────── */}
                    <div>
                        <SectionLabel>Custom Instructions</SectionLabel>
                        <Surface className="pb-4">
                            <div className="flex items-start gap-3 py-4 border-b border-white/5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: 'rgba(32,184,205,0.08)' }}>
                                    <RiFileList2Line size={16} className="text-[var(--accent-cyan)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">How Parsu AI should respond</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Give specific instructions about tone, format, length, etc.</p>
                                </div>
                            </div>
                            <textarea
                                value={customInstructions}
                                onChange={e => setCustomInstructions(e.target.value)}
                                placeholder="e.g. Always respond in Hindi. Keep answers concise. Use bullet points when possible…"
                                maxLength={2000}
                                rows={5}
                                disabled={!memoryEnabled}
                                className="w-full mt-4 px-4 py-3 text-sm rounded-xl resize-none
                                    bg-zinc-100 dark:bg-zinc-800/80
                                    border border-zinc-200 dark:border-white/8
                                    text-zinc-900 dark:text-zinc-100
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                                    focus:outline-none focus:border-[var(--accent-cyan)]/60
                                    disabled:opacity-40 transition-all"
                            />
                            <p className="text-[11px] text-zinc-500 mt-2 text-right">{customInstructions.length}/2000</p>
                        </Surface>
                    </div>

                    {/* ── Library Search ────────────────────────────────── */}
                    <div>
                        <SectionLabel>Behaviour</SectionLabel>
                        <Surface>
                            <SettingRow
                                icon={RiBookLine}
                                title="Library Search"
                                description="Automatically search your library files when answering questions"
                                noBorder
                                action={
                                    <PremiumToggle
                                        checked={librarySearch}
                                        onChange={setLibrarySearch}
                                        disabled={!memoryEnabled}
                                    />
                                }
                            />
                        </Surface>
                    </div>

                    {/* ── Memory Summary ────────────────────────────────── */}
                    {(memorySummary || memoryFacts.length > 0) && (
                        <div>
                            <SectionLabel>What Parsu AI knows about you</SectionLabel>
                            <Surface className="pb-4">
                                {memorySummary && (
                                    <div className="py-4 border-b border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <RiInformationLine size={14} className="text-[var(--accent-cyan)]" />
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Summary</p>
                                        </div>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{memorySummary}</p>
                                    </div>
                                )}
                                {memoryFacts.length > 0 && (
                                    <div className="pt-4">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">Learned Facts</p>
                                        <ul className="space-y-1.5">
                                            {memoryFacts.map((fact, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                    <RiCheckLine size={14} className="text-[var(--accent-cyan)] shrink-0 mt-0.5" />
                                                    <span>{fact}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </Surface>
                        </div>
                    )}

                    {/* ── Actions ───────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                                bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)]
                                text-white font-semibold text-sm
                                active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                        >
                            {saving ? <RiLoader4Line size={16} className="animate-spin" /> : <RiCheckLine size={16} />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        {(memorySummary || memoryFacts.length > 0) && (
                            <button
                                onClick={handleClearMemory}
                                disabled={clearing}
                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                                    bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10
                                    text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400
                                    font-semibold text-sm border border-zinc-200 dark:border-white/8
                                    active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                            >
                                {clearing ? <RiLoader4Line size={16} className="animate-spin" /> : <RiDeleteBin6Line size={16} />}
                                Clear Memory
                            </button>
                        )}
                    </div>
                </div>
            )}
        </SettingsPageLayout>
    );
};

export default MemorySettingsPage;
