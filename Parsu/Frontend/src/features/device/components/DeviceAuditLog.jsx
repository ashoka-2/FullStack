/**
 * DeviceAuditLog — Paginated, filterable audit log table
 * Shows all cross-device commands with tier badge and undo support.
 */
import React, { useState } from 'react';
import { RiTimeLine, RiArrowGoBackLine, RiFilterLine } from '@remixicon/react';

const TIER_STYLE = {
    'read-only':   'bg-emerald-500/10 text-emerald-400',
    'mutating':    'bg-amber-500/10 text-amber-400',
    'destructive': 'bg-rose-500/10 text-rose-400',
};
const STATUS_STYLE = {
    completed: 'text-emerald-400',
    failed:    'text-rose-400',
    pending_confirmation: 'text-amber-400',
    pending:   'text-amber-400',
};

export default function DeviceAuditLog({ logs, onUndo }) {
    const [filter, setFilter] = useState('all');

    const visible = filter === 'all' ? logs : logs.filter(l => l.tier === filter);

    return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <RiTimeLine size={16} className="text-zinc-400" />
                        Action Audit Log
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Every automation command — duration, tier, status, and undo support.</p>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1.5">
                    {['all', 'read-only', 'mutating', 'destructive'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                filter === f
                                    ? 'bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)]'
                                    : 'bg-transparent border-zinc-200/60 dark:border-white/10 text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {visible.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">No commands logged yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-zinc-200/60 dark:border-white/[0.06] text-zinc-400">
                                <th className="pb-2.5 font-medium">Time</th>
                                <th className="pb-2.5 font-medium">Action</th>
                                <th className="pb-2.5 font-medium">Tier</th>
                                <th className="pb-2.5 font-medium">ms</th>
                                <th className="pb-2.5 font-medium">Status</th>
                                <th className="pb-2.5 font-medium text-right">Undo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/40 dark:divide-white/[0.04]">
                            {visible.map(log => (
                                <tr key={log._id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                                    <td className="py-2.5 text-zinc-400 font-mono text-[11px] pr-3 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="py-2.5 font-mono text-[var(--accent-cyan)] text-[11px] pr-4">{log.action}</td>
                                    <td className="py-2.5 pr-4">
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${TIER_STYLE[log.tier] || 'bg-zinc-800 text-zinc-400'}`}>
                                            {log.tier || '—'}
                                        </span>
                                    </td>
                                    <td className="py-2.5 font-mono text-zinc-400 text-[11px] pr-4 whitespace-nowrap">
                                        {log.executionTimeMs != null ? log.executionTimeMs : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        <span className={`capitalize text-[11px] ${STATUS_STYLE[log.status] || 'text-zinc-400'}`}>
                                            {log.status?.replace('_', ' ') || '—'}
                                        </span>
                                    </td>
                                    <td className="py-2.5 text-right">
                                        {log.canUndo && !log.undone ? (
                                            <button
                                                onClick={() => onUndo(log._id)}
                                                className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                                            >
                                                <RiArrowGoBackLine size={11} /> Undo
                                            </button>
                                        ) : log.undone ? (
                                            <span className="text-[10px] text-zinc-500 italic">Reversed</span>
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
    );
}
