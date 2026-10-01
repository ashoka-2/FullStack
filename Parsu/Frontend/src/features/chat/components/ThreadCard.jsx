import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RiPushpinLine, RiPushpin2Fill, RiPencilLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { triggerBlobChatSelect, triggerBlobChatDeleteHover } from '../../../utils/blobReactions';
import { DeleteButton } from '../../Components/rare-ui/DeleteButton';
import { renameChat, togglePinChat } from '../../auth/service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const ThreadCard = ({ thread, viewMode, onDelete, onRename, onPinToggle }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const threadId = thread._id || thread.id;
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameVal, setRenameVal] = useState(thread.title || '');
    const [isPinned, setIsPinned] = useState(Boolean(thread.isPinned));
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        setIsPinned(Boolean(thread.isPinned));
    }, [thread.isPinned]);

    useEffect(() => {
        setRenameVal(thread.title || '');
    }, [thread.title]);

    // Handle clicking the card body to navigate to the chat session
    const handleCardClick = (e) => {
        // If clicking on an action button, delete widget, or input, do NOT navigate to chat
        if (e.target.closest('button, input, [data-slot="delete-button"], [data-no-card-click="true"]')) {
            return;
        }
        triggerBlobChatSelect();
        navigate(`/chat/${threadId}`);
    };

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
            const res = await togglePinChat(threadId);
            const nextPinned = res?.isPinned ?? !isPinned;
            setIsPinned(nextPinned);
            if (onPinToggle) onPinToggle(threadId, nextPinned);
            dispatch(addToast({ type: 'success', message: nextPinned ? 'Chat pinned' : 'Chat unpinned' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to update pin' }));
        }
    };

    // ─── Rename input overlay ───────────────────
    const RenameInput = () => (
        <div
            data-no-card-click="true"
            className="flex items-center gap-1.5 w-full my-1 z-20"
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        >
            <input
                ref={inputRef}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Enter') confirmRename(e);
                    if (e.key === 'Escape') cancelRename(e);
                }}
                maxLength={150}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-[var(--accent-cyan)] rounded-xl px-2.5 py-1 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] min-w-0"
                placeholder="Chat name…"
            />
            <button 
                type="button"
                onClick={confirmRename} 
                disabled={saving}
                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                title="Save name"
            >
                <RiCheckLine size={15} />
            </button>
            <button 
                type="button"
                onClick={cancelRename}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 transition-all cursor-pointer shrink-0"
                title="Cancel"
            >
                <RiCloseLine size={15} />
            </button>
        </div>
    );

    // ─── Grid View ────────────────────────────────────────────────────────────
    if (viewMode === 'grid') {
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/chat/${threadId}`); }}
                onMouseEnter={() => triggerBlobChatSelect()}
                className="group flex flex-col p-5 bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/[0.08] rounded-3xl hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-[#161616] shadow-xs transition-all text-left relative cursor-pointer select-none"
            >
                {/* Pin badge */}
                {isPinned && (
                    <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30">
                        <RiPushpin2Fill size={11} className="text-[var(--accent-cyan)]" />
                    </div>
                )}

                <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1A] border border-zinc-200/90 dark:border-white/[0.08] text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest shrink-0">
                        {thread.date || 'Recent'}
                    </div>
                    {/* Actions */}
                    <div 
                        data-no-card-click="true"
                        className="flex items-center gap-1 shrink-0 z-10"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <button 
                            type="button"
                            onClick={handlePin} 
                            title={isPinned ? 'Unpin' : 'Pin chat'}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[var(--accent-cyan)] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                        >
                            {isPinned ? <RiPushpin2Fill size={14} className="text-[var(--accent-cyan)]" /> : <RiPushpinLine size={14} />}
                        </button>
                        <button 
                            type="button"
                            onClick={startRename} 
                            title="Rename chat"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                        >
                            <RiPencilLine size={14} />
                        </button>
                        <DeleteButton className="h-8.5 rounded-xl" onConfirm={handleConfirmDelete} />
                    </div>
                </div>

                {isRenaming ? (
                    <RenameInput />
                ) : (
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-[var(--accent-cyan)] transition-colors line-clamp-1 mb-2">
                        {thread.title}
                    </h3>
                )}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2">
                    {thread.desc}
                </p>
            </div>
        );
    }

    // ─── List View ────────────────────────────────────────────────────────────
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/chat/${threadId}`); }}
            onMouseEnter={() => triggerBlobChatSelect()}
            className="group flex items-center justify-between p-4 bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/[0.08] rounded-2xl hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-[#161616] shadow-xs transition-all cursor-pointer gap-3 select-none"
        >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#1A1A1A] border border-zinc-200/90 dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0 relative">
                    <ParsuLogo size={22} className="text-zinc-900 dark:text-white" />
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
                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-[var(--accent-cyan)] transition-colors">
                                {thread.title}
                            </h3>
                            <p className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-tighter mt-0.5">
                                {thread.date || 'Recent'} · Thread
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div 
                data-no-card-click="true"
                className="flex items-center gap-1 shrink-0 z-10"
                onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            >
                {/* Pin */}
                <button 
                    type="button"
                    onClick={handlePin} 
                    title={isPinned ? 'Unpin' : 'Pin chat'}
                    className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-[var(--accent-cyan)] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center justify-center"
                >
                    {isPinned ? <RiPushpin2Fill size={15} className="text-[var(--accent-cyan)]" /> : <RiPushpinLine size={15} />}
                </button>
                {/* Rename */}
                <button 
                    type="button"
                    onClick={startRename} 
                    title="Rename"
                    className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center justify-center"
                >
                    <RiPencilLine size={15} />
                </button>
                {/* Delete */}
                <div className="relative z-10 shrink-0" onMouseEnter={() => triggerBlobChatDeleteHover()}>
                    <DeleteButton className="h-8.5 rounded-xl" onConfirm={handleConfirmDelete} />
                </div>
            </div>
        </div>
    );
};

export default ThreadCard;
