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
    RiApps2Line,
    RiLoader4Line,
    RiSendPlaneFill,
    RiCheckLine,
    RiFileCopyLine
} from '@remixicon/react';
import { useDispatch, useSelector } from 'react-redux';
import { getConnectedAccounts, disconnectAccount, getOAuthUrl } from '../service/social.api';
import { useSearchParams } from 'react-router';
import gsap from 'gsap';
import { triggerBlobSocialConnected } from '../../../utils/blobReactions';
import Footer from '../../Components/Footer';
import Sidebar from '../../Components/Sidebar';
import ChatNavbar from '../../chat/components/ChatNavbar';
import SocialPlatformCard from '../components/SocialPlatformCard';
import ManualConnectModal from '../components/ManualConnectModal';
import CreatePostModal from '../components/CreatePostModal';
import ThemedSkeleton from '../../Components/SkeletonLoader';
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
        id: 'gmail',
        name: 'Gmail',
        icon: ({ size = 24, className }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
                <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#EA4335"/>
            </svg>
        ),
        gradient: 'from-[#EA4335] to-[#B31412]',
        color: '#EA4335',
        bgGlow: 'rgba(234, 67, 53, 0.15)',
        supports: ['send emails', 'read inbox', 'drafts'],
        setupUrl: 'https://console.cloud.google.com/',
        description: 'Connect personal Gmail to send, draft & automate emails'
    },
    {
        id: 'google_calendar',
        name: 'Google Calendar',
        icon: ({ size = 24, className }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" fill="#4285F4"/>
                <path d="M3 9H21" stroke="#FFFFFF" strokeWidth="2"/>
                <path d="M8 2V5M16 2V5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8" cy="13" r="1.5" fill="#FFFFFF"/>
                <circle cx="12" cy="13" r="1.5" fill="#FFFFFF"/>
                <circle cx="16" cy="13" r="1.5" fill="#FFFFFF"/>
                <circle cx="8" cy="17" r="1.5" fill="#FFFFFF"/>
                <circle cx="12" cy="17" r="1.5" fill="#FFFFFF"/>
            </svg>
        ),
        gradient: 'from-[#4285F4] to-[#1A73E8]',
        color: '#4285F4',
        bgGlow: 'rgba(66, 133, 244, 0.15)',
        supports: ['events', 'meetings', 'reminders'],
        setupUrl: 'https://console.cloud.google.com/',
        description: 'Schedule meetings, view events & manage personal calendar'
    },
    {
        id: 'google_drive',
        name: 'Google Drive',
        icon: ({ size = 24, className }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
                <path d="M8.2 2H15.8L22 13H14.4L8.2 2Z" fill="#F4B400"/>
                <path d="M2 13H9.6L13.4 20H5.8L2 13Z" fill="#0F9D58"/>
                <path d="M14.4 13L18.2 20H10.6L6.8 13H14.4Z" fill="#4285F4"/>
            </svg>
        ),
        gradient: 'from-[#0F9D58] via-[#F4B400] to-[#4285F4]',
        color: '#0F9D58',
        bgGlow: 'rgba(15, 157, 88, 0.15)',
        supports: ['cloud files', 'docs', 'backups'],
        setupUrl: 'https://console.cloud.google.com/',
        description: 'Access, upload & manage cloud files on Google Drive'
    }
];

