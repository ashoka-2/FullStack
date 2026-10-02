/**
 * DeviceSyncBanner — Account-linked device info banner + notification permission prompt
 */
import React, { useState, useEffect } from 'react';
import { RiCheckLine, RiBellLine, RiNotificationOffLine, RiChat3Line } from '@remixicon/react';
import PrimaryButton from '../../Components/PrimaryButton';

export default function DeviceSyncBanner({ userEmail, onlineCount }) {
    const [notifStatus, setNotifStatus] = useState('default'); // 'default' | 'granted' | 'denied'
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotifStatus(Notification.permission);
        }
    }, []);

    async function requestNotifications() {
        if (!('Notification' in window)) return;
        setRequesting(true);
        const perm = await Notification.requestPermission();
        setNotifStatus(perm);
        setRequesting(false);
    }

    return (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[var(--accent-cyan)]/[0.08] to-emerald-500/[0.06] border border-[var(--accent-cyan)]/20 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--accent-cyan)]/5 blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap relative">
                <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="text-xs sm:text-sm font-bold text-white">Account-Linked Device Sync</h3>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Zero Setup
                        </span>
                    </div>
                    <p className="text-xs text-zinc-300/90 leading-relaxed max-w-xl">
                        Every device logged into{' '}
                        <strong className="text-[var(--accent-cyan)]">{userEmail || 'your account'}</strong>{' '}
                        syncs automatically in real-time — no token, no pairing code.
                        {onlineCount > 0 && (
                            <span className="text-emerald-400 font-semibold"> {onlineCount} device{onlineCount > 1 ? 's' : ''} online now.</span>
                        )}
                    </p>
                </div>

                {/* Right-side actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Notification permission button */}
                    {notifStatus === 'default' && (
                        <PrimaryButton
                            onClick={requestNotifications}
                            disabled={requesting}
                            loading={requesting}
                            size="xs"
                            icon={RiBellLine}
                            iconPosition="left"
                            className="whitespace-nowrap"
                        >
                            Enable Notifications
                        </PrimaryButton>
                    )}
                    {notifStatus === 'granted' && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <RiCheckLine size={13} /> Notifications On
                        </span>
                    )}
                    {notifStatus === 'denied' && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-zinc-500 text-xs">
                            <RiNotificationOffLine size={13} /> Notifications blocked
                        </span>
                    )}

                    {/* Chat shortcut */}
                    <a
                        href="/chat"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 text-xs font-medium hover:bg-white/[0.10] transition-all cursor-pointer whitespace-nowrap"
                    >
                        <RiChat3Line size={13} /> Control via Chat
                    </a>
                </div>
            </div>
        </div>
    );
}
