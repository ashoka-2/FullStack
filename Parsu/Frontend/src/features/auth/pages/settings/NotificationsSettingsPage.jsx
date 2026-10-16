import React, { useState, useEffect, useRef } from 'react';
import {
    RiNotificationLine, RiRobot2Line, RiAlertLine,
    RiLoader4Line, RiCheckLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import PremiumToggle from '../../../Components/PremiumToggle';
import { getUserSettings, updateUserSettings } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';
import PrimaryButton from '../../../Components/PrimaryButton';
import { Group, GroupLabel, GroupFooter, Row } from '../../../Components/GroupedList';

const NotificationsSettingsPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [aiResponse, setAiResponse] = useState(true);
    const [systemAlerts, setSystemAlerts] = useState(true);

    useEffect(() => {
        getUserSettings()
            .then(data => {
                const n = data.preferences?.notifications || {};
                setNotifEnabled(n.enabled !== false);
                setAiResponse(n.aiResponse !== false);
                setSystemAlerts(n.systemAlerts !== false);
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

    const handleMasterToggle = async (val) => {
        if (val && 'Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        setNotifEnabled(val);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserSettings({
                preferences: {
                    notifications: { enabled: notifEnabled, aiResponse, systemAlerts }
                }
            });
            localStorage.setItem('parsu_notif_enabled', notifEnabled ? '1' : '0');
            localStorage.setItem('parsu_notif_ai', aiResponse ? '1' : '0');
            dispatch(addToast({ type: 'success', message: 'Notification preferences saved!' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to save settings' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsPageLayout
            title="Notifications"
            icon={RiNotificationLine}
            description="Control when and how Parsu notifies you"
        >
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RiLoader4Line size={28} className="text-[var(--accent)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-7">

                    {/* ── Master Toggle ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Global Notifications</GroupLabel>
                        <Group>
                            <Row
                                icon={RiNotificationLine}
                                label="Enable Notifications"
                                description="Receive push notifications from Parsu AI on this device"
                                trailing={<PremiumToggle checked={notifEnabled} onChange={handleMasterToggle} />}
                            />
                        </Group>
                    </div>

                    {/* ── Notification Channels ── */}
                    <div className="settings-group-item">
                        <GroupLabel>Alert Types</GroupLabel>
                        <Group>
                            <Row
                                icon={RiRobot2Line}
                                label="AI Response Completed"
                                description="Get notified when a deep reasoning or long AI task finishes"
                                disabled={!notifEnabled}
                                trailing={
                                    <PremiumToggle
                                        checked={aiResponse}
                                        onChange={setAiResponse}
                                        disabled={!notifEnabled}
                                    />
                                }
                            />
                            <Row
                                icon={RiAlertLine}
                                label="System & Security Alerts"
                                description="Important notices, quota resets and release announcements"
                                disabled={!notifEnabled}
                                trailing={
                                    <PremiumToggle
                                        checked={systemAlerts}
                                        onChange={setSystemAlerts}
                                        disabled={!notifEnabled}
                                    />
                                }
                            />
                        </Group>
                    </div>

                    {/* ── Permission Notice ── */}
                    {'Notification' in window && Notification.permission === 'denied' && (
                        <div className="settings-group-item p-4 rounded-[20px] bg-[var(--surface)] border border-[var(--warning)]/30 flex items-start gap-3">
                            <RiAlertLine size={18} className="text-[var(--warning)] shrink-0 mt-0.5" />
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                Browser notifications are blocked in your browser settings. Please allow notifications for this site to receive timely alerts.
                            </p>
                        </div>
                    )}

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

export default NotificationsSettingsPage;
