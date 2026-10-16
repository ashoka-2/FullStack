import React, { useState, useEffect, useRef } from 'react';
import {
    RiShieldLine, RiShieldCheckLine, RiLoader4Line, RiCheckLine,
    RiAlertLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';
import PrimaryButton from '../../../Components/PrimaryButton';
import { Group, GroupLabel, GroupFooter, Row } from '../../../Components/GroupedList';

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
                '.settings-group-item',
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
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
                    <RiLoader4Line size={28} className="text-[var(--accent)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-7">

                    {/* ── Content Filters ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Content Moderation</GroupLabel>
                        <Group>
                            <Row
                                icon={RiShieldCheckLine}
                                label="Safe Content Filter"
                                description="Filter explicit, unsafe, or sensitive content in AI responses"
                                trailing={<PremiumToggle checked={safetyFilter} onChange={setSafetyFilter} />}
                            />
                        </Group>
                        <GroupFooter>
                            When enabled, Parsu AI enforces strict multi-tier alignment policies to block harmful instructions and inappropriate media generation.
                        </GroupFooter>
                    </div>

                    {/* ── Privacy & Data Notice ── */}
                    <div className="settings-group-item p-5 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
                        <div className="flex items-center gap-2">
                            <RiShieldLine size={16} className="text-[var(--accent-text)]" />
                            <h4 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                                Model Safety & Alignment
                            </h4>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            Parsu AI adheres to Google DeepMind and Anthropic responsible AI safety guidelines. Conversation inputs and uploaded files are never used to train third-party foundation models.
                        </p>
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

export default SafetySettingsPage;
