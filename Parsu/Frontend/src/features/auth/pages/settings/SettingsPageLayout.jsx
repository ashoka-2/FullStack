import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from '../../../Components/Sidebar';
import Footer from '../../../Components/Footer';
import ChatNavbar from '../../../chat/components/ChatNavbar';
import useSEO from '../../../../utils/useSEO';

/**
 * SettingsPageLayout
 * Shared layout for all Settings sub-pages.
 * App Shell: outer h-[100dvh] overflow-hidden, ChatNavbar shrink-0 pinned, 
 * inner flex-1 overflow-y-auto data-lenis-prevent for scroll.
 */
const SettingsPageLayout = ({ title, icon: Icon, description, children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);

    useSEO({
        title,
        description: description || `${title} — Manage your Parsu settings.`,
        noIndex: true,
    });

    return (
        <div className="settings-page-shell ui-page flex bg-[var(--bg)] h-[100dvh] overflow-hidden text-[var(--text)] font-sans selection:bg-[var(--accent-soft)]">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main column — dynamic padding based on sidebar collapse */}
            <div className={`flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} transition-[padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)]`}>

                {/* ChatGPT-style AI Chatbot Navbar */}
                <ChatNavbar
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    backLink="/settings"
                    backText="Settings"
                    title={title}
                    showShareButton={false}
                />

                {/* Scrollable content — data-lenis-prevent stops Lenis from intercepting */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col justify-between mu-page-enter">
                    <div className="max-w-[620px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-32">
                        {children}
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default SettingsPageLayout;
