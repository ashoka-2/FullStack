/**
 * DeviceStatsBar — 4-stat summary row at the top of the Devices page
 */
import React from 'react';
import { RiShieldCheckLine } from '@remixicon/react';

export default function DeviceStatsBar({ devices }) {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;

    const stats = [
        { label: 'Total Devices',  value: total,         color: 'text-zinc-100' },
        { label: 'Online Now',     value: online,        color: 'text-emerald-400', dot: true },
        { label: 'Avg Latency',    value: '< 350ms',     color: 'text-[var(--accent-cyan)] font-mono text-sm' },
        { label: 'Security',       value: '3-Tier Guard', color: 'text-emerald-400', icon: RiShieldCheckLine },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ label, value, color, dot, icon: Icon }) => (
                <div
                    key={label}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]"
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">{label}</span>
                    <div className="flex items-center gap-2">
                        {dot && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        {Icon && <Icon size={13} className={color} />}
                        <span className={`text-base font-bold ${color}`}>{value}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
