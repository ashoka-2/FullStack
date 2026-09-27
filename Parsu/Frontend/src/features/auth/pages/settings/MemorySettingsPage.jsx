import React, { useState, useEffect, useRef } from 'react';
import { RiBrainLine, RiUserSmileLine, RiBriefcaseLine, RiFileList2Line, RiBookLine, RiDeleteBin6Line, RiCheckLine, RiLoader4Line, RiInformationLine, RiAddLine, RiCloseLine } from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings, clearUserMemory, addMemoryFactApi, deleteMemoryFactApi } from '../../service/settings.api';
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
    <div className={`flex items-center justify-between gap-4 py-4 ${!noBorder ? 'border-b border-zinc-100 dark:border-white/5' : ''}`}>
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
    const [newFactText, setNewFactText] = useState('');
    const [addingFact, setAddingFact] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState(null);

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

    // ── Add single fact ─────────────────────────────────────────────────────
    const handleAddFact = async (e) => {
        e?.preventDefault();
        const trimmed = newFactText.trim();
        if (!trimmed) return;

        setAddingFact(true);
        try {
            const res = await addMemoryFactApi(trimmed);
            if (res.facts) setMemoryFacts(res.facts);
            if (res.summary) setMemorySummary(res.summary);
            setNewFactText('');
            dispatch(addToast({ type: 'success', message: 'Fact remembered!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to add fact' }));
        } finally {
            setAddingFact(false);
        }
    };

    // ── Delete single fact ──────────────────────────────────────────────────
    const handleDeleteFact = async (index) => {
        setDeletingIndex(index);
        try {
            const res = await deleteMemoryFactApi(index);
            if (res.facts) setMemoryFacts(res.facts);
            if (res.summary) setMemorySummary(res.summary);
            dispatch(addToast({ type: 'success', message: 'Fact removed' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to remove fact' }));
        } finally {
            setDeletingIndex(null);
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
                            <div className="flex items-start gap-3 py-4 border-b border-zinc-100 dark:border-white/5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ background: 'rgba(32,184,205,0.08)' }}>
                                    <RiFileList2Line size={16} className="text-[var(--accent-cyan)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">How Parsu AI should respond</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Custom instructions are applied whenever specified; if left empty, default behavior is used.</p>
                                </div>
                            </div>
                            <textarea
                                value={customInstructions}
                                onChange={e => setCustomInstructions(e.target.value)}
                                placeholder="e.g. Keep answers concise, prioritize technical accuracy, or respond in a specific persona..."
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

                    {/* ── Memory Summary & Learned Facts ────────────────── */}
                    <div>
                        <SectionLabel>What Parsu AI Knows About You</SectionLabel>
                        <Surface className="pb-4">
                            {/* Summary Section */}
                            <div className="py-4 border-b border-zinc-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <RiInformationLine size={15} className="text-[var(--accent-cyan)]" />
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">User Summary</p>
                                </div>
                                {memorySummary ? (
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/50 dark:border-white/5">
                                        {memorySummary}
                                    </p>
                                ) : (
                                    <p className="text-xs text-zinc-500 italic">
                                        No summary generated yet. As you chat, Parsu AI will automatically understand your preferences, work, and interests.
                                    </p>
                                )}
                            </div>

                            {/* Learned Facts Section */}
                            <div className="pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Learned Facts & Details</p>
                                    <span className="text-[11px] text-zinc-400">{memoryFacts.length} stored</span>
                                </div>

                                {/* Add new fact directly */}
                                <form onSubmit={handleAddFact} className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newFactText}
                                        onChange={e => setNewFactText(e.target.value)}
                                        placeholder="Add a fact (e.g. My friend's name is Tez, I love coffee)..."
                                        disabled={!memoryEnabled || addingFact}
                                        className="flex-1 px-3.5 py-2 text-xs rounded-xl
                                            bg-zinc-100 dark:bg-zinc-800/80
                                            border border-zinc-200 dark:border-white/8
                                            text-zinc-900 dark:text-zinc-100
                                            placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                                            focus:outline-none focus:border-[var(--accent-cyan)]/60
                                            disabled:opacity-40 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newFactText.trim() || addingFact || !memoryEnabled}
                                        className="px-3.5 py-2 rounded-xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                                    >
                                        {addingFact ? <RiLoader4Line size={14} className="animate-spin" /> : <RiAddLine size={14} />}
                                        Remember
                                    </button>
                                </form>

                                {memoryFacts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {memoryFacts.map((fact, i) => (
                                            <li key={i} className="flex items-center justify-between gap-3 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/50 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <RiCheckLine size={14} className="text-[var(--accent-cyan)] shrink-0 mt-0.5" />
                                                    <span className="truncate">{fact}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteFact(i)}
                                                    disabled={deletingIndex === i}
                                                    title="Forget this fact"
                                                    className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                                >
                                                    {deletingIndex === i ? <RiLoader4Line size={13} className="animate-spin text-red-500" /> : <RiCloseLine size={13} />}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">
                                        No facts recorded yet. Say things like "Remember that my friend name is Tez" in chat, or add one above!
                                    </p>
                                )}
                            </div>
                        </Surface>
                    </div>

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
                                Clear All Memory
                            </button>
                        )}
                    </div>
                </div>
            )}
        </SettingsPageLayout>
    );
};

export default MemorySettingsPage;
