/**
 * DevicesPage — thin orchestrator
 *
 * All heavy UI logic lives in components:
 *   DeviceStatsBar, DeviceSyncBanner, DeviceCard, DeviceAutomationPanel,
 *   DeviceClipboardSync, DeviceAuditLog, DeviceConfirmActionModal
 *
 * State management lives in:
 *   useDeviceSync hook
 */
import React, { useState, useRef, useEffect } from 'react';
import { RiLinksLine, RiRefreshLine, RiLoader4Line, RiWifiLine } from '@remixicon/react';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import gsap from 'gsap';

import SettingsPageLayout from '../../auth/pages/settings/SettingsPageLayout';
import { useDeviceSync } from '../hooks/useDeviceSync';
import DeviceStatsBar from '../components/DeviceStatsBar';
import DeviceSyncBanner from '../components/DeviceSyncBanner';
import DeviceCard from '../components/DeviceCard';
import DeviceAutomationPanel from '../components/DeviceAutomationPanel';
import DeviceClipboardSync from '../components/DeviceClipboardSync';
import DeviceAuditLog from '../components/DeviceAuditLog';
import DeviceConfirmActionModal from '../components/DeviceConfirmActionModal';

import {
    renameDeviceApi,
    setDefaultDeviceApi,
    unpairDeviceApi,
    executeDeviceCommandApi,
    confirmDeviceActionApi,
    undoDeviceActionApi,
    syncClipboardApi,
} from '../service/device.api';
import { initializeSocketConnection } from '../../chat/service/chat.socket';

