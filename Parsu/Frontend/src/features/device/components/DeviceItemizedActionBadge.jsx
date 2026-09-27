import React from 'react';
import {
    RiComputerLine,
    RiSmartphoneLine,
    RiMacLine,
    RiTimeLine,
    RiCheckLine,
    RiCloseLine,
    RiLoader4Line,
    RiAlertLine,
    RiArrowGoBackLine,
    RiTerminalBoxLine
} from '@remixicon/react';

export default function DeviceItemizedActionBadge({
    device = {},
    action = '',
    tier = 'read-only',
    status = 'pending',
    step = '',
    executionTimeMs = null,
    error = null,
    auditId = null,
    onConfirm = null,
    onUndo = null,
    canUndo = false,
    compact = false
}) {
    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'android':
            case 'ios':
            case 'mobile':
                return <RiSmartphoneLine size={14} className="text-emerald-400 shrink-0" />;
            case 'macos':
                return <RiMacLine size={14} className="text-zinc-300 shrink-0" />;
            default:
                return <RiComputerLine size={14} className="text-[var(--accent-cyan)] shrink-0" />;
        }
    };

    const getTierBadge = (t) => {
        switch (t) {
            case 'destructive':
                return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Destructive</span>;
            case 'mutating':
                return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Mutating</span>;
            default:
                return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Auto-Run</span>;
        }
    };

    const getStatusIndicator = () => {
        switch (status) {
            case 'completed':
            case 'success':
                return (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <RiCheckLine size={14} /> Completed
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                        <RiCloseLine size={14} /> Failed
                    </span>
                );
            case 'awaiting_confirmation':
                return (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-medium animate-pulse">
                        <RiAlertLine size={14} /> Needs Confirmation
                    </span>
                );
            case 'in_progress':
            case 'executing':
                return (
                    <span className="flex items-center gap-1 text-xs text-[var(--accent-cyan)] font-medium">
                        <RiLoader4Line size={14} className="animate-spin" /> {step || 'Executing...'}
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <RiTimeLine size={14} /> Queued
                    </span>
                );
        }
    };

    return (
        <div className={`rounded-xl border border-zinc-200/60 dark:border-white/[0.08] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md ${compact ? 'p-2.5' : 'p-3.5'} transition-all`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Left: Device badge & Action name */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                        {getPlatformIcon(device.platform)}
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {device.name || 'Desktop Companion'}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600 text-xs">•</span>
                    <span className="font-mono text-xs text-[var(--accent-cyan)] truncate flex items-center gap-1">
                        <RiTerminalBoxLine size={13} className="shrink-0" />
                        {action}
                    </span>
                </div>

                {/* Right: Tier & Status */}
                <div className="flex items-center gap-2 shrink-0">
                    {getTierBadge(tier)}
                    {getStatusIndicator()}
                </div>
            </div>

            {/* Sub-bar: Latency, Steps & Undo */}
            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    {executionTimeMs !== null && (
                        <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">
                            ⚡ {executionTimeMs}ms
                        </span>
                    )}
                    {step && status === 'completed' && (
                        <span className="text-[11px] text-zinc-400 truncate max-w-[260px]">
                            {step}
                        </span>
                    )}
                </div>

                {/* Actions: Confirm or Undo */}
                <div className="flex items-center gap-2 ml-auto">
                    {status === 'awaiting_confirmation' && onConfirm && (
                        <button
                            onClick={() => onConfirm(auditId)}
                            className="px-2.5 py-1 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                            Authorize Execution
                        </button>
                    )}
                    {canUndo && onUndo && (
                        <button
                            onClick={() => onUndo(auditId)}
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                            <RiArrowGoBackLine size={12} /> Undo
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono">
                    {error}
                </div>
            )}
        </div>
    );
}
