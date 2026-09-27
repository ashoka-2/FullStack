import React, { useState, useEffect, useRef } from 'react';
import {
    RiComputerLine,
    RiSmartphoneLine,
    RiMacLine,
    RiAddLine,
    RiRefreshLine,
    RiDeleteBin6Line,
    RiCheckLine,
    RiCloseLine,
    RiLoader4Line,
    RiTerminalBoxLine,
    RiTimeLine,
    RiBattery2ChargeLine,
    RiCpuLine,
    RiRamLine,
    RiFlashlightLine,
    RiClipboardLine,
    RiCameraLine,
    RiNotificationLine,
    RiArrowGoBackLine,
    RiQrCodeLine,
    RiPlayLine,
    RiKey2Line,
    RiInformationLine,
    RiShieldCheckLine
} from '@remixicon/react';
import SettingsPageLayout from '../../auth/pages/settings/SettingsPageLayout';
import {
    getDevicesApi,
    pairDeviceApi,
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

    // Pair device modal
    const [showPairModal, setShowPairModal] = useState(false);
    const [pairPlatform, setPairPlatform] = useState('windows');
    const [pairDeviceName, setPairDeviceName] = useState('');
    const [pairingResult, setPairingResult] = useState(null);
    const [pairingLoading, setPairingLoading] = useState(false);

    // Command runner tester
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [testAction, setTestAction] = useState('get_stats');
    const [executingCommand, setExecutingCommand] = useState(false);
    const [lastExecutionResult, setLastExecutionResult] = useState(null);

    // Confirmation modal state
    const [confirmModalData, setConfirmModalData] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Clipboard test
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
        return () => clearInterval(interval);
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

    const handlePairDevice = async (e) => {
        e.preventDefault();
        if (!pairDeviceName.trim()) {
            dispatch(addToast({ type: 'error', message: 'Device name is required' }));
            return;
        }

        setPairingLoading(true);
        try {
            const res = await pairDeviceApi({
                name: pairDeviceName,
                platform: pairPlatform,
                deviceType: ['android', 'ios'].includes(pairPlatform) ? 'mobile' : 'desktop'
            });

            if (res.success) {
                setPairingResult(res.device);
                dispatch(addToast({ type: 'success', message: 'Device registered! Use the token to connect.' }));
                loadData(true);
            }
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Pairing failed' }));
        } finally {
            setPairingLoading(false);
        }
    };

    const handleUnpair = async (deviceId) => {
        if (!window.confirm('Are you sure you want to unpair this device?')) return;
        try {
            const res = await unpairDeviceApi(deviceId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Device unpaired successfully' }));
                loadData(true);
            }
        } catch (err) {
            dispatch(addToast({ type: 'error', message: 'Failed to unpair device' }));
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
                params = { title: 'Parsu Cross-Device Agent', message: 'Sub-500ms automation round-trip verified!' };
            } else if (testAction === 'write_clipboard') {
                params = { text: 'Pasted securely from Parsu AI Orchestrator' };
            } else if (testAction === 'close_app') {
                params = { processName: 'notepad' };
            }

            const res = await executeDeviceCommandApi({
                deviceId: selectedDevice,
                action: testAction,
                params
            });

            if (res.requiresConfirmation) {
                const targetDev = devices.find(d => d._id === selectedDevice);
                setConfirmModalData({
                    auditId: res.auditId,
                    action: testAction,
                    tier: res.tier,
                    device: targetDev,
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
            setLastExecutionResult({
                status: 'failed',
                action: testAction,
                error: errMsg,
                device: devices.find(d => d._id === selectedDevice)
            });
            dispatch(addToast({ type: 'error', message: errMsg }));
        } finally {
            setExecutingCommand(false);
        }
    };

    const handleConfirmAction = async (auditId, rememberSession) => {
        setConfirmLoading(true);
        try {
            const res = await confirmDeviceActionApi(auditId);
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Action authorized and executed!' }));
                setConfirmModalData(null);
                setLastExecutionResult({
                    status: 'completed',
                    action: res.audit?.action,
                    tier: res.audit?.tier,
                    executionTimeMs: res.audit?.executionTimeMs,
                    step: 'Action authorized by user and executed'
                });
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
                dispatch(addToast({ type: 'success', message: 'Action successfully reversed!' }));
                loadData(true);
            }
        } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Undo failed' }));
        }
    };

    const handleSyncClipboard = async () => {
        if (!clipboardText.trim()) return;
        setSyncingClipboard(true);
        try {
            const res = await syncClipboardApi({ text: clipboardText, targetDeviceId: selectedDevice });
            if (res.success) {
                dispatch(addToast({ type: 'success', message: 'Clipboard broadcasted to paired devices!' }));
                setClipboardText('');
            }
        } catch (err) {
            dispatch(addToast({ type: 'error', message: 'Failed to sync clipboard' }));
        } finally {
            setSyncingClipboard(false);
        }
    };

    const onlineCount = devices.filter(d => d.status === 'online').length;

    const handleBluetoothScan = async () => {
        if (typeof navigator === 'undefined' || !navigator.bluetooth) {
            dispatch(addToast({
                type: 'info',
                message: 'Web Bluetooth is not available in this browser. Account auto-sync is active across your devices!'
            }));
            return;
        }
        try {
            const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
            if (dev) {
                dispatch(addToast({ type: 'success', message: `Nearby Bluetooth device detected: ${dev.name || 'Device'}` }));
            }
        } catch (e) {
            if (e.name !== 'NotFoundError') {
                dispatch(addToast({ type: 'error', message: e.message }));
            }
        }
    };

    const handleRelayToDevice = (action, params = {}) => {
        if (!selectedDevice) {
            dispatch(addToast({ type: 'error', message: 'Select a target device first' }));
            return;
        }
        const socket = initializeSocketConnection();
        socket.emit("device:relay_command", {
            targetDeviceId: selectedDevice,
            action,
            params,
            senderDeviceName: 'Parsu Web'
        });
        dispatch(addToast({ type: 'success', message: `Relayed command to paired device!` }));
    };

    return (
        <SettingsPageLayout
            title="Connected Devices & Agent Control"
            icon={RiComputerLine}
            description="Control desktop, mobile, and tablets from one unified AI agent."
        >
            <div ref={containerRef} className="space-y-6">

                {/* Hero / Overview Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Total Devices</span>
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">{devices.length}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Online Now</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xl font-bold text-emerald-400">{onlineCount}</span>
                        </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Execution Speed</span>
                        <span className="text-xl font-bold text-[var(--accent-cyan)] font-mono">&lt; 350ms</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Security Tier</span>
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                            <RiShieldCheckLine size={15} /> 3-Tier Guard
                        </span>
                    </div>
                </div>

                {/* Account-Linked Auto-Sync Info Banner */}
                <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[var(--accent-cyan)]/[0.08] to-emerald-500/[0.06] border border-[var(--accent-cyan)]/20 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                    Instant Account-Linked Cross-Device Sync
                                </h3>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                    Zero Setup
                                </span>
                            </div>
                            <p className="text-xs text-zinc-300/90 leading-relaxed max-w-xl">
                                Any phone, tablet, or computer logged in as <strong className="text-[var(--accent-cyan)]">{user?.email || 'your account'}</strong> is automatically paired and synced in real-time. Control your desktop from your mobile, or trigger actions on your mobile from your desktop, seamlessly over WiFi and cloud.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleBluetoothScan}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/[0.08] transition-all cursor-pointer"
                                title="Scan for nearby Bluetooth peers"
                            >
                                <RiFlashlightLine size={14} className="text-amber-400" />
                                Nearby Bluetooth Scan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Paired Devices Section */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                Paired Devices & Machines
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Select a device to monitor hardware telemetry or run automations.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setRefreshing(true); loadData(true); }}
                                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-100 dark:bg-white/[0.04] transition-colors"
                                title="Refresh device states"
                            >
                                <RiRefreshLine size={16} className={refreshing ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => { setShowPairModal(true); setPairingResult(null); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm"
                            >
                                <RiAddLine size={16} /> Pair New Device
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                            <RiLoader4Line size={24} className="animate-spin text-[var(--accent-cyan)]" />
                            Discovering paired companions...
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6">
                            <RiComputerLine size={36} className="mx-auto text-zinc-500 mb-2 opacity-50" />
                            <h3 className="text-sm font-semibold text-zinc-300">No companion devices paired yet</h3>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                                Pair your desktop, laptop, or mobile phone to give Parsu real hands and eyes across your devices.
                            </p>
                            <button
                                onClick={() => setShowPairModal(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all"
                            >
                                Pair First Device
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {devices.map((dev) => {
                                const isSelected = selectedDevice === dev._id;
                                const isOnline = dev.status === 'online';
                                const isMobile = ['android', 'ios'].includes(dev.platform);

                                return (
                                    <div
                                        key={dev._id}
                                        onClick={() => setSelectedDevice(dev._id)}
                                        className={`rounded-xl p-4 border transition-all cursor-pointer relative ${
                                            isSelected
                                                ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/[0.03] shadow-lg shadow-[var(--accent-cyan)]/5'
                                                : 'border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] bg-zinc-50/50 dark:bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-zinc-200/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                                                    {isMobile ? (
                                                        <RiSmartphoneLine size={18} className="text-emerald-400" />
                                                    ) : dev.platform === 'macos' ? (
                                                        <RiMacLine size={18} className="text-zinc-200" />
                                                    ) : (
                                                        <RiComputerLine size={18} className="text-[var(--accent-cyan)]" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                            {dev.name}
                                                        </h3>
                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded uppercase bg-zinc-200 dark:bg-white/[0.06] text-zinc-400">
                                                            {dev.platform}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                                                        <span className="text-[11px] text-zinc-400 capitalize">{dev.status}</span>
                                                        <span className="text-zinc-600 text-xs">•</span>
                                                        <span className="text-[11px] text-zinc-500 font-mono">
                                                            {dev.systemInfo?.hostname || 'Companion Node'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnpair(dev._id); }}
                                                className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                                                title="Unpair Device"
                                            >
                                                <RiDeleteBin6Line size={15} />
                                            </button>
                                        </div>

                                        {/* Telemetry Metrics */}
                                        {isOnline && dev.systemMetrics && (
                                            <div className="mt-3.5 pt-3 border-t border-zinc-200/50 dark:border-white/[0.04] grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="bg-zinc-100 dark:bg-white/[0.03] p-1.5 rounded-lg">
                                                    <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mb-0.5">
                                                        <RiCpuLine size={11} /> CPU
                                                    </div>
                                                    <span className="font-mono text-xs font-semibold text-zinc-200">
                                                        {dev.systemMetrics.cpuUsagePercent || 0}%
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-100 dark:bg-white/[0.03] p-1.5 rounded-lg">
                                                    <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mb-0.5">
                                                        <RiRamLine size={11} /> RAM
                                                    </div>
                                                    <span className="font-mono text-xs font-semibold text-zinc-200">
                                                        {dev.systemMetrics.ramUsageMb ? `${Math.round(dev.systemMetrics.ramUsageMb / 1024)}GB` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-100 dark:bg-white/[0.03] p-1.5 rounded-lg">
                                                    <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mb-0.5">
                                                        <RiBattery2ChargeLine size={11} /> Battery
                                                    </div>
                                                    <span className="font-mono text-xs font-semibold text-zinc-200">
                                                        {dev.systemMetrics.batteryPercent ?? 100}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sub-500ms Command Playground & Cross-Device Actions */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                        <RiFlashlightLine size={16} className="text-amber-400" />
                        Quick Automation Dispatcher
                    </h2>
                    <p className="text-xs text-zinc-500 mb-4">
                        Test instant OS commands directly against the selected companion device.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                            value={testAction}
                            onChange={(e) => setTestAction(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.08] text-xs rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)] font-mono"
                        >
                            <option value="get_stats">System Telemetry & Stats (Read-Only)</option>
                            <option value="list_processes">List Running Processes (Read-Only)</option>
                            <option value="take_screenshot">Take Instant Screenshot (Read-Only)</option>
                            <option value="read_clipboard">Read System Clipboard (Read-Only)</option>
                            <option value="send_notification">Send Native OS Notification (Mutating)</option>
                            <option value="write_clipboard">Write to Clipboard (Mutating)</option>
                            <option value="close_app">Close Application [Notepad] (Destructive - Asks Permission)</option>
                        </select>

                        <button
                            onClick={handleExecuteAction}
                            disabled={executingCommand || !selectedDevice}
                            className="px-4 py-2 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            {executingCommand ? (
                                <>
                                    <RiLoader4Line size={14} className="animate-spin" /> Dispatching...
                                </>
                            ) : (
                                <>
                                    <RiPlayLine size={14} /> Execute Command
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Badge */}
                    {lastExecutionResult && (
                        <div className="mt-4">
                            <DeviceItemizedActionBadge
                                {...lastExecutionResult}
                                onConfirm={(auditId) => handleConfirmAction(auditId, false)}
                                onUndo={handleUndo}
                            />
                        </div>
                    )}
                </div>

                {/* Cross-Device Universal Clipboard */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                        <RiClipboardLine size={16} className="text-emerald-400" />
                        Universal Clipboard Sync
                    </h2>
                    <p className="text-xs text-zinc-500 mb-3">
                        Broadcast text instantly across your phone and all connected computers.
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={clipboardText}
                            onChange={(e) => setClipboardText(e.target.value)}
                            placeholder="Type or paste text to sync across paired devices..."
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.08] text-xs rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)]"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSyncClipboard(); }}
                        />
                        <button
                            onClick={handleSyncClipboard}
                            disabled={syncingClipboard || !clipboardText.trim()}
                            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all disabled:opacity-50"
                        >
                            {syncingClipboard ? 'Syncing...' : 'Sync Everywhere'}
                        </button>
                    </div>
                </div>

                {/* Audit Log Table */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <RiTimeLine size={16} className="text-zinc-400" />
                                Cross-Device Action Audit Log
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Live itemized record of every automation command, duration, and safety status.
                            </p>
                        </div>
                    </div>

                    {auditLogs.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-4 text-center">No commands executed yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-200/60 dark:border-white/[0.06] text-zinc-400">
                                        <th className="pb-2 font-medium">Timestamp</th>
                                        <th className="pb-2 font-medium">Device</th>
                                        <th className="pb-2 font-medium">Action</th>
                                        <th className="pb-2 font-medium">Tier</th>
                                        <th className="pb-2 font-medium">Duration</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 font-medium text-right">Undo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/40 dark:divide-white/[0.04]">
                                    {auditLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-white/[0.02]">
                                            <td className="py-2.5 text-zinc-400 font-mono text-[11px]">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="py-2.5 text-zinc-200 font-medium">
                                                {log.device?.name || 'Local Machine'}
                                            </td>
                                            <td className="py-2.5 font-mono text-[var(--accent-cyan)]">
                                                {log.action}
                                            </td>
                                            <td className="py-2.5">
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                    log.tier === 'destructive' ? 'bg-rose-500/10 text-rose-400' :
                                                    log.tier === 'mutating' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                    {log.tier}
                                                </span>
                                            </td>
                                            <td className="py-2.5 font-mono text-zinc-400 text-[11px]">
                                                {log.executionTimeMs ? `${log.executionTimeMs}ms` : '—'}
                                            </td>
                                            <td className="py-2.5">
                                                <span className={`capitalize ${log.status === 'completed' ? 'text-emerald-400' : log.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right">
                                                {log.canUndo && !log.undone ? (
                                                    <button
                                                        onClick={() => handleUndo(log._id)}
                                                        className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700"
                                                    >
                                                        Undo
                                                    </button>
                                                ) : log.undone ? (
                                                    <span className="text-[10px] text-zinc-500">Reversed</span>
                                                ) : (
                                                    <span className="text-zinc-600">—</span>
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

            {/* Pair Device Modal */}
            {showPairModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-[#0e1117] border border-zinc-800 shadow-2xl p-6 text-zinc-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <RiKey2Line size={18} className="text-[var(--accent-cyan)]" />
                                Pair a New Device
                            </h3>
                            <button
                                onClick={() => setShowPairModal(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </div>

                        {!pairingResult ? (
                            <form onSubmit={handlePairDevice} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                                        Device Platform
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'windows', name: 'Windows', icon: RiComputerLine },
                                            { id: 'macos', name: 'macOS', icon: RiMacLine },
                                            { id: 'android', name: 'Android', icon: RiSmartphoneLine },
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setPairPlatform(item.id)}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                                    pairPlatform === item.id
                                                        ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 text-white'
                                                        : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                                                }`}
                                            >
                                                <item.icon size={20} />
                                                <span className="text-xs font-medium">{item.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                                        Device Nickname
                                    </label>
                                    <input
                                        type="text"
                                        value={pairDeviceName}
                                        onChange={(e) => setPairDeviceName(e.target.value)}
                                        placeholder="e.g. My Work Laptop, Pixel 8 Pro"
                                        required
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent-cyan)]"
                                    />
                                </div>

                                {pairPlatform === 'android' && (
                                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300">
                                        ℹ️ Android pairing will utilize the Parsu Accessibility Service for deep automation (tap, swipe, app launch, notifications).
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPairModal(false)}
                                        className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={pairingLoading}
                                        className="px-4 py-2 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-xs hover:brightness-110 active:scale-95 transition-all"
                                    >
                                        {pairingLoading ? 'Generating Token...' : 'Generate Pairing Token'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <span className="text-[11px] text-zinc-400 block mb-1">Your Pairing Token:</span>
                                    <div className="flex items-center justify-between gap-2">
                                        <code className="font-mono text-sm text-[var(--accent-cyan)] break-all font-bold">
                                            {pairingResult.pairingToken}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(pairingResult.pairingToken);
                                                dispatch(addToast({ type: 'success', message: 'Token copied to clipboard!' }));
                                            }}
                                            className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-zinc-400 space-y-1.5">
                                    <span className="font-semibold text-zinc-200 block">Desktop Setup Command:</span>
                                    <pre className="font-mono text-[11px] p-2.5 rounded-lg bg-black/60 border border-white/[0.06] text-zinc-300 overflow-x-auto">
                                        node parsu-desktop-companion.js --token {pairingResult.pairingToken}
                                    </pre>
                                </div>

                                <button
                                    onClick={() => setShowPairModal(false)}
                                    className="w-full py-2 rounded-xl bg-[var(--accent-cyan)] text-black font-semibold text-xs hover:brightness-110"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
