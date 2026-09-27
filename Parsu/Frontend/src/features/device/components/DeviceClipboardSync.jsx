/**
 * DeviceClipboardSync — Cross-device universal clipboard broadcast panel
 */
import React, { useState } from 'react';
import { RiClipboardLine, RiSendPlane2Line, RiLoader4Line } from '@remixicon/react';

export default function DeviceClipboardSync({ onSync }) {
    const [text, setText] = useState('');
    const [syncing, setSyncing] = useState(false);

    async function handleSync() {
        if (!text.trim()) return;
        setSyncing(true);
        await onSync(text.trim());
        setText('');
        setSyncing(false);
    }

    return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                <RiClipboardLine size={16} className="text-emerald-400" />
                Universal Clipboard
            </h2>
            <p className="text-xs text-zinc-500 mb-3">
                Broadcast any text instantly across all your linked devices — desktop, mobile, tablet.
            </p>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSync(); }}
                    placeholder="Type or paste text to sync across your devices..."
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.08] text-xs rounded-xl px-3 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)] placeholder:text-zinc-400"
                />
                <button
                    onClick={handleSync}
                    disabled={syncing || !text.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                    {syncing
                        ? <><RiLoader4Line size={14} className="animate-spin" /> Syncing...</>
                        : <><RiSendPlane2Line size={14} /> Broadcast</>
                    }
                </button>
            </div>
        </div>
    );
}
