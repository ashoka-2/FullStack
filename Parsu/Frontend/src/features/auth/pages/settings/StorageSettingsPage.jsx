import React, { useState, useEffect, useRef } from 'react';
import {
    RiHardDriveLine, RiImageLine, RiVideoLine, RiDeleteBin6Line,
    RiLoader4Line, RiCheckLine, RiAlertLine, RiDownloadLine,
    RiGridLine, RiListCheck, RiFileLine
} from '@remixicon/react';
import SettingsPageLayout from './SettingsPageLayout';
import { getUserMedia, deleteUserMedia } from '../../service/settings.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../../utils/toast.slice';
import gsap from 'gsap';

// ─── Bytes formatter ─────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Date formatter ───────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Media Thumbnail ──────────────────────────────────────────────────────────
const MediaThumb = ({ item, onDelete, deleting }) => {
    const isImage = item.fileType === 'image';
    const isVideo = item.fileType === 'video';

    return (
        <div className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/8 bg-zinc-100 dark:bg-zinc-900 aspect-square">
            {/* Thumbnail */}
            {isImage && item.url ? (
                <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : isVideo && item.url ? (
                <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <RiFileLine size={28} className="text-zinc-400" />
                </div>
            )}

            {/* Type badge */}
            <div className="absolute top-2 left-2">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                    ${isImage ? 'bg-sky-500/90 text-white' : 'bg-purple-500/90 text-white'}`}>
                    {isImage ? <RiImageLine size={10} /> : <RiVideoLine size={10} />}
                    {isImage ? 'IMG' : 'VID'}
                </div>
            </div>

            {/* Delete overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                {deleting ? (
                    <RiLoader4Line size={22} className="text-white animate-spin" />
                ) : (
                    <button
                        onClick={() => onDelete(item.fileId)}
                        title="Delete file"
                        className="p-2.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white transition-all active:scale-95 cursor-pointer"
                    >
                        <RiDeleteBin6Line size={18} />
                    </button>
                )}
            </div>

            {/* Info footer */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-[11px] font-semibold text-white truncate">{item.name || 'File'}</p>
                <p className="text-[10px] text-white/60">{formatBytes(item.size)} · {formatDate(item.uploadedAt)}</p>
            </div>
        </div>
    );
};

// ─── List Row ─────────────────────────────────────────────────────────────────
const MediaListRow = ({ item, onDelete, deleting }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10 transition-all">
        {/* Thumb */}
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5">
            {item.url && item.fileType === 'image' ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            ) : item.url && item.fileType === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" muted preload="metadata" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <RiFileLine size={18} className="text-zinc-400" />
                </div>
            )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.name || 'File'}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{formatBytes(item.size)} · {formatDate(item.uploadedAt)}</p>
        </div>
        {/* Type badge */}
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0
            ${item.fileType === 'image' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'}`}>
            {item.fileType === 'image' ? 'Image' : 'Video'}
        </div>
        {/* Delete */}
        <button
            onClick={() => onDelete(item.fileId)}
            disabled={deleting}
            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/8 transition-all cursor-pointer disabled:opacity-40"
            title="Delete"
        >
            {deleting ? <RiLoader4Line size={16} className="animate-spin" /> : <RiDeleteBin6Line size={16} />}
        </button>
    </div>
);

// ─── Storage Settings Page ────────────────────────────────────────────────────
const StorageSettingsPage = () => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [media, setMedia] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [filter, setFilter] = useState('all'); // 'all' | 'image' | 'video'
    const [deletingId, setDeletingId] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);

    useEffect(() => {
        getUserMedia()
            .then(data => setMedia(data.media || []))
            .catch(() => dispatch(addToast({ type: 'error', message: 'Failed to load media' })))
            .finally(() => setLoading(false));
    }, [dispatch]);

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }, [loading]);

    const handleDelete = async (fileId) => {
        if (!window.confirm('Delete this file? It will be removed from this chat message too.')) return;
        setDeletingId(fileId);
        try {
            await deleteUserMedia(fileId);
            setMedia(prev => prev.filter(m => m.fileId !== fileId));
            dispatch(addToast({ type: 'success', message: 'File deleted successfully' }));
        } catch {
            dispatch(addToast({ type: 'error', message: 'Failed to delete file' }));
        } finally {
            setDeletingId(null);
        }
    };

    // Stats
    const totalSize = media.reduce((acc, m) => acc + (m.size || 0), 0);
    const imageCount = media.filter(m => m.fileType === 'image').length;
    const videoCount = media.filter(m => m.fileType === 'video').length;

    const filtered = filter === 'all' ? media
        : media.filter(m => m.fileType === filter);

    return (
        <SettingsPageLayout
            title="Storage"
            icon={RiHardDriveLine}
            description="Manage media files uploaded in your chats"
        >
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RiLoader4Line size={28} className="text-[var(--accent-cyan)] animate-spin" />
                </div>
            ) : (
                <div ref={containerRef} className="space-y-5">

                    {/* ── Stats bar ─────────────────────────────────────── */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Files', value: media.length, icon: RiFileLine, color: 'text-[var(--accent-cyan)]', bg: 'rgba(32,184,205,0.08)' },
                            { label: 'Images', value: imageCount, icon: RiImageLine, color: 'text-sky-500', bg: 'rgba(14,165,233,0.08)' },
                            { label: 'Videos', value: videoCount, icon: RiVideoLine, color: 'text-purple-500', bg: 'rgba(168,85,247,0.08)' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-white/[0.06]">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                                    <s.icon size={16} className={s.color} />
                                </div>
                                <span className="text-xl font-black text-zinc-900 dark:text-white">{s.value}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Total size hint ───────────────────────────────── */}
                    {totalSize > 0 && (
                        <p className="text-xs text-zinc-500 text-center">
                            Approximate total: <strong className="text-zinc-700 dark:text-zinc-300">{formatBytes(totalSize)}</strong> stored in ImageKit CDN
                        </p>
                    )}

                    {media.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                <RiHardDriveLine size={28} className="text-zinc-400" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No media uploaded yet</p>
                            <p className="text-xs text-zinc-500 max-w-xs">Images and videos you upload in chat will appear here and can be deleted.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Toolbar ───────────────────────────────── */}
                            <div className="flex items-center justify-between gap-3">
                                {/* Filter tabs */}
                                <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5">
                                    {['all', 'image', 'video'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize
                                                ${filter === f
                                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                                }`}
                                        >
                                            {f === 'all' ? `All (${media.length})` : f === 'image' ? `Images (${imageCount})` : `Videos (${videoCount})`}
                                        </button>
                                    ))}
                                </div>
                                {/* View mode */}
                                <div className="flex gap-1">
                                    <button onClick={() => setViewMode('grid')} title="Grid view"
                                        className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                        <RiGridLine size={16} />
                                    </button>
                                    <button onClick={() => setViewMode('list')} title="List view"
                                        className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                        <RiListCheck size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Media Grid / List ─────────────────────── */}
                            {filtered.length === 0 ? (
                                <p className="text-center text-sm text-zinc-500 py-8">No {filter}s found.</p>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {filtered.map(item => (
                                        <MediaThumb
                                            key={item.fileId}
                                            item={item}
                                            onDelete={handleDelete}
                                            deleting={deletingId === item.fileId}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map(item => (
                                        <MediaListRow
                                            key={item.fileId}
                                            item={item}
                                            onDelete={handleDelete}
                                            deleting={deletingId === item.fileId}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ── Info note ────────────────────────────── */}
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5">
                                <RiAlertLine size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Deleting a file removes it from our CDN permanently. In the related chat, it will appear as <em>"[Deleted by user]"</em>.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </SettingsPageLayout>
    );
};

export default StorageSettingsPage;
