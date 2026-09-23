import React from 'react';
import { 
    RiCheckLine, 
    RiLoader4Line, 
    RiLinkUnlinkM
} from '@remixicon/react';
import { triggerBlobSocialHover } from '../../../utils/blobReactions';
import PrimaryButton from '../../Components/PrimaryButton';

/**
 * SocialPlatformCard
 * Modular card presenting platform connection status, supported media formats,
 * profile details, and connect/disconnect controls.
 * Uses the universal PrimaryButton with social-colored icons.
 */
export default function SocialPlatformCard({
    platform,
    connection,
    isLoading = false,
    onConnect,
    onDisconnect
}) {
    const Icon = platform.icon;

    return (
        <div
            className={`group relative bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-[28px] border transition-all duration-300 overflow-hidden
                ${connection
                    ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
                    : 'border-zinc-200 dark:border-white/8 hover:border-zinc-300 dark:hover:border-white/15 hover:shadow-lg'
                }`}
        >
            <div className="p-6">
                {/* Platform icon + name */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                        <div
                            className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center border border-zinc-200/80 dark:border-white/10 shadow-xs transition-transform group-hover:scale-105"
                        >
                            <Icon size={24} style={{ color: platform.color }} />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px]">{platform.name}</h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">{platform.description}</p>
                        </div>
                    </div>
                    {/* Status badge */}
                    {connection && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full">
                            <RiCheckLine size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                        </div>
                    )}
                </div>

                {/* Supported content types */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {platform.supports.map(type => (
                        <span key={type} className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 uppercase tracking-wider">
                            {type}
                        </span>
                    ))}
                </div>

                {/* Connected profile info */}
                {connection && (
                    <div className="flex items-center gap-3 mb-5 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-white/5">
                        {connection.profilePicUrl ? (
                            <img src={connection.profilePicUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                {connection.platformUsername?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                @{connection.platformUsername || connection.platformUserId}
                            </p>
                            <p className="text-[10px] text-zinc-500">Connected {new Date(connection.connectedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}

                {/* Action button */}
                {connection ? (
                    <button
                        type="button"
                        onClick={() => onDisconnect(platform.id)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-500/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all text-sm font-bold cursor-pointer"
                    >
                        {isLoading ? (
                            <RiLoader4Line className="animate-spin" size={16} />
                        ) : (
                            <RiLinkUnlinkM size={16} />
                        )}
                        Disconnect
                    </button>
                ) : (
                    <PrimaryButton
                        onClick={() => onConnect(platform)}
                        onMouseEnter={() => triggerBlobSocialHover(platform.id)}
                        disabled={isLoading}
                        loading={isLoading}
                        icon={Icon}
                        iconColor={platform.color}
                        size="full"
                    >
                        Connect {platform.name}
                    </PrimaryButton>
                )}
            </div>
        </div>
    );
}
