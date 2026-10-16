import React, { useState, useEffect, useRef } from 'react';
import {
    RiBrainLine, RiUserSmileLine, RiBriefcaseLine, RiFileList2Line,
    RiBookLine, RiDeleteBin6Line, RiCheckLine, RiLoader4Line,
    RiInformationLine, RiAddLine, RiCloseLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import {
    getUserSettings, updateUserSettings, clearUserMemory,
    addMemoryFactApi, deleteMemoryFactApi
} from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';
import { getMemorySetting, setMemorySetting } from '../../../../utils/aiSettingsSync';
import PrimaryButton from '../../../Components/PrimaryButton';
import { Group, GroupLabel, GroupFooter, Row } from '../../../Components/GroupedList';

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

    useEffect(() => {
        const handler = (e) => setMemoryEnabled(Boolean(e.detail));
        window.addEventListener('parsu_memory_change', handler);
        return () => window.removeEventListener('parsu_memory_change', handler);
    }, []);

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

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                '.settings-group-item',
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
            );
        }
    }, [loading]);

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
            setMemorySetting(memoryEnabled);
            dispatch(addToast({ type: 'success', message: 'Memory settings saved!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to save memory settings' }));
        } finally {
            setSaving(false);
        }
    };

    const handleClearMemory = async () => {
        if (!window.confirm('Are you sure you want to clear all learned facts and memory summary?')) return;
        setClearing(true);
        try {
            await clearUserMemory();
            setMemorySummary('');
            setMemoryFacts([]);
            dispatch(addToast({ type: 'success', message: 'Memory erased successfully!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to clear memory' }));
        } finally {
            setClearing(false);
        }
    };

    const handleAddFact = async (e) => {
        e.preventDefault();
        if (!newFactText.trim()) return;
        setAddingFact(true);
        try {
            const res = await addMemoryFactApi(newFactText.trim());
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
                    <RiLoader4Line size={28} className="text-[var(--accent)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-7">

                    {/* ── Master Memory Toggle ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Global Memory</GroupLabel>
                        <Group>
                            <Row
                                icon={RiBrainLine}
                                label="Enable Memory"
                                description="Allow Parsu AI to remember facts and preferences across conversations"
                                trailing={
                                    <PremiumToggle
                                        checked={memoryEnabled}
                                        onChange={(val) => {
                                            setMemoryEnabled(val);
                                            setMemorySetting(val);
                                        }}
                                    />
                                }
                            />
                            <Row
                                icon={RiBookLine}
                                label="Library Search"
                                description="Search stored files when answering questions"
                                trailing={
                                    <PremiumToggle
                                        checked={librarySearch}
                                        onChange={setLibrarySearch}
                                        disabled={!memoryEnabled}
                                    />
                                }
                            />
                        </Group>
                    </div>

                    {/* ── Personal Info ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Personal Profile</GroupLabel>
                        <div className="flex flex-col gap-3">
                            <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                                    <RiUserSmileLine size={15} />
                                    <span>Nickname</span>
                                </label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={e => setNickname(e.target.value)}
                                    placeholder="How Parsu AI should address you (e.g. Alex, Boss)"
                                    maxLength={60}
                                    disabled={!memoryEnabled}
                                    className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-4 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium disabled:opacity-40"
                                />
                            </div>

                            <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                                    <RiBriefcaseLine size={15} />
                                    <span>Occupation</span>
                                </label>
                                <input
                                    type="text"
                                    value={occupation}
                                    onChange={e => setOccupation(e.target.value)}
                                    placeholder="Your profession (e.g. Software Engineer, Designer)"
                                    maxLength={100}
                                    disabled={!memoryEnabled}
                                    className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-4 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium disabled:opacity-40"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Custom Instructions ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Custom Persona & Instructions</GroupLabel>
                        <div className="p-4 sm:p-5 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <RiFileList2Line size={16} className="text-[var(--accent-text)]" />
                                <p className="text-xs font-semibold text-[var(--text)]">How Parsu AI should respond</p>
                            </div>
                            <textarea
                                value={customInstructions}
                                data-guide="memory-custom-instructions"
                                onChange={e => setCustomInstructions(e.target.value)}
                                placeholder="e.g. Keep answers concise, prioritize technical accuracy, or respond in a specific persona..."
                                maxLength={2000}
                                rows={4}
                                disabled={!memoryEnabled}
                                className="w-full p-3 text-sm rounded-[16px] resize-none bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all disabled:opacity-40"
                            />
                            <p className="text-[11px] text-[var(--text-subtle)] text-right tabular-nums">{customInstructions.length} / 2000</p>
                        </div>
                    </div>

                    {/* ── Memory Summary & Learned Facts ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Learned Memory ({memoryFacts.length} Facts)</GroupLabel>
                        <div className="p-4 sm:p-5 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] space-y-4">
                            {memorySummary && (
                                <div className="p-3.5 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)]">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)] mb-1">
                                        <RiInformationLine size={14} />
                                        <span>Current Memory Digest</span>
                                    </div>
                                    <p className="text-xs text-[var(--text)] leading-relaxed">
                                        {memorySummary}
                                    </p>
                                </div>
                            )}

                            {/* Add Fact Inline Form */}
                            <form onSubmit={handleAddFact} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newFactText}
                                    onChange={e => setNewFactText(e.target.value)}
                                    placeholder="Add a new fact (e.g. My pet dog is Bruno)..."
                                    disabled={!memoryEnabled || addingFact}
                                    className="flex-1 h-10 px-4 text-xs rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all disabled:opacity-40"
                                />
                                <button
                                    type="submit"
                                    disabled={!newFactText.trim() || addingFact || !memoryEnabled}
                                    className="h-10 px-4 rounded-full bg-[var(--text)] text-[var(--bg)] text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0"
                                >
                                    {addingFact ? <RiLoader4Line size={14} className="animate-spin" /> : <RiAddLine size={14} />}
                                    Remember
                                </button>
                            </form>

                            {/* Facts list */}
                            {memoryFacts.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                    {memoryFacts.map((fact, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-[12px] bg-[var(--surface-2)] text-xs text-[var(--text)]">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <RiCheckLine size={14} className="text-[var(--accent-text)] shrink-0" />
                                                <span className="truncate">{fact}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFact(i)}
                                                disabled={deletingIndex === i}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors shrink-0 cursor-pointer"
                                                title="Forget this fact"
                                            >
                                                {deletingIndex === i ? <RiLoader4Line size={12} className="animate-spin" /> : <RiCloseLine size={13} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[var(--text-muted)] italic py-1 text-center">
                                    No recorded facts yet. Tell Parsu AI "Remember that..." in chat or add one above.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div className="settings-group-item flex flex-col sm:flex-row gap-3 pt-2">
                        <PrimaryButton
                            onClick={handleSave}
                            disabled={saving}
                            loading={saving}
                            icon={RiCheckLine}
                            iconPosition="left"
                            className="flex-1"
                            size="md"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </PrimaryButton>
                        {(memorySummary || memoryFacts.length > 0) && (
                            <button
                                type="button"
                                onClick={handleClearMemory}
                                disabled={clearing}
                                className="h-11 px-5 rounded-full bg-[var(--surface)] hover:bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--line)] font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                {clearing ? <RiLoader4Line size={14} className="animate-spin" /> : <RiDeleteBin6Line size={14} />}
                                <span>Clear Memory</span>
                            </button>
                        )}
                    </div>

                </div>
            )}
        </SettingsPageLayout>
    );
};

export default MemorySettingsPage;