export default function DevicesPage() {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const containerRef = useRef(null);

    const { devices, setDevices, auditLogs, setAuditLogs, loading, refreshing, refresh, loadData } = useDeviceSync();

    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [confirmData, setConfirmData] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Auto-select first device when list loads
    useEffect(() => {
        if (devices.length && !selectedDeviceId) {
            setSelectedDeviceId(devices[0]._id);
        }
    }, [devices]);

    // GSAP entrance animation on first load
    useEffect(() => {
        if (!loading && containerRef.current?.children?.length) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' }
            );
        }
    }, [loading]);

    // ─── Device management handlers ─────────────────────────────────────────
    async function handleRename(deviceId, name) {
        try {
            const res = await renameDeviceApi(deviceId, name);
            if (res.success) {
                setDevices(prev => prev.map(d => d._id === deviceId ? { ...d, name } : d));
                dispatch(addToast({ type: 'success', message: 'Device renamed' }));
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Rename failed' }));
        }
    }

    async function handleSetDefault(deviceId) {
        try {
            const res = await setDefaultDeviceApi(deviceId);
            if (res.success) {
                setDevices(prev => prev.map(d => ({ ...d, isDefault: d._id === deviceId })));
                dispatch(addToast({ type: 'success', message: 'Default device updated' }));
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Could not set default device' }));
        }
    }

    async function handleUnlink(deviceId, name) {
        if (!window.confirm(`Unlink "${name}"? It will re-appear automatically next time it logs in.`)) return;
        try {
            const res = await unpairDeviceApi(deviceId);
            if (res.success) {
                setDevices(prev => prev.filter(d => d._id !== deviceId));
                if (selectedDeviceId === deviceId) setSelectedDeviceId(null);
                dispatch(addToast({ type: 'success', message: `"${name}" unlinked` }));
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to unlink device' }));
        }
    }

    // ─── Command execution ───────────────────────────────────────────────────
    async function handleExecute(action) {
        if (!selectedDeviceId) {
            dispatch(addToast({ type: 'error', message: 'Select a device first' }));
            return;
        }
        setExecuting(true);
        setLastResult(null);

        // Build params per action type
        const PARAMS = {
            send_notification: { title: 'Parsu AI', message: 'Cross-device command received!' },
            write_clipboard:   { text: 'Copied from Parsu AI' },
            close_app:         { processName: 'notepad' },
            launch_app:        { appName: 'notepad' },
            open_url:          { url: 'https://parsuai.vercel.app' },
            window_control:    { windowTitle: 'Notepad', windowAction: 'minimize' },
            simulate_input:    { type: 'text', payload: 'Hello from Parsu AI!' },
        };

        try {
            const res = await executeDeviceCommandApi({
                deviceId: selectedDeviceId,
                action,
                params: PARAMS[action] || {}
            });

            if (res.requiresConfirmation) {
                setConfirmData({
                    auditId: res.auditId,
                    action,
                    tier: res.tier,
                    device: devices.find(d => d._id === selectedDeviceId),
                    params: PARAMS[action] || {}
                });
            } else {
                setLastResult({
                    status: 'completed',
                    action,
                    tier: 'read-only',
                    executionTimeMs: res.audit?.executionTimeMs ?? 180,
                    device: devices.find(d => d._id === selectedDeviceId),
                    step: 'Command completed'
                });
                dispatch(addToast({ type: 'success', message: `Done in ${res.audit?.executionTimeMs ?? 180}ms` }));
                loadData(true);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setLastResult({ status: 'failed', action, error: msg });
            dispatch(addToast({ type: 'error', message: msg }));
        } finally {
            setExecuting(false);
        }
    }

    async function handleConfirm(auditId) {
        setConfirmLoading(true);
        try {
            const res = await confirmDeviceActionApi(auditId);
            if (res.success) {
                setConfirmData(null);
                setLastResult({
                    status: 'completed',
                    action: res.audit?.action,
                    tier: res.audit?.tier,
                    executionTimeMs: res.audit?.executionTimeMs,
                    step: 'Authorized and executed'
                });
                dispatch(addToast({ type: 'success', message: 'Action authorized!' }));
                loadData(true);
            }
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Execution failed' }));
        } finally {
            setConfirmLoading(false);
        }
    }

    async function handleUndo(auditId) {
        try {
            const res = await undoDeviceActionApi(auditId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Action reversed!' }));
                loadData(true);
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Undo failed' }));
        }
    }

    // ─── Clipboard sync via socket + REST ────────────────────────────────────
    async function handleClipboardSync(text) {
        // Immediately broadcast via socket for online devices
        const socket = initializeSocketConnection();
        socket.emit('device:clipboard_sync', { text });

        // Also persist via REST for offline devices
        try {
            const res = await syncClipboardApi({ text, targetDeviceId: selectedDeviceId });
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Clipboard broadcast to all linked devices!' }));
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Clipboard sync failed' }));
        }
    }

    const onlineCount = devices.filter(d => d.status === 'online').length;

    return (
        <SettingsPageLayout
            title="Connected Devices"
            icon={RiLinksLine}
            description="Devices linked to your account — desktop, mobile, tablet, anywhere."
        >
            <div ref={containerRef} className="space-y-6">

                {/* Stats */}
                <DeviceStatsBar devices={devices} />

                {/* Account-sync info banner + notification permission */}
                <DeviceSyncBanner userEmail={user?.email} onlineCount={onlineCount} />

                {/* Device grid */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <RiLinksLine size={15} className="text-[var(--accent-cyan)]" />
                                Linked Devices
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Click a device to target it. Hover to rename, star, or unlink.
                            </p>
                        </div>
                        <button
                            onClick={refresh}
                            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                            title="Refresh"
                        >
                            <RiRefreshLine size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center gap-2 text-zinc-400 text-xs">
                            <RiLoader4Line size={24} className="animate-spin text-[var(--accent-cyan)]" />
                            <span>Discovering linked devices…</span>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl">
                            <RiWifiLine size={36} className="mx-auto text-zinc-500 mb-3 opacity-40" />
                            <h3 className="text-sm font-semibold text-zinc-300">No devices linked yet</h3>
                            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1.5">
                                Open the Parsu app on any device and log in — it will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {devices.map(dev => (
                                <DeviceCard
                                    key={dev._id}
                                    device={dev}
                                    isSelected={selectedDeviceId === dev._id}
                                    onSelect={setSelectedDeviceId}
                                    onRename={handleRename}
                                    onSetDefault={handleSetDefault}
                                    onUnlink={handleUnlink}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Automation dispatcher */}
                <DeviceAutomationPanel
                    selectedDeviceId={selectedDeviceId}
                    devices={devices}
                    onExecute={handleExecute}
                    onConfirm={handleConfirm}
                    onUndo={handleUndo}
                    lastResult={lastResult}
                    executing={executing}
                />

                {/* Universal clipboard */}
                <DeviceClipboardSync onSync={handleClipboardSync} />

                {/* Audit log */}
                <DeviceAuditLog logs={auditLogs} onUndo={handleUndo} />

            </div>

            {/* Confirmation modal (mutating / destructive actions) */}
            <DeviceConfirmActionModal
                isOpen={!!confirmData}
                onClose={() => setConfirmData(null)}
                onConfirm={handleConfirm}
                auditData={confirmData}
                loading={confirmLoading}
            />
        </SettingsPageLayout>
    );
}
