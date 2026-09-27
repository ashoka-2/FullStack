/**
 * DeviceCard — Single device tile component
 * Shows status, platform icon, telemetry, inline rename, and action buttons.
 */
import React, { useState } from 'react';
import {
    RiComputerLine, RiSmartphoneLine, RiMacLine, RiTabletLine,
    RiCheckLine, RiCloseLine, RiLoader4Line,
    RiEditLine, RiStarLine, RiStarFill, RiDeleteBin6Line,
    RiCpuLine, RiRamLine, RiBattery2ChargeLine,
    RiWifiFill, RiWifiOffLine
} from '@remixicon/react';

const PLATFORM_ICON = {
    android: <RiSmartphoneLine size={18} className="text-emerald-400" />,
    ios: <RiSmartphoneLine size={18} className="text-zinc-300" />,
    macos: <RiMacLine size={18} className="text-zinc-300" />,
    tablet: <RiTabletLine size={18} className="text-violet-400" />,
    windows: <RiComputerLine size={18} className="text-[var(--accent-cyan)]" />,
    linux: <RiComputerLine size={18} className="text-amber-400" />,
    chrome: <RiComputerLine size={18} className="text-blue-400" />,
    generic: <RiComputerLine size={18} className="text-zinc-400" />,
};

export default function DeviceCard({ device: dev, isSelected, onSelect, onRename, onSetDefault, onUnlink }) {
    const [renamingVal, setRenamingVal] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameLoading, setRenameLoading] = useState(false);
    const isOnline = dev.status === 'online';

    function startRename() {
        setRenamingVal(dev.name);
        setIsRenaming(true);
    }

    async function saveRename() {
        if (!renamingVal.trim() || renamingVal.trim() === dev.name) {
            setIsRenaming(false);
            return;
        }
        setRenameLoading(true);
        await onRename(dev._id, renamingVal.trim());
        setRenameLoading(false);
        setIsRenaming(false);
    }

    const platformKey = ['android', 'ios'].includes(dev.platform)
        ? dev.platform
        : dev.deviceType === 'tablet'
            ? 'tablet'
            : dev.platform || 'generic';

    return (
        <div
            onClick={() => !isRenaming && onSelect(dev._id)}
            className={`rounded-2xl p-4 border transition-all cursor-pointer relative group ${
                isSelected
                    ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/[0.04] shadow-lg shadow-[var(--accent-cyan)]/5'
                    : 'border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] bg-zinc-50/50 dark:bg-white/[0.02]'
            }`}
        >
            {/* Selected dot */}
            {isSelected && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_6px_rgba(32,184,205,0.7)]" />
            )}

            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                {/* Icon + identity */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-zinc-200/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                        {PLATFORM_ICON[platformKey] || PLATFORM_ICON.generic}
                    </div>

                    <div className="min-w-0 flex-1">
                        {isRenaming ? (
                            /* Inline rename row */
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <input
                                    autoFocus
                                    value={renamingVal}
                                    onChange={e => setRenamingVal(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') saveRename();
                                        if (e.key === 'Escape') setIsRenaming(false);
                                    }}
                                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-[var(--accent-cyan)]/50 rounded-lg px-2 py-0.5 text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:border-[var(--accent-cyan)] min-w-0"
                                />
                                <button
                                    onClick={saveRename}
                                    disabled={renameLoading}
                                    className="p-1 rounded-lg bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 transition-all cursor-pointer"
                                >
                                    {renameLoading ? <RiLoader4Line size={13} className="animate-spin" /> : <RiCheckLine size={13} />}
                                </button>
                                <button
                                    onClick={() => setIsRenaming(false)}
                                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
                                >
                                    <RiCloseLine size={13} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{dev.name}</h3>
                                <span className="text-[9px] font-mono px-1 py-px rounded uppercase bg-zinc-200 dark:bg-white/[0.06] text-zinc-500">{dev.platform}</span>
                                {dev.isDefault && (
                                    <span className="text-[9px] font-bold px-1 py-px rounded bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20">Default</span>
                                )}
                            </div>
                        )}

                        {/* Status row */}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                            <span className="text-[11px] text-zinc-400 capitalize">{dev.status}</span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-[11px] text-zinc-500">{dev.deviceType}</span>
                            {isOnline
                                ? <RiWifiFill size={11} className="text-emerald-400/70 ml-0.5" />
                                : <RiWifiOffLine size={11} className="text-zinc-600 ml-0.5" />
                            }
                            {dev.lastSeen && (
                                <span className="text-[10px] text-zinc-600">
                                    {new Date(dev.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action buttons — reveal on hover */}
                <div
                    className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={startRename}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-all cursor-pointer"
                        title="Rename"
                    >
                        <RiEditLine size={14} />
                    </button>
                    <button
                        onClick={() => onSetDefault(dev._id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            dev.isDefault
                                ? 'text-amber-400 hover:bg-amber-400/10'
                                : 'text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10'
                        }`}
                        title={dev.isDefault ? 'Default device' : 'Set as default'}
                    >
                        {dev.isDefault ? <RiStarFill size={14} /> : <RiStarLine size={14} />}
                    </button>
                    <button
                        onClick={() => onUnlink(dev._id, dev.name)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Unlink device"
                    >
                        <RiDeleteBin6Line size={14} />
                    </button>
                </div>
            </div>

            {/* Telemetry bar */}
            {isOnline && dev.systemMetrics && (
                <div className="mt-3.5 pt-3 border-t border-zinc-200/50 dark:border-white/[0.04] grid grid-cols-3 gap-2 text-center">
                    {[
                        { Icon: RiCpuLine,           label: 'CPU',     value: `${dev.systemMetrics.cpuUsagePercent ?? 0}%` },
                        { Icon: RiRamLine,           label: 'RAM',     value: dev.systemMetrics.ramUsageMb ? `${Math.round(dev.systemMetrics.ramUsageMb / 1024)}GB` : 'N/A' },
                        { Icon: RiBattery2ChargeLine, label: 'Battery', value: `${dev.systemMetrics.batteryPercent ?? 100}%` },
                    ].map(({ Icon, label, value }) => (
                        <div key={label} className="bg-zinc-100 dark:bg-white/[0.03] p-1.5 rounded-lg">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mb-0.5">
                                <Icon size={10} /> {label}
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">{value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
