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

const SectionLabel = ({ children }) => (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600 mb-3 px-0.5">{children}</p>
);

const Surface = ({ children, className = '' }) => (
    <div className={`rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] px-4 ${className}`}>
        {children}
    </div>
);

const SettingRow = ({ icon: Icon, title, description, action, noBorder = false, disabled = false }) => (
    <div className={`flex items-center justify-between gap-4 py-4 ${!noBorder ? 'border-b border-zinc-100 dark:border-white/5' : ''} ${disabled ? 'opacity-40' : ''}`}>
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
                containerRef.current.children,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
            );
        }
    }, [loading]);

    // Request browser notification permission when enabling
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
                    <RiLoader4Line size={28} className="text-[var(--accent-cyan)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-6">

                    {/* ── Master Toggle ──────────────────────────────────── */}
                    <Surface>
                        <SettingRow
                            icon={RiNotificationLine}
                            title="Enable Notifications"
                            description="Receive notifications from Parsu AI on this device"
                            noBorder
                            action={<PremiumToggle checked={notifEnabled} onChange={handleMasterToggle} />}
                        />
                    </Surface>

                    {/* ── Notification Types ─────────────────────────────── */}
                    <div>
                        <SectionLabel>Notification Types</SectionLabel>
                        <Surface>
                            <SettingRow
                                icon={RiRobot2Line}
                                title="AI Response Ready"
                                description="Get notified when a long AI response completes"
                                disabled={!notifEnabled}
                                action={
                                    <PremiumToggle
                                        checked={aiResponse}
                                        onChange={setAiResponse}
                                        disabled={!notifEnabled}
                                    />
                                }
                            />
                            <SettingRow
                                icon={RiAlertLine}
                                title="System Alerts"
                                description="Important updates, maintenance notices and announcements"
                                noBorder
                                disabled={!notifEnabled}
                                action={
                                    <PremiumToggle
                                        checked={systemAlerts}
                                        onChange={setSystemAlerts}
                                        disabled={!notifEnabled}
                                    />
                                }
                            />
                        </Surface>
                    </div>

                    {/* ── Browser permission hint ─────────────────────────── */}
                    {'Notification' in window && Notification.permission === 'denied' && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                            <RiAlertLine size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                                Browser notifications are blocked. Please allow notifications for this site in your browser settings to receive alerts.
                            </p>
                        </div>
                    )}

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

export default NotificationsSettingsPage;
