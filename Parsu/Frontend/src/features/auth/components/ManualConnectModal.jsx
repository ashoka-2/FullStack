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
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#141414] border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 shadow-2xl">
                {/* Close */}
                <button 
                    type="button"
                    onClick={onClose} 
                    className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                >
                    <RiCloseLine size={22} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center text-white shadow-lg`}>
                        <platform.icon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-200">Connect {platform.name}</h2>
                        <p className="text-xs text-zinc-500">Manual token connection</p>
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3 mb-6">
                    <RiLockLine className="text-blue-400 shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] text-blue-400 leading-relaxed font-medium">
                        OAuth is not configured for {platform.name}. You can connect manually by entering your access token and user ID from the{' '}
                        <a href={platform.setupUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-300">
                            developer portal <RiExternalLinkLine size={10} className="inline" />
                        </a>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">
                            <RiKey2Line size={14} className="text-[#60A6AF]" />
                            Access Token
                        </label>
                        <input
                            type="password"
                            required
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="Paste your access token..."
                            className="w-full bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#60A6AF] transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">
                            <RiUser6Line size={14} className="text-[#60A6AF]" />
                            User / Page ID
                        </label>
                        <input
                            type="text"
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Your platform user ID"
                            className="w-full bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#60A6AF] transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">
                            <RiUser6Line size={14} className="text-[#60A6AF]" />
                            Username <span className="text-zinc-500 text-xs font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@handle or display name"
                            className="w-full bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#60A6AF] transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold">
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
