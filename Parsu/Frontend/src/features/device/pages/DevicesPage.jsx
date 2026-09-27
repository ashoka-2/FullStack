import React, { useState, useEffect, useRef } from 'react';
import {
    RiComputerLine,
    RiSmartphoneLine,
    RiMacLine,
    RiTabletLine,
    RiRefreshLine,
    RiDeleteBin6Line,
    RiCheckLine,
    RiCloseLine,
    RiLoader4Line,
    RiTimeLine,
    RiBattery2ChargeLine,
    RiCpuLine,
    RiRamLine,
    RiFlashlightLine,
    RiClipboardLine,
    RiNotificationLine,
    RiArrowGoBackLine,
    RiPlayLine,
    RiInformationLine,
    RiShieldCheckLine,
    RiEditLine,
    RiStarLine,
    RiStarFill,
    RiWifiLine,
    RiLinkM,
    RiLinksLine,
    RiChat3Line,
} from '@remixicon/react';
import SettingsPageLayout from '../../auth/pages/settings/SettingsPageLayout';
import {
    getDevicesApi,
    renameDeviceApi,
    setDefaultDeviceApi,
    unpairDeviceApi,
    executeDeviceCommandApi,
    confirmDeviceActionApi,
    undoDeviceActionApi,
    getDeviceAuditLogsApi,
    syncClipboardApi
} from '../service/device.api';
import DeviceItemizedActionBadge from '../components/DeviceItemizedActionBadge';
import DeviceConfirmActionModal from '../components/DeviceConfirmActionModal';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import { initializeSocketConnection } from '../../chat/service/chat.socket';
import gsap from 'gsap';

