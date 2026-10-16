import React, { useState } from 'react';
import {
    RiCloseLine,
    RiLockLine,
    RiExternalLinkLine,
    RiKey2Line,
    RiUser6Line,
    RiLoader4Line,
    RiArrowRightLine
} from '@remixicon/react';
import { connectManual } from '../service/social.api';
import { triggerBlobSocialConnected } from '../../../utils/blobReactions';
import PrimaryButton from '../../Components/PrimaryButton';

/**
 * ManualConnectModal
 * Reusable modal for platforms without automated OAuth configuration.
 * Allows developers and users to connect accounts using custom tokens and page IDs.
 */
export default function ManualConnectModal({ platform, onClose, onConnected }) {
    const [accessToken, setAccessToken] = useState('');
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await connectManual({ platform: platform.id, accessToken, userId, username });
            onConnected({ 
                platform: platform.id, 
                platformUserId: userId, 
                platformUsername: username || userId, 
                profilePicUrl: '' 
            });
            triggerBlobSocialConnected(platform.name);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to connect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl max-h-[90dvh] overflow-y-auto">
                {/* Close */}
                <button 
                    type="button"
                    onClick={onClose} 
                    className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                    aria-label="Close modal"
                >
                    <RiCloseLine size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5 mb-5 sm:mb-6">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] bg-gradient-to-br ${platform.gradient} flex items-center justify-center text-white shadow-md`}>
                        <platform.icon size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Connect {platform.name}</h2>
                        <p className="text-xs text-zinc-500">Manual token connection</p>
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-start gap-3 bg-cyan-500/10 border border-cyan-500/20 rounded-[18px] px-3.5 py-3 mb-5">
                    <RiLockLine className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] text-cyan-800 dark:text-cyan-300 leading-relaxed font-medium">
                        OAuth is not configured for {platform.name}. You can connect manually by entering your access token and user ID from the{' '}
                        <a href={platform.setupUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-cyan-600 dark:hover:text-cyan-200">
                            developer portal <RiExternalLinkLine size={10} className="inline" />
                        </a>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                            <RiKey2Line size={14} className="text-[var(--accent-cyan)]" />
                            Access Token
                        </label>
                        <input
                            type="password"
                            required
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="Paste your access token..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-white/10 rounded-[14px] px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                            <RiUser6Line size={14} className="text-[var(--accent-cyan)]" />
                            User / Page ID
                        </label>
                        <input
                            type="text"
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Your platform user ID"
                            className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-white/10 rounded-[14px] px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                            <RiUser6Line size={14} className="text-[var(--accent-cyan)]" />
                            Username <span className="text-zinc-500 text-[11px] font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@handle or display name"
                            className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-white/10 rounded-[14px] px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-[14px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <PrimaryButton
                        type="submit"
                        disabled={loading}
                        loading={loading}
                        icon={platform.icon}
                        iconColor={platform.color}
                        size="full"
                    >
                        Connect Account
                    </PrimaryButton>
                </form>
            </div>
        </div>
    );
}
