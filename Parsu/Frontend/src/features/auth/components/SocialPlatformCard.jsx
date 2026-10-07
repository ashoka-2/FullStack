import React from 'react';
import { 
    RiCheckLine, 
    RiLoader4Line, 
    RiLinkUnlinkM,
    RiArrowRightUpLine,
    RiLock2Line
} from '@remixicon/react';
import { triggerBlobSocialHover } from '../../../utils/blobReactions';

/**
 * SocialPlatformCard — Apple & AI Design System
 * Features:
 * - Clean original Apple-style glass tile layout
 * - When locked by admin: disabled button with 'Locked by Admin'
 * - Supported format chips & live status badge
 * - High-polish connect / disconnect controls
 */
export default function SocialPlatformCard({
    platform,
    connection,
    connector,
    isLoading = false,
    onConnect,
    onDisconnect
}) {
    const Icon = platform.icon;
    const isLocked = Boolean(connector?.isLocked || (connector?.status && connector.status !== 'active'));

    return (
        <div
            data-guide={`social-card-${platform.id}`}
            className={`group relative bg-white/70 dark:bg-[#121212]/70 backdrop-blur-2xl rounded-3xl sm:rounded-[28px] border transition-all duration-300 overflow-hidden flex flex-col justify-between
                ${connection
                    ? 'border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/20'
                    : 'border-zinc-200/90 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5'
                }`}
        >
            {/* Top ambient color reflection */}
            <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                style={{ backgroundColor: platform.color }}
            />

            <div className="p-5 sm:p-6 relative z-10">
                {/* Header: Platform squircle + Info + Live badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/10 shadow-xs transition-transform duration-300 shrink-0 group-hover:scale-105"
                            style={{ boxShadow: connection ? `0 4px 20px ${platform.bgGlow}` : undefined }}
                        >
                            <Icon size={24} style={{ color: platform.color }} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-zinc-900 dark:text-white text-[15px] tracking-tight truncate">
                                {platform.name}
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                                {platform.description}
                            </p>
                        </div>
                    </div>

                    {/* Live status badge when connected */}
                    {connection && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold tracking-wider uppercase shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live</span>
                        </div>
                    )}
                </div>

                {/* Supported capability tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {platform.supports.map(type => (
                        <span 
                            key={type} 
                            className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100/80 dark:bg-white/[0.05] border border-zinc-200/70 dark:border-white/[0.06] px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                        >
                            {type}
                        </span>
                    ))}
                </div>

                {/* Connected profile identity card */}
                {connection && (
                    <div className="flex items-center gap-3 p-3 bg-zinc-100/70 dark:bg-white/[0.04] rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] mb-2 animate-in fade-in duration-200">
                        {connection.profilePicUrl ? (
                            <img src={connection.profilePicUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] flex items-center justify-center text-xs font-bold shrink-0">
                                {connection.platformUsername?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                @{connection.platformUsername || connection.platformUserId}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                                Connected {new Date(connection.connectedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="p-5 sm:p-6 pt-0 relative z-10">
                {connection ? (
                    <button
                        type="button"
                        onClick={() => onDisconnect(platform.id)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-red-500/10 hover:border-red-500/30 text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 border border-zinc-200/80 dark:border-white/10 transition-all text-xs font-semibold cursor-pointer active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <RiLoader4Line className="animate-spin" size={15} />
                        ) : (
                            <RiLinkUnlinkM size={15} />
                        )}
                        <span>Disconnect Channel</span>
                    </button>
                ) : isLocked ? (
                    <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 text-zinc-400 dark:text-zinc-500 font-semibold text-xs cursor-not-allowed select-none"
                    >
                        <RiLock2Line size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span>Locked by Admin</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        data-guide={`social-connect-btn-${platform.id}`}
                        onClick={() => onConnect(platform)}
                        onMouseEnter={() => triggerBlobSocialHover(platform.id)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                    >
                        {isLoading ? (
                            <RiLoader4Line className="animate-spin" size={15} />
                        ) : (
                            <RiArrowRightUpLine size={15} />
                        )}
                        <span>Connect {platform.name}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
