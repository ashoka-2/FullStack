import React, { useState, useEffect, useRef } from 'react';
import {
    RiSettings3Line, RiPaletteLine, RiPulseLine,
    RiSearchLine, RiLoader4Line, RiCheckLine, RiMoonLine, RiSunLine, RiComputerLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';
import { getWebSearchSetting, setWebSearchSetting } from '../../../../utils/aiSettingsSync';
import PrimaryButton from '../../../Components/PrimaryButton';
import { Group, GroupLabel, GroupFooter, Row } from '../../../Components/GroupedList';

const THEMES = [
    { value: 'system', label: 'System', icon: RiComputerLine },
    { value: 'light', label: 'Light', icon: RiSunLine },
    { value: 'dark', label: 'Dark', icon: RiMoonLine },
];

const GeneralSettingsPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [theme, setTheme] = useState('system');
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
                '.settings-group-item',
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', clearProps: 'all' }
            );
        }
    }, [loading]);

    // Apply theme immediately on change
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
        }
        localStorage.setItem('parsu_theme', theme);
    }, [theme]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserSettings({
                preferences: { theme, hapticFeedback: haptic, webSearchEnabled: webSearch }
            });
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
            description="App appearance and behaviour preferences"
        >
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RiLoader4Line size={28} className="text-[var(--accent)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-7">

                    {/* ── Theme / Appearance ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Appearance</GroupLabel>
                        <Group>
                            <div className="rounded-[28px] bg-[var(--surface)] p-4 sm:p-5 flex flex-col gap-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent-text)] shrink-0">
                                        <RiPaletteLine size={19} />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-medium text-[var(--text)]">Color Scheme</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Select interface theme</p>
                                    </div>
                                </div>

                                {/* Minimal-AI-UI Segmented Control */}
                                <div className="h-11 p-1 rounded-full bg-[var(--surface-2)] grid grid-cols-3 gap-1 select-none">
                                    {THEMES.map(({ value: v, label, icon: Icon }) => {
                                        const isSelected = theme === v;
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setTheme(v)}
                                                className={`h-full rounded-full flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer transition-all duration-150 ${
                                                    isSelected
                                                        ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
                                                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                                }`}
                                            >
                                                <Icon size={14} />
                                                <span>{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </Group>
                    </div>

                    {/* ── Behaviour ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Behaviour</GroupLabel>
                        <Group>
                            <Row
                                icon={RiPulseLine}
                                label="Haptic Feedback"
                                description="Tactile feedback on send, receive and key taps"
                                trailing={<PremiumToggle checked={haptic} onChange={setHaptic} />}
                            />
                            <Row
                                icon={RiSearchLine}
                                label="Live Web Search"
                                description="Fetch real-time data using Tavily grounding"
                                trailing={
                                    <PremiumToggle
                                        checked={webSearch}
                                        onChange={(val) => {
                                            setWebSearch(val);
                                            setWebSearchSetting(val);
                                        }}
                                    />
                                }
                            />
                        </Group>
                        {webSearch && (
                            <GroupFooter>
                                Live search is active — Parsu AI will search the web when answering time-sensitive queries.
                            </GroupFooter>
                        )}
                    </div>

                    {/* ── Save Button ── */}
                    <div className="settings-group-item pt-2">
                        <PrimaryButton
                            onClick={handleSave}
                            disabled={saving}
                            loading={saving}
                            icon={RiCheckLine}
                            iconPosition="left"
                            fullWidth
                            size="md"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </PrimaryButton>
                    </div>

                </div>
            )}
        </SettingsPageLayout>
    );
};

export default GeneralSettingsPage;
