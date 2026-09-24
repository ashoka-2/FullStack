import React, { useState, useEffect, useRef } from 'react';
import {
    RiInstagramLine,
    RiFacebookCircleLine,
    RiPinterestLine,
    RiTwitterXLine,
    RiTiktokLine,
    RiLinkedinBoxLine,
    RiYoutubeLine,
    RiShieldLine,
    RiSparklingLine,
    RiInformationLine,
    RiApps2Line,
    RiMenuLine,
    RiLoader4Line,
    RiSendPlaneFill,
    RiSideBarLine
} from '@remixicon/react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebarCollapse } from '../../chat/chat.slice';
import { getConnectedAccounts, disconnectAccount, getOAuthUrl } from '../service/social.api';
import { useSearchParams } from 'react-router';
import gsap from 'gsap';
import { triggerBlobSocialConnected } from '../../../utils/blobReactions';
import Footer from '../../Components/Footer';
import Sidebar from '../../Components/Sidebar';
import SocialPlatformCard from '../components/SocialPlatformCard';
import ManualConnectModal from '../components/ManualConnectModal';
import CreatePostModal from '../components/CreatePostModal';
import { addToast } from '../../../utils/toast.slice';

// Platform configuration with colors, icons, and info
const PLATFORMS = [
    {
        id: 'instagram',
        name: 'Instagram',
        icon: RiInstagramLine,
        gradient: 'from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
        color: '#ee2a7b',
        bgGlow: 'rgba(238, 42, 123, 0.15)',
        supports: ['photos', 'videos', 'reels'],
        setupUrl: 'https://developers.facebook.com/',
        description: 'Share photos, reels, and stories'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: RiFacebookCircleLine,
        gradient: 'from-[#1877F2] to-[#0C5DC7]',
        color: '#1877F2',
        bgGlow: 'rgba(24, 119, 242, 0.15)',
        supports: ['photos', 'videos', 'posts'],
        setupUrl: 'https://developers.facebook.com/',
        description: 'Post to pages and profiles'
    },
    {
        id: 'pinterest',
        name: 'Pinterest',
        icon: RiPinterestLine,
        gradient: 'from-[#E60023] to-[#BD001A]',
        color: '#E60023',
        bgGlow: 'rgba(230, 0, 35, 0.15)',
        supports: ['pins', 'photos', 'boards'],
        setupUrl: 'https://developers.pinterest.com/',
        description: 'Pin images to your boards'
    },
    {
        id: 'twitter',
        name: 'X (Twitter)',
        icon: RiTwitterXLine,
        gradient: 'from-[#1DA1F2] to-[#0d8bd9]',
        color: '#1DA1F2',
        bgGlow: 'rgba(29, 161, 242, 0.15)',
        supports: ['tweets', 'photos', 'threads'],
        setupUrl: 'https://developer.x.com/',
        description: 'Post tweets with media'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: RiTiktokLine,
        gradient: 'from-[#00f2fe] to-[#4facfe]',
        color: '#00f2fe',
        bgGlow: 'rgba(0, 242, 254, 0.15)',
        supports: ['videos', 'short-form'],
        setupUrl: 'https://developers.tiktok.com/',
        description: 'Publish short-form videos'
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: RiLinkedinBoxLine,
        gradient: 'from-[#0A66C2] to-[#004182]',
        color: '#0A66C2',
        bgGlow: 'rgba(10, 102, 194, 0.15)',
        supports: ['posts', 'articles', 'photos'],
        setupUrl: 'https://www.linkedin.com/developers/',
        description: 'Share professional updates'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: RiYoutubeLine,
        gradient: 'from-[#FF0000] to-[#CC0000]',
        color: '#FF0000',
        bgGlow: 'rgba(255, 0, 0, 0.15)',
        supports: ['videos', 'shorts'],
        setupUrl: 'https://console.cloud.google.com/',
        description: 'Upload videos and shorts'
    },
    {
        id: 'google',
        name: 'Google Workspace',
        icon: ({ size = 24, className }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
        ),
        gradient: 'from-[#4285F4] via-[#34A853] to-[#EA4335]',
        color: '#4285F4',
        bgGlow: 'rgba(66, 133, 244, 0.15)',
        supports: ['gmail', 'calendar', 'drive'],
        setupUrl: 'https://console.cloud.google.com/',
        description: 'Connect personal Gmail, Calendar & Drive'
    }
];

