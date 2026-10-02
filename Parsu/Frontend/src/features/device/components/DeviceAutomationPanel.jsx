/**
 * DeviceAutomationPanel — Quick command dispatcher + cross-device relay panel
 * Lets users send read-only, mutating or destructive OS commands to the
 * selected device. Also shows the last execution result badge.
 */
import React, { useState } from 'react';
import { RiFlashlightLine, RiLoader4Line, RiPlayLine, RiClipboardLine } from '@remixicon/react';
import DeviceItemizedActionBadge from './DeviceItemizedActionBadge';
import PrimaryButton from '../../Components/PrimaryButton';

const ACTIONS = [
    { value: 'get_stats',          label: 'System Telemetry & Stats',       tier: 'read-only' },
    { value: 'list_processes',     label: 'List Running Processes',          tier: 'read-only' },
    { value: 'take_screenshot',    label: 'Take Screenshot',                 tier: 'read-only' },
    { value: 'read_clipboard',     label: 'Read Clipboard',                  tier: 'read-only' },
    { value: 'send_notification',  label: 'Send Native Notification',        tier: 'mutating' },
    { value: 'write_clipboard',    label: 'Write to Clipboard',              tier: 'mutating' },
    { value: 'launch_app',         label: 'Launch Application (Notepad)',     tier: 'mutating' },
    { value: 'open_url',           label: 'Open URL in Browser',             tier: 'mutating' },
    { value: 'window_control',     label: 'Window: Minimize / Maximize',     tier: 'mutating' },
    { value: 'close_app',          label: 'Close Application (Notepad)',      tier: 'destructive' },
    { value: 'simulate_input',     label: 'Simulate Keyboard Input',          tier: 'destructive' },
];

const TIER_COLOR = {
    'read-only':  'text-emerald-400',
    'mutating':   'text-amber-400',
    'destructive':'text-rose-400',
};

export default function DeviceAutomationPanel({
    selectedDeviceId,
    devices,
    onExecute,
    onConfirm,
    onUndo,
    lastResult,
    executing,
}) {
    const [action, setAction] = useState('get_stats');
    const selectedAction = ACTIONS.find(a => a.value === action);
    const hasTarget = !!selectedDeviceId;

    return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <RiFlashlightLine size={16} className="text-amber-400" />
                    Quick Automation Dispatcher
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Instantly run OS commands on your selected device. Or just ask the AI in chat — it will do this automatically.
                </p>
            </div>

            {/* Action selector */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <select
                        value={action}
                        onChange={e => setAction(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.08] text-xs rounded-xl px-3 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)] appearance-none cursor-pointer"
                    >
                        {['read-only', 'mutating', 'destructive'].map(tier => (
                            <optgroup key={tier} label={`── ${tier.toUpperCase()} ──`}>
                                {ACTIONS.filter(a => a.tier === tier).map(a => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {/* Tier badge overlay */}
                    {selectedAction && (
                        <span className={`absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold ${TIER_COLOR[selectedAction.tier]}`}>
                            {selectedAction.tier}
                        </span>
                    )}
                </div>

                <PrimaryButton
                    onClick={() => onExecute(action)}
                    disabled={executing || !hasTarget}
                    loading={executing}
                    icon={RiPlayLine}
                    iconPosition="left"
                    size="sm"
                    title={!hasTarget ? 'Select a device first' : undefined}
                >
                    {executing ? 'Dispatching...' : 'Run Command'}
                </PrimaryButton>
            </div>

            {!hasTarget && (
                <p className="text-xs text-zinc-500 italic">Select a device above to target it with commands.</p>
            )}

            {/* Last result badge */}
            {lastResult && (
                <DeviceItemizedActionBadge
                    {...lastResult}
                    onConfirm={onConfirm}
                    onUndo={onUndo}
                />
            )}
        </div>
    );
}
