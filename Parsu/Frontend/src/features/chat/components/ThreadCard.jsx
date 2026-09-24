import React, { useState, useRef } from 'react';
import { Link } from 'react-router';
import { RiShareLine, RiPushpinLine, RiPushpin2Fill, RiPencilLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { triggerBlobChatSelect, triggerBlobChatDeleteHover } from '../../../utils/blobReactions';
import { DeleteButton } from '../../Components/rare-ui/DeleteButton';
import { renameChat, togglePinChat } from '../../auth/service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const ThreadCard = ({ thread, viewMode, onDelete, onRename, onPinToggle }) => {
    const dispatch = useDispatch();
    const threadId = thread._id || thread.id;
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameVal, setRenameVal] = useState(thread.title || '');
    const [isPinned, setIsPinned] = useState(thread.isPinned || false);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    const handleConfirmDelete = () => {
        triggerBlobChatDeleteHover();
        if (onDelete) onDelete(threadId);
    };

    // ── Rename ──────────────────────────────────────────────────────────────
    const startRename = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setRenameVal(thread.title || '');
        setIsRenaming(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const confirmRename = async (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!renameVal.trim() || renameVal.trim() === thread.title) {
            setIsRenaming(false);
            return;
        }
        setSaving(true);
        try {
            await renameChat(threadId, renameVal.trim());
            if (onRename) onRename(threadId, renameVal.trim());
            dispatch(addToast({ type: 'success', message: 'Chat renamed' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to rename chat' }));
        } finally {
            setSaving(false);
            setIsRenaming(false);
        }
    };

    const cancelRename = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setIsRenaming(false);
        setRenameVal(thread.title || '');
    };

    // ── Pin Toggle ───────────────────────────────────────────────────────────
    const handlePin = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await togglePinChat(threadId);
            setIsPinned(prev => !prev);
            if (onPinToggle) onPinToggle(threadId, !isPinned);
            dispatch(addToast({ type: 'success', message: isPinned ? 'Chat unpinned' : 'Chat pinned' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to update pin' }));
        }
    };

    // ─── Rename input overlay (shared between both views) ───────────────────
    const RenameInput = () => (
        <div
            className="flex items-center gap-1 w-full"
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        >
            <input
                ref={inputRef}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') confirmRename(e);
                    if (e.key === 'Escape') cancelRename(e);
                }}
                maxLength={150}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-[var(--accent-cyan)]/50 rounded-lg px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--accent-cyan)] min-w-0"
                placeholder="Chat name…"
            />
            <button onClick={confirmRename} disabled={saving}
                className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40">
                <RiCheckLine size={15} />
            </button>
            <button onClick={cancelRename}
                className="p-1 rounded text-zinc-400 hover:bg-zinc-500/10 transition-all cursor-pointer">
                <RiCloseLine size={15} />
            </button>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    if (viewMode === 'grid') {
        return (
            <Link
                to={`/chat/${threadId}`}
                onMouseEnter={() => triggerBlobChatSelect()}
                onClick={() => triggerBlobChatSelect()}
                className="group flex flex-col p-5 bg-[#111111] border border-white/[0.08] rounded-3xl hover:border-white/20 hover:bg-[#161616] shadow-xs transition-all text-left relative"
            >
                {/* Pin badge */}
                {isPinned && (
                    <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30">
                        <RiPushpin2Fill size={11} className="text-[var(--accent-cyan)]" />
                    </div>
                )}

                <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-[#1A1A1A] border border-white/[0.08] text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">
                        {thread.date || 'Recent'}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <button onClick={handlePin} title={isPinned ? 'Unpin' : 'Pin chat'}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[var(--accent-cyan)] hover:bg-white/[0.06] transition-all cursor-pointer">
                            {isPinned ? <RiPushpin2Fill size={14} className="text-[var(--accent-cyan)]" /> : <RiPushpinLine size={14} />}
                        </button>
                        <button onClick={startRename} title="Rename chat"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
                            <RiPencilLine size={14} />
                        </button>
                        <DeleteButton className="h-8.5 rounded-xl" onConfirm={handleConfirmDelete} />
                    </div>
                </div>

                {isRenaming ? (
                    <RenameInput />
                ) : (
                    <h3 className="text-lg font-bold text-white group-hover:text-[var(--accent-cyan)] transition-colors line-clamp-1 mb-2">
                        {thread.title}
                    </h3>
                )}
                <p className="text-sm text-zinc-400 font-normal leading-relaxed line-clamp-2">
                    {thread.desc}
                </p>
            </Link>
        );
    }

    // ─── List view ────────────────────────────────────────────────────────────
    return (
        <Link
            to={`/chat/${threadId}`}
            onMouseEnter={() => triggerBlobChatSelect()}
            onClick={() => triggerBlobChatSelect()}
            className="group flex items-center justify-between p-4 bg-[#111111] border border-white/[0.08] rounded-2xl hover:border-white/20 hover:bg-[#161616] shadow-xs transition-all cursor-pointer gap-3"
        >
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-[var(--accent-cyan)] transition-colors shrink-0 relative">
                    <ParsuLogo size={18} />
                    {isPinned && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--accent-cyan)] rounded-full flex items-center justify-center shadow-xs">
                            <RiPushpin2Fill size={8} className="text-black" />
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    {isRenaming ? (
                        <RenameInput />
                    ) : (
                        <>
                            <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-[var(--accent-cyan)] transition-colors">{thread.title}</h3>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-tighter mt-0.5">{thread.date || 'Recent'} · Thread</p>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0"
                onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                {/* Pin */}
                <button onClick={handlePin} title={isPinned ? 'Unpin' : 'Pin chat'}
                    className="p-2 text-zinc-400 hover:text-[var(--accent-cyan)] transition-colors cursor-pointer hidden sm:flex">
                    {isPinned ? <RiPushpin2Fill size={16} className="text-[var(--accent-cyan)]" /> : <RiPushpinLine size={16} />}
                </button>
                {/* Rename */}
                <button onClick={startRename} title="Rename"
                    className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:flex">
                    <RiPencilLine size={16} />
                </button>
                {/* Delete */}
                <div className="relative z-10 shrink-0" onMouseEnter={() => triggerBlobChatDeleteHover()}>
                    <DeleteButton className="h-8.5 rounded-xl" onConfirm={handleConfirmDelete} />
                </div>
            </div>
        </Link>
    );
};

export default ThreadCard;