const SocialConnections = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [manualModal, setManualModal] = useState(null);
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const containerRef = useRef(null);
    const dispatch = useDispatch();
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);

    useEffect(() => {
        fetchAccounts();
        handleOAuthCallback();
    }, []);

    const handleOAuthCallback = () => {
        const connected = searchParams.get('connected');
        const error = searchParams.get('error');

        if (connected) {
            dispatch(addToast({ type: 'success', message: `Successfully connected ${connected.toUpperCase()}!` }));
            triggerBlobSocialConnected(connected);
            searchParams.delete('connected');
            setSearchParams(searchParams, { replace: true });
        }
        if (error) {
            dispatch(addToast({ type: 'error', message: `Failed to connect: ${error}` }));
            searchParams.delete('error');
            setSearchParams(searchParams, { replace: true });
        }
    };

    const fetchAccounts = async () => {
        try {
            const data = await getConnectedAccounts();
            if (data.success) {
                setAccounts(data.accounts);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.from(containerRef.current.children, {
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out'
            });
        }
    }, [loading]);

    const handleConnect = async (platform) => {
        setActionLoading(platform.id);
        try {
            const data = await getOAuthUrl(platform.id);
            const redirectUrl = data.authUrl || data.url;
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else if (data.manual) {
                setManualModal(platform);
                setActionLoading(null);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Connection failed';
            if (msg.includes('not configured')) {
                setManualModal(platform);
            } else {
                dispatch(addToast({ type: 'error', message: msg }));
            }
            setActionLoading(null);
        }
    };

    const handleDisconnect = async (platformId) => {
        setActionLoading(platformId);
        try {
            await disconnectAccount(platformId);
            setAccounts(prev => prev.filter(a => a.platform !== platformId));
            dispatch(addToast({ type: 'success', message: `Disconnected from ${platformId}` }));
        } catch (err) {
            dispatch(addToast({ type: 'error', message: 'Failed to disconnect' }));
        } finally {
            setActionLoading(null);
        }
    };

    const isConnected = (platformId) => accounts.find(a => a.platform === platformId);
    const connectedCount = accounts.length;

    if (loading) {
        return (
            <div className="h-[100dvh] bg-[var(--bg-primary)] flex items-center justify-center">
                <RiLoader4Line className="animate-spin w-8 h-8 text-[var(--accent-cyan)]" />
            </div>
        );
    }

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30">
            {/* Quick Switch Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Column — dynamic padding based on sidebar collapse */}
            <div className={`flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
                {/* Header — shrink-0: naturally pinned, column never scrolls */}
                <header className="shrink-0 z-30 bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-white/[0.08] px-3.5 sm:px-8 h-12 sm:h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-1.5 sm:p-2 -ml-1 text-zinc-400 hover:text-white transition-all cursor-pointer rounded-xl hover:bg-white/[0.06] active:scale-95"
                            title="Open Sidebar"
                        >
                            <RiMenuLine size={20} />
                        </button>

                        <h1 className="text-sm sm:text-base font-bold text-zinc-100">
                            Social Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {connectedCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setCreatePostOpen(true)}
                                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <RiSendPlaneFill size={13} />
                                <span className="hidden xs:inline">Create Post</span>
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/10 text-[10px] sm:text-xs font-bold shadow-xs">
                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                            <span>{connectedCount} <span className="hidden sm:inline">of {PLATFORMS.length}</span> Connected</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content — only this area scrolls */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-8 md:px-12 py-5 sm:py-10">
                    <div ref={containerRef}>
                        {/* Hero Section */}
                        <div className="mb-8 sm:mb-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
                                <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[24px] bg-gradient-to-tr from-[var(--color-clear-hanada)] to-[var(--accent-cyan)] flex items-center justify-center text-white shadow-[0_8px_30px_rgba(32,184,205,0.3)] shrink-0 mt-0.5 sm:mt-0">
                                        <RiApps2Line size={24} className="sm:hidden" />
                                        <RiApps2Line size={34} className="hidden sm:block" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                                            Social <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-clear-hanada)] to-[var(--accent-cyan)]">Command Center</span>
                                        </h1>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-base mt-1">
                                            Connect your accounts once. Publish everywhere with AI.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCreatePostOpen(true)}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--color-light-blue)] hover:from-[var(--accent-cyan-hover)] hover:to-[var(--color-blue)] text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                                >
                                    <RiSendPlaneFill size={16} />
                                    <span>Create & Publish Post</span>
                                </button>
                            </div>

                            {/* Security banner */}
                            <div className="mt-6 flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-5 py-3">
                                <RiShieldLine className="text-emerald-500 shrink-0" size={18} />
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    Encrypted OAuth 2.0 connection. Your passwords are never stored. You can revoke access anytime.
                                </p>
                            </div>
                        </div>

                        {/* Platform Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PLATFORMS.map((platform) => (
                                <SocialPlatformCard
                                    key={platform.id}
                                    platform={platform}
                                    connection={isConnected(platform.id)}
                                    isLoading={actionLoading === platform.id}
                                    onConnect={handleConnect}
                                    onDisconnect={handleDisconnect}
                                />
                            ))}
                        </div>

                        {/* AI Assistant Hint Card */}
                        <div className="mt-12 bg-white dark:bg-zinc-900/40 backdrop-blur-xl rounded-[32px] border border-zinc-200 dark:border-white/8 p-8 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--color-clear-hanada)]/10 flex items-center justify-center text-[var(--color-clear-hanada)] shrink-0">
                                    <RiSparklingLine size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-200 mb-2">AI-Powered Publishing</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                                        Once connected, go back to any chat and tell the AI assistant what to do. Upload an image, and ask it to:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[
                                            '"Post this to Instagram with a viral caption"',
                                            '"Upload this video to YouTube"',
                                            '"Pin this image to my Pinterest board"',
                                            '"Share this on LinkedIn professionally"',
                                            '"Generate a caption for this photo"',
                                            '"Improve my caption with trending hashtags"'
                                        ].map((cmd, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                <span className="text-[var(--color-clear-hanada)]">→</span>
                                                <span>{cmd}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
                </div>{/* end scrollable */}
            </div>

            {/* Universal Multi-Channel Create Post Modal (TryPost Style) */}
            {createPostOpen && (
                <CreatePostModal
                    connectedAccounts={accounts}
                    onClose={() => setCreatePostOpen(false)}
                    onSuccess={(res) => {
                        dispatch(addToast({ type: 'success', message: 'Published successfully across selected channels!' }));
                        setCreatePostOpen(false);
                    }}
                />
            )}

            {/* Manual Connect Modal */}
            {manualModal && (
                <ManualConnectModal
                    platform={manualModal}
                    onClose={() => setManualModal(null)}
                    onConnected={(account) => {
                        setAccounts(prev => [...prev.filter(a => a.platform !== account.platform), { ...account, isConnected: true, connectedAt: new Date().toISOString() }]);
                        setManualModal(null);
                        dispatch(addToast({ type: 'success', message: `${manualModal.name} connected manually!` }));
                    }}
                />
            )}

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                />
            )}
        </div>
    );
};

export default SocialConnections;
