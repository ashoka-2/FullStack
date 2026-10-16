import React, { useState } from 'react';
import {
    RiShieldCheckLine,
    RiAlertLine,
    RiCloseLine,
    RiCheckLine,
    RiComputerLine,
    RiSmartphoneLine
} from '@remixicon/react';
import PrimaryButton from '../../Components/PrimaryButton';

export default function DeviceConfirmActionModal({
    isOpen,
    onClose,
    onConfirm,
    auditData = null,
    loading = false
}) {
    const [rememberSession, setRememberSession] = useState(false);

    if (!isOpen || !auditData) return null;

    const { action, tier, device, params, auditId } = auditData;
    const isDestructive = tier === 'destructive';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 text-zinc-900 dark:text-zinc-100 flex flex-col gap-4">
                
                {/* Header with Danger/Warning Icon */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isDestructive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                            {isDestructive ? <RiAlertLine size={22} /> : <RiShieldCheckLine size={22} />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                                {isDestructive ? 'Confirm Destructive Action' : 'Authorize Mutating Action'}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Cross-device agent requires your confirmation
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>

                {/* Device & Action Details Card */}
                <div className="p-4 rounded-[18px] bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.06] text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Target Device:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                            {device?.platform === 'android' ? <RiSmartphoneLine size={13} className="text-emerald-500" /> : <RiComputerLine size={13} className="text-[var(--accent-cyan)]" />}
                            {device?.name || 'Local Machine'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Operation:</span>
                        <span className="font-mono text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-2 py-0.5 rounded-full">
                            {action}
                        </span>
                    </div>
                    {params && (
                        <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.04]">
                            <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Parameters:</span>
                            <pre className="font-mono text-[11px] text-zinc-800 dark:text-zinc-300 bg-zinc-100 dark:bg-black/40 p-2.5 rounded-[12px] overflow-x-auto max-h-24">
                                {JSON.stringify(params, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Explanatory Notice */}
                <div className={`p-3.5 rounded-[16px] text-xs leading-relaxed ${isDestructive ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'}`}>
                    {isDestructive
                        ? '⚠️ This action modifies your system state, closes applications, or deletes files. Safe operations will be sent to the Recycle Bin when possible.'
                        : 'ℹ️ This action simulates user interaction or mutates settings. You can authorize it for this single step or allow mutating actions for this session.'
                    }
                </div>

                {/* Session remember checkbox for mutating actions */}
                {!isDestructive && (
                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberSession}
                            onChange={(e) => setRememberSession(e.target.checked)}
                            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-[var(--accent-cyan)] focus:ring-0 cursor-pointer"
                        />
                        <span>Remember permission for mutating actions in this session</span>
                    </label>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-all cursor-pointer"
                    >
                        Deny / Cancel
                    </button>
                    {!isDestructive ? (
                        <PrimaryButton
                            onClick={() => onConfirm(auditId, rememberSession)}
                            disabled={loading}
                            loading={loading}
                            icon={RiCheckLine}
                            iconPosition="left"
                            size="sm"
                            className="rounded-full px-5"
                        >
                            {loading ? 'Authorizing...' : 'Authorize Execution'}
                        </PrimaryButton>
                    ) : (
                        <button
                            onClick={() => onConfirm(auditId, rememberSession)}
                            disabled={loading}
                            className="px-5 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                        >
                            <RiCheckLine size={16} />
                            {loading ? 'Authorizing...' : 'Authorize Execution'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