export default function DevicesPage() {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const containerRef = useRef(null);

    const [devices, setDevices] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Inline rename state
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);

    // Command runner
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [testAction, setTestAction] = useState('get_stats');
    const [executingCommand, setExecutingCommand] = useState(false);
    const [lastExecutionResult, setLastExecutionResult] = useState(null);

    // Confirmation modal state
    const [confirmModalData, setConfirmModalData] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Clipboard sync
    const [clipboardText, setClipboardText] = useState('');
    const [syncingClipboard, setSyncingClipboard] = useState(false);

    const loadData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [devRes, auditRes] = await Promise.all([
                getDevicesApi(),
                getDeviceAuditLogsApi({ limit: 15 })
            ]);

            if (devRes.success) {
                setDevices(devRes.devices || []);
                if (devRes.devices?.length && !selectedDevice) {
                    setSelectedDevice(devRes.devices[0]._id);
                }
            }
            if (auditRes.success) {
                setAuditLogs(auditRes.logs || []);
            }
        } catch (err) {
            console.error('Failed to load device data:', err);
            dispatch(addToast({ type: 'error', message: 'Failed to load connected devices' }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(true), 8000);

        // Listen for real-time device sync
        const socket = initializeSocketConnection();
        const handleSyncList = (updatedDevices) => {
            setDevices(updatedDevices.map(d => { delete d.deviceSecret; return d; }));
        };
        socket.on('device:sync_list', handleSyncList);
        socket.on('device:status_change', () => loadData(true));
        socket.on('device:telemetry', ({ deviceId, systemMetrics, lastSeen }) => {
            setDevices(prev => prev.map(d =>
                d._id === deviceId ? { ...d, systemMetrics, lastSeen } : d
            ));
        });

        return () => {
            clearInterval(interval);
            socket.off('device:sync_list', handleSyncList);
            socket.off('device:status_change');
            socket.off('device:telemetry');
        };
    }, []);

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
            );
        }
    }, [loading]);

    const handleStartRename = (dev) => {
        setRenamingId(dev._id);
        setRenameValue(dev.name);
    };

    const handleSaveRename = async (deviceId) => {
        if (!renameValue.trim()) return;
        setRenameLoading(true);
        try {
            const res = await renameDeviceApi(deviceId, renameValue.trim());
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Device renamed' }));
                setDevices(prev => prev.map(d => d._id === deviceId ? { ...d, name: renameValue.trim() } : d));
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to rename device' }));
        } finally {
            setRenameLoading(false);
            setRenamingId(null);
        }
    };

    const handleSetDefault = async (deviceId) => {
        try {
            const res = await setDefaultDeviceApi(deviceId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Default device updated' }));
                setDevices(prev => prev.map(d => ({ ...d, isDefault: d._id === deviceId })));
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to set default device' }));
        }
    };

    const handleUnlink = async (deviceId, name) => {
        if (!window.confirm(`Unlink "${name}" from your account? It will need to log in again to reconnect.`)) return;
        try {
            const res = await unpairDeviceApi(deviceId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: `"${name}" unlinked from your account` }));
                setDevices(prev => prev.filter(d => d._id !== deviceId));
                if (selectedDevice === deviceId) setSelectedDevice(null);
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to unlink device' }));
        }
    };

    const handleExecuteAction = async () => {
        if (!selectedDevice) {
            dispatch(addToast({ type: 'error', message: 'Please select a target device' }));
            return;
        }
        setExecutingCommand(true);
        setLastExecutionResult(null);
        try {
            let params = {};
            if (testAction === 'send_notification') {
                params = { title: 'Parsu Cross-Device Agent', message: 'Automation verified!' };
            } else if (testAction === 'write_clipboard') {
                params = { text: 'Pasted from Parsu AI Orchestrator' };
            } else if (testAction === 'close_app') {
                params = { processName: 'notepad' };
            }

            const res = await executeDeviceCommandApi({ deviceId: selectedDevice, action: testAction, params });

            if (res.requiresConfirmation) {
                setConfirmModalData({
                    auditId: res.auditId,
                    action: testAction,
                    tier: res.tier,
                    device: devices.find(d => d._id === selectedDevice),
                    params
                });
            } else {
                setLastExecutionResult({
                    status: 'completed',
                    action: testAction,
                    tier: 'read-only',
                    executionTimeMs: res.audit?.executionTimeMs || 180,
                    device: devices.find(d => d._id === selectedDevice),
                    step: 'Command completed successfully'
                });
                dispatch(addToast({ type: 'success', message: `Executed in ${res.audit?.executionTimeMs || '180'}ms` }));
                loadData(true);
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message;
            setLastExecutionResult({ status: 'failed', action: testAction, error: errMsg });
            dispatch(addToast({ type: 'error', message: errMsg }));
        } finally {
            setExecutingCommand(false);
        }
    };

    const handleConfirmAction = async (auditId) => {
        setConfirmLoading(true);
        try {
            const res = await confirmDeviceActionApi(auditId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Action authorized and executed!' }));
                setConfirmModalData(null);
                setLastExecutionResult({ status: 'completed', action: res.audit?.action, tier: res.audit?.tier, executionTimeMs: res.audit?.executionTimeMs, step: 'Authorized and executed' });
                loadData(true);
            }
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Execution failed' }));
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleUndo = async (auditId) => {
        try {
            const res = await undoDeviceActionApi(auditId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Action reversed!' }));
                loadData(true);
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Undo failed' }));
        }
    };

    const handleSyncClipboard = async () => {
        if (!clipboardText.trim()) return;
        setSyncingClipboard(true);
        try {
            const res = await syncClipboardApi({ text: clipboardText, targetDeviceId: selectedDevice });
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Clipboard synced to all paired devices!' }));
                setClipboardText('');
            }
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to sync clipboard' }));
        } finally {
            setSyncingClipboard(false);
        }
    };

    const handleRelayToDevice = (action, params = {}) => {
        if (!selectedDevice) {
            dispatch(addToast({ type: 'error', message: 'Select a target device first' }));
            return;
        }
        const socket = initializeSocketConnection();
        socket.emit('device:relay_command', {
            targetDeviceId: selectedDevice,
            action,
            params,
            senderDeviceName: 'Parsu Web'
        });
        dispatch(addToast({ type: 'success', message: 'Command relayed to device!' }));
    };

    const onlineCount = devices.filter(d => d.status === 'online').length;

    const getDeviceIcon = (dev) => {
        if (['android', 'ios'].includes(dev.platform)) return <RiSmartphoneLine size={18} className="text-emerald-400" />;
        if (dev.platform === 'macos') return <RiMacLine size={18} className="text-zinc-300" />;
        if (dev.deviceType === 'tablet') return <RiTabletLine size={18} className="text-violet-400" />;
        return <RiComputerLine size={18} className="text-[var(--accent-cyan)]" />;
    };

    return (
        <SettingsPageLayout
            title="Connected Devices"
            icon={RiLinksLine}
            description="Devices linked to your account appear here automatically — no token, no setup."
        >
            <div ref={containerRef} className="space-y-6">

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Devices', value: devices.length, color: 'text-zinc-100' },
                        { label: 'Online Now', value: onlineCount, color: 'text-emerald-400', dot: true },
                        { label: 'Avg Latency', value: '< 350ms', color: 'text-[var(--accent-cyan)] font-mono' },
                        { label: 'Security', value: '3-Tier Guard', color: 'text-emerald-400', icon: RiShieldCheckLine },
                    ].map((stat) => (
                        <div key={stat.label} className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">{stat.label}</span>
                            <div className="flex items-center gap-2">
                                {stat.dot && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                {stat.icon && <stat.icon size={13} className={stat.color} />}
                                <span className={`text-base font-bold ${stat.color}`}>{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Account-Link Info Banner */}
                <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[var(--accent-cyan)]/[0.08] to-emerald-500/[0.06] border border-[var(--accent-cyan)]/20">
                    <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <h3 className="text-xs sm:text-sm font-bold text-white">Zero-Setup Account Sync</h3>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Spotify Connect Style</span>
                            </div>
                            <p className="text-xs text-zinc-300/90 leading-relaxed">
                                Any device logged into <strong className="text-[var(--accent-cyan)]">{user?.email || 'your account'}</strong> appears here automatically. Open the Parsu app, log in — done. No token to copy, no command to paste.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href="/chat"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-semibold hover:bg-[var(--accent-cyan)]/25 transition-all cursor-pointer"
                                title="Control devices via AI chat"
                            >
                                <RiChat3Line size={14} />
                                Control via Chat
                            </a>
                        </div>
                    </div>
                </div>

                {/* Linked Devices */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <RiLinkM size={15} className="text-[var(--accent-cyan)]" />
                                Linked Devices
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Click a device to select it as a command target. Set one as your default.</p>
                        </div>
                        <button
                            onClick={() => { setRefreshing(true); loadData(true); }}
                            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                            title="Refresh device states"
                        >
                            <RiRefreshLine size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                            <RiLoader4Line size={24} className="animate-spin text-[var(--accent-cyan)]" />
                            <span>Discovering your linked devices...</span>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6">
                            <RiWifiLine size={36} className="mx-auto text-zinc-500 mb-3 opacity-50" />
                            <h3 className="text-sm font-semibold text-zinc-300">No devices linked yet</h3>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                                Open the Parsu desktop or mobile app and log into this account. This device will appear here instantly — no setup needed.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {devices.map((dev) => {
                                const isSelected = selectedDevice === dev._id;
                                const isOnline = dev.status === 'online';
                                const isRenaming = renamingId === dev._id;

                                return (
                                    <div
                                        key={dev._id}
                                        onClick={() => !isRenaming && setSelectedDevice(dev._id)}
                                        className={`rounded-xl p-4 border transition-all cursor-pointer relative group ${
                                            isSelected
                                                ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/[0.03] shadow-lg shadow-[var(--accent-cyan)]/5'
                                                : 'border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] bg-zinc-50/50 dark:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="w-9 h-9 rounded-xl bg-zinc-200/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                                                    {getDeviceIcon(dev)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    {isRenaming ? (
                                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                autoFocus
                                                                value={renameValue}
                                                                onChange={e => setRenameValue(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(dev._id); if (e.key === 'Escape') setRenamingId(null); }}
                                                                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-[var(--accent-cyan)]/50 rounded-lg px-2 py-0.5 text-xs text-zinc-100 outline-none focus:border-[var(--accent-cyan)] min-w-0"
                                                            />
                                                            <button
                                                                onClick={() => handleSaveRename(dev._id)}
                                                                disabled={renameLoading}
                                                                className="p-1 rounded-lg bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 transition-all cursor-pointer"
                                                            >
                                                                {renameLoading ? <RiLoader4Line size={13} className="animate-spin" /> : <RiCheckLine size={13} />}
                                                            </button>
                                                            <button
                                                                onClick={() => setRenamingId(null)}
                                                                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
                                                            >
                                                                <RiCloseLine size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">{dev.name}</h3>
                                                            <span className="text-[9px] font-mono px-1 py-px rounded uppercase bg-zinc-200 dark:bg-white/[0.06] text-zinc-400">{dev.platform}</span>
                                                            {dev.isDefault && (
                                                                <span className="text-[9px] font-bold px-1 py-px rounded bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20">Default</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                                        <span className="text-[11px] text-zinc-400 capitalize">{dev.status}</span>
                                                        <span className="text-zinc-600">·</span>
                                                        <span className="text-[11px] text-zinc-500">{dev.deviceType}</span>
                                                        {dev.lastSeen && (
                                                            <>
                                                                <span className="text-zinc-600">·</span>
                                                                <span className="text-[10px] text-zinc-600">{new Date(dev.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Device Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                {/* Rename */}
                                                <button
                                                    onClick={() => handleStartRename(dev)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all cursor-pointer"
                                                    title="Rename device"
                                                >
                                                    <RiEditLine size={14} />
                                                </button>
                                                {/* Set as default */}
                                                <button
                                                    onClick={() => handleSetDefault(dev._id)}
                                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${dev.isDefault ? 'text-amber-400 hover:bg-amber-400/10' : 'text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10'}`}
                                                    title={dev.isDefault ? 'Current default device' : 'Set as default device'}
                                                >
                                                    {dev.isDefault ? <RiStarFill size={14} /> : <RiStarLine size={14} />}
                                                </button>
                                                {/* Unlink */}
                                                <button
                                                    onClick={() => handleUnlink(dev._id, dev.name)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                    title="Unlink this device"
                                                >
                                                    <RiDeleteBin6Line size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Telemetry Metrics */}
                                        {isOnline && dev.systemMetrics && (
                                            <div className="mt-3.5 pt-3 border-t border-zinc-200/50 dark:border-white/[0.04] grid grid-cols-3 gap-2 text-center">
                                                {[
                                                    { icon: RiCpuLine, label: 'CPU', value: `${dev.systemMetrics.cpuUsagePercent || 0}%` },
                                                    { icon: RiRamLine, label: 'RAM', value: dev.systemMetrics.ramUsageMb ? `${Math.round(dev.systemMetrics.ramUsageMb / 1024)}GB` : 'N/A' },
                                                    { icon: RiBattery2ChargeLine, label: 'Battery', value: `${dev.systemMetrics.batteryPercent ?? 100}%` },
                                                ].map(m => (
                                                    <div key={m.label} className="bg-zinc-100 dark:bg-white/[0.03] p-1.5 rounded-lg">
                                                        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mb-0.5">
                                                            <m.icon size={10} /> {m.label}
                                                        </div>
                                                        <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{m.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_6px_rgba(32,184,205,0.6)]" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Automation Dispatcher */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                        <RiFlashlightLine size={16} className="text-amber-400" />
                        Quick Automation Dispatcher
                    </h2>
                    <p className="text-xs text-zinc-500 mb-4">
                        Test instant OS commands on the selected companion device. You can also just ask the AI in chat!
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                            value={testAction}
                            onChange={(e) => setTestAction(e.target.value)}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.08] text-xs rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)] font-mono"
                        >
                            <option value="get_stats">System Telemetry & Stats (Read-Only)</option>
                            <option value="list_processes">List Running Processes (Read-Only)</option>
                            <option value="take_screenshot">Take Instant Screenshot (Read-Only)</option>
                            <option value="read_clipboard">Read System Clipboard (Read-Only)</option>
                            <option value="send_notification">Send Native OS Notification (Mutating)</option>
                            <option value="write_clipboard">Write to Clipboard (Mutating)</option>
                            <option value="close_app">Close Notepad (Destructive – Asks Permission)</option>
                        </select>

                        <button
                            onClick={handleExecuteAction}
                            disabled={executingCommand || !selectedDevice}
                            className="px-4 py-2 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {executingCommand ? (
                                <><RiLoader4Line size={14} className="animate-spin" /> Dispatching...</>
                            ) : (
                                <><RiPlayLine size={14} /> Execute Command</>
                            )}
                        </button>
                    </div>

                    {lastExecutionResult && (
                        <div className="mt-4">
                            <DeviceItemizedActionBadge
                                {...lastExecutionResult}
                                onConfirm={(auditId) => handleConfirmAction(auditId)}
                                onUndo={handleUndo}
                            />
                        </div>
                    )}
                </div>

                {/* Universal Clipboard Sync */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                        <RiClipboardLine size={16} className="text-emerald-400" />
                        Universal Clipboard Sync
                    </h2>
                    <p className="text-xs text-zinc-500 mb-3">Broadcast text instantly across all your connected devices.</p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={clipboardText}
                            onChange={(e) => setClipboardText(e.target.value)}
                            placeholder="Type or paste text to sync across linked devices..."
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.08] text-xs rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)]"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSyncClipboard(); }}
                        />
                        <button
                            onClick={handleSyncClipboard}
                            disabled={syncingClipboard || !clipboardText.trim()}
                            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {syncingClipboard ? 'Syncing...' : 'Sync'}
                        </button>
                    </div>
                </div>

                {/* Audit Log */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <RiTimeLine size={16} className="text-zinc-400" />
                                Action Audit Log
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Live record of every automation command, duration, and safety status.</p>
                        </div>
                    </div>

                    {auditLogs.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-4 text-center">No commands executed yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-200/60 dark:border-white/[0.06] text-zinc-400">
                                        <th className="pb-2 font-medium">Time</th>
                                        <th className="pb-2 font-medium">Action</th>
                                        <th className="pb-2 font-medium">Tier</th>
                                        <th className="pb-2 font-medium">ms</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 font-medium text-right">Undo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/40 dark:divide-white/[0.04]">
                                    {auditLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                            <td className="py-2.5 text-zinc-400 font-mono text-[11px]">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </td>
                                            <td className="py-2.5 font-mono text-[var(--accent-cyan)] text-[11px]">{log.action}</td>
                                            <td className="py-2.5">
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                    log.tier === 'destructive' ? 'bg-rose-500/10 text-rose-400' :
                                                    log.tier === 'mutating' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                                }`}>{log.tier}</span>
                                            </td>
                                            <td className="py-2.5 font-mono text-zinc-400 text-[11px]">
                                                {log.executionTimeMs ? `${log.executionTimeMs}` : '—'}
                                            </td>
                                            <td className="py-2.5">
                                                <span className={`capitalize text-[11px] ${log.status === 'completed' ? 'text-emerald-400' : log.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right">
                                                {log.canUndo && !log.undone ? (
                                                    <button
                                                        onClick={() => handleUndo(log._id)}
                                                        className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                                                    >
                                                        <RiArrowGoBackLine size={11} /> Undo
                                                    </button>
                                                ) : log.undone ? (
                                                    <span className="text-[10px] text-zinc-500">Reversed</span>
                                                ) : (
                                                    <span className="text-zinc-700">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* Confirmation Modal */}
            <DeviceConfirmActionModal
                isOpen={!!confirmModalData}
                onClose={() => setConfirmModalData(null)}
                onConfirm={handleConfirmAction}
                auditData={confirmModalData}
                loading={confirmLoading}
            />
        </SettingsPageLayout>
    );
}