const SocialConnections = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [manualModal, setManualModal] = useState(null);
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(null);
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
                setAccounts(data.accounts || []);
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
                y: 25,
                duration: 0.5,
                stagger: 0.06,
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

    const copyPrompt = (text) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopiedPrompt(text);
            dispatch(addToast({ type: 'success', message: 'Copied prompt to clipboard!' }));
            setTimeout(() => setCopiedPrompt(null), 2000);
        });
    };

    const isConnected = (platformId) => accounts.find(a => a.platform === platformId);
    const connectedCount = accounts.length;

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--accent-cyan)]/30">
            {/* Quick Switch Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Column */}
            <div className={`flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
                
                {/* Main AI Chatbot Navbar (ChatGPT-style header) */}
                <ChatNavbar
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    title="Social Hub"
                    showShareButton={false}
                    rightSlot={
                        <div className="flex items-center gap-2">
                            {connectedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCreatePostOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 font-bold text-xs shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <RiSendPlaneFill size={13} />
                                    <span className="hidden xs:inline">Create Post</span>
                                </button>
                            )}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                {loading ? (
                                    <ThemedSkeleton width={75} height={14} borderRadius="0.5rem" />
                                ) : (
                                    <>
                                        <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                                        <span>{connectedCount} / {PLATFORMS.length} Active</span>
                                    </>
                                )}
                            </div>
                        </div>
                    }
                />

                {/* Scrollable Content */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <main className="max-w-5xl w-full mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-10">
                        <div ref={containerRef}>
                            
                            {/* Apple-style Hero Section */}
                            <div className="mb-8 sm:mb-12">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] text-[10px] font-extrabold uppercase tracking-widest mb-3">
                                            <RiApps2Line size={12} />
                                            <span>Multi-Channel Automation</span>
                                        </div>
                                        <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
                                            Social Command Center
                                        </h1>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-base mt-1.5 max-w-xl">
                                            Connect your accounts once. Chat with Parsu AI to draft, optimize, and publish high-converting content across all networks.
                                        </p>
                                    </div>

                                    {connectedCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCreatePostOpen(true)}
                                            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-md shrink-0"
                                        >
                                            <RiSendPlaneFill size={15} />
                                            <span>Create & Publish Post</span>
                                        </button>
                                    )}
                                </div>

                                {/* Security Banner */}
                                <div className="mt-6 flex items-center gap-3 bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.07] rounded-2xl px-4 py-3">
                                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <RiShieldLine size={16} />
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                        Encrypted OAuth 2.0 direct authorization. Account tokens are never shared, and access can be revoked anytime.
                                    </p>
                                </div>
                            </div>

                            {/* Platform Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, idx) => (
                                        <div 
                                            key={idx} 
                                            className="p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#121212]/70 flex flex-col justify-between h-[210px] space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <ThemedSkeleton circle width={42} height={42} />
                                                    <div className="space-y-1.5">
                                                        <ThemedSkeleton width={90} height={16} />
                                                        <ThemedSkeleton width={60} height={12} />
                                                    </div>
                                                </div>
                                                <ThemedSkeleton width={55} height={22} borderRadius="9999px" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <ThemedSkeleton width="95%" height={12} />
                                                <ThemedSkeleton width="75%" height={12} />
                                            </div>
                                            <ThemedSkeleton height={36} borderRadius="0.75rem" />
                                        </div>
                                    ))
                                ) : (
                                    PLATFORMS.map((platform) => (
                                        <SocialPlatformCard
                                            key={platform.id}
                                            platform={platform}
                                            connection={isConnected(platform.id)}
                                            isLoading={actionLoading === platform.id}
                                            onConnect={handleConnect}
                                            onDisconnect={handleDisconnect}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Apple Intelligence Feature Card */}
                            <div className="mt-12 bg-white/70 dark:bg-[#121212]/70 backdrop-blur-2xl rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] p-6 sm:p-8 shadow-sm">
                                <div className="flex items-start gap-4 sm:gap-5">
                                    <div className="w-11 h-11 rounded-2xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] flex items-center justify-center shrink-0">
                                        <RiSparklingLine size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-1.5 tracking-tight">
                                            Chat-Driven Social Automation
                                        </h3>
                                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                                            Once connected, simply ask Parsu in any conversation to compose, schedule, or post directly. Tap any prompt to copy:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {[
                                                'Post this to Instagram with viral hashtags',
                                                'Upload this short video to YouTube Shorts',
                                                'Pin this infographic to my Pinterest design board',
                                                'Share this milestone on LinkedIn with key insights',
                                                'Generate 3 caption variants for this product photo',
                                                'Schedule an announcement tweet for tomorrow 9 AM'
                                            ].map((cmd, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => copyPrompt(cmd)}
                                                    className="flex items-center justify-between gap-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.07] px-3.5 py-2.5 rounded-xl border border-zinc-200/60 dark:border-white/[0.06] text-left transition-all cursor-pointer group"
                                                >
                                                    <span className="truncate">"{cmd}"</span>
                                                    {copiedPrompt === cmd ? (
                                                        <RiCheckLine size={14} className="text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <RiFileCopyLine size={14} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-white shrink-0 transition-colors" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>

            {/* Universal Multi-Channel Create Post Modal */}
            {createPostOpen && (
                <CreatePostModal
                    connectedAccounts={accounts}
                    onClose={() => setCreatePostOpen(false)}
                    onSuccess={() => {
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
        </div>
    );
};

export default SocialConnections;
