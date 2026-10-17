import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import Sidebar from '../../Components/Sidebar';
import Footer from '../../Components/Footer';
import ChatNavbar from '../../chat/components/ChatNavbar';
import {
    RiUserLine,
    RiLockPasswordLine,
    RiKeyLine,
    RiGhost2Line,
    RiVoiceprintLine,
    RiApps2Line,
    RiVipCrownLine,
    RiBrainLine,
    RiSettings3Line,
    RiShieldLine,
    RiHardDriveLine,
    RiBugLine,
    RiLogoutBoxRLine,
    RiNotificationLine,
    RiComputerLine,
    RiCompass3Line,
} from '@remixicon/react';
import { useAuth } from '../hook/useAuth';
import ConfirmationModal from '../../Components/ConfirmationModal';
import { Group, GroupLabel, Row } from '../../Components/GroupedList';
import gsap from 'gsap';

const SETTING_GROUPS = [
    {
        label: 'Account',
        items: [
            {
                to: '/settings/subscription',
                icon: RiVipCrownLine,
                title: 'Plan & Quotas',
                description: 'View active plan, daily query limits and resource quotas.',
                accent: true,
            },
            {
                to: '/settings/profile',
                icon: RiUserLine,
                title: 'Profile',
                description: 'Display name, avatar, bio and account details.',
            },
            {
                to: '/settings/password',
                icon: RiLockPasswordLine,
                title: 'Change Password',
                description: 'Manage account credentials and security.',
            },
            {
                to: '/settings/api-keys',
                icon: RiKeyLine,
                title: 'AI Models & API Keys',
                description: 'Add custom BYOK keys for Gemini, Claude, OpenAI, DeepSeek & Groq.',
            },
        ],
    },
    {
        label: 'Preferences',
        items: [
            {
                to: '/settings/memory',
                icon: RiBrainLine,
                title: 'Memory',
                description: 'Control what Parsu AI learns about you and custom instructions.',
            },
            {
                to: '/settings/general',
                icon: RiSettings3Line,
                title: 'General',
                description: 'Theme, haptic feedback and web search settings.',
            },
            {
                to: '/settings/notifications',
                icon: RiNotificationLine,
                title: 'Notifications',
                description: 'Manage push alerts, sounds and system updates.',
            },
            {
                to: '/settings/safety',
                icon: RiShieldLine,
                title: 'Safety & Content Filters',
                description: 'Filter sensitive or restricted AI generation.',
            },
        ],
    },
    {
        label: 'AI & Media',
        items: [
            {
                to: '/settings/mascot',
                icon: RiGhost2Line,
                title: 'Mascot Companion',
                description: 'Customize floating JellyBlob size, mood and physics behavior.',
            },
            {
                to: '/settings/voice',
                icon: RiVoiceprintLine,
                title: 'Voice & Speech',
                description: 'Configure conversational voice responses and audio input.',
            },
            {
                to: '/settings/storage',
                icon: RiHardDriveLine,
                title: 'Storage & Media',
                description: 'View and manage uploaded images, documents and video files.',
            },
            {
                to: '/social-connections',
                icon: RiApps2Line,
                title: 'Social Connections',
                description: 'Link YouTube, Instagram, Twitter/X and LinkedIn channels.',
            },
            {
                to: '/settings/devices',
                icon: RiComputerLine,
                title: 'Connected Devices',
                description: 'Cross-device control agent for Windows, macOS & Android.',
            },
        ],
    },
    {
        label: 'Support & Session',
        items: [
            {
                to: '/settings/guide',
                icon: RiCompass3Line,
                title: 'AI Guide & Tours',
                description: 'Interactive walkthroughs, feature guides, and shortcut cheat-sheets.',
            },
            {
                to: '/settings/report-bug',
                icon: RiBugLine,
                title: 'Report a Bug',
                description: 'Send feedback and bug reports directly to the Parsu team.',
            },
        ],
    },
];

const Settings = () => {
    const { user } = useSelector(state => state.auth);
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
    const { handleLogout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        if (!contentRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.settings-group-item',
                { opacity: 0, y: 12 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.35,
                    stagger: 0.05,
                    ease: 'power2.out',
                    clearProps: 'all'
                }
            );
        }, contentRef);

        return () => ctx.revert();
    }, []);

    const userInitial = (user?.name || user?.username || 'U')[0].toUpperCase();
    const planName = (user?.subscription?.plan || 'Free').toUpperCase();

    return (
        <div className="settings-hub ui-page flex bg-[var(--bg)] h-[100dvh] overflow-hidden text-[var(--text)] font-sans selection:bg-[var(--accent-soft)]">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main column */}
            <div className={`flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)]`}>

                <ChatNavbar
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    title="Settings"
                    showShareButton={false}
                />

                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col justify-between">
                    <div ref={contentRef} className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 pb-32">

                        {/* Minimal AI-UI Profile Card (Avatar + Identity + Plan Chip) */}
                        {user && (
                            <div className="settings-group-item mb-8 p-4 sm:p-5 rounded-[28px] bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between gap-4 select-none">
                                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent-text)] font-semibold text-lg sm:text-xl shrink-0">
                                        {userInitial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-base sm:text-lg text-[var(--text)] truncate">
                                            {user.name || user.username}
                                        </p>
                                        <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        to="/settings/subscription"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--line)] text-xs font-semibold text-[var(--accent-text)] transition-colors"
                                    >
                                        <RiVipCrownLine size={14} />
                                        <span>{planName}</span>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Grouped List Rows */}
                        {SETTING_GROUPS.map(({ label, items }) => (
                            <div key={label} className="settings-group-item mb-7">
                                <GroupLabel>{label}</GroupLabel>
                                <Group>
                                    {items.map(({ to, icon, title, description, accent }) => (
                                        <Row
                                            key={to}
                                            to={to}
                                            icon={icon}
                                            label={title}
                                            description={description}
                                            accent={accent}
                                        />
                                    ))}
                                </Group>
                            </div>
                        ))}

                        {/* Sign Out Row as single destructive row */}
                        {user && (
                            <div className="settings-group-item mb-8">
                                <GroupLabel>Session</GroupLabel>
                                <Group>
                                    <Row
                                        icon={RiLogoutBoxRLine}
                                        label="Log Out of Parsu AI"
                                        description="End your session on this device. You can log back in at any time."
                                        destructive={true}
                                        onClick={() => setShowLogoutModal(true)}
                                    />
                                </Group>
                            </div>
                        )}

                    </div>
                    <Footer />
                </div>
            </div>

            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={async () => {
                    setShowLogoutModal(false);
                    await handleLogout();
                }}
                title="Log Out of Parsu AI?"
                message="Are you sure you want to end your session? You will be returned to the sign-in screen."
                confirmText="Log Out"
            />
        </div>
    );
};

export default Settings;
