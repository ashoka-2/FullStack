import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { flushSync } from 'react-dom';
import { useDispatch } from 'react-redux';
import AdminNavbar from './AdminNavbar';
import { useAdmin } from '../Admin/Hooks/useAdmin';
import { prependMessage } from '../Messages/State/messages.slice';
import { applyRealtimeSettings } from '../Settings/State/settings.slice';
import { addToast } from '../../app/toast.slice';
import socket from '../../utils/socket';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return true; // Default to dark mode
    });

    const { fetchAll } = useAdmin();
    const dispatch = useDispatch();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleRealtimeCatalogUpdate = (payload) => {
            if (payload.type === "catalog_update") {
                fetchAll();
            } else if (payload.type === "settings_update") {
                dispatch(applyRealtimeSettings(payload.data));
            } else if (payload.type === "new_message") {
                // ⚡ New inbox message - show toast and add to inbox
                dispatch(prependMessage(payload.data));
                dispatch(addToast({
                    message: `📬 New ${payload.data.type === 'newsletter' ? 'newsletter' : 'contact'} message from ${payload.data.email}`,
                    type: "info"
                }));
            }
        };

        socket.on("realtime_update", handleRealtimeCatalogUpdate);

        return () => {
            socket.off("realtime_update", handleRealtimeCatalogUpdate);
        };
    }, [fetchAll]);

    const toggleTheme = (e) => {
        if (!document.startViewTransition) {
            setIsDarkMode(!isDarkMode);
            return;
        }

        const x = e?.clientX ?? window.innerWidth / 2;
        const y = e?.clientY ?? window.innerHeight / 2;

        document.documentElement.style.setProperty('--click-x', `${x}px`);
        document.documentElement.style.setProperty('--click-y', `${y}px`);

        document.startViewTransition(() => {
            flushSync(() => {
                setIsDarkMode(!isDarkMode);
            });
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
            {/* Backdrop overlay for mobile sidebar drawer */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-all duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar drawer */}
            <AdminNavbar 
                toggleTheme={toggleTheme} 
                isDarkMode={isDarkMode} 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Mobile Header Bar */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-surface border-b border-border-theme z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-10 h-10 rounded-xl border border-border-theme flex items-center justify-center text-foreground hover:text-accent hover:border-accent/40 active:scale-95 transition-all cursor-pointer"
                        aria-label="Open Sidebar"
                    >
                        <i className="ri-menu-2-line text-lg"></i>
                    </button>
                    
                    <span className="font-[900] tracking-[0.2em] uppercase text-sm">
                        SNITCH ADMIN
                    </span>

                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl border border-border-theme flex items-center justify-center text-foreground hover:text-accent hover:border-accent/40 bg-surface/50 active:scale-95 transition-all cursor-pointer"
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? (
                            <i className="ri-sun-fill text-sm"></i>
                        ) : (
                            <i className="ri-moon-fill text-sm"></i>
                        )}
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 md:p-10 min-w-0">
                    {/* Decorative Background Glows */}
                    <div className="fixed top-0 right-0 w-72 md:w-96 h-72 md:h-96 bg-accent/5 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"></div>
                    <div className="fixed bottom-0 left-64 w-72 md:w-96 h-72 md:h-96 bg-accent/5 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"></div>

                    <div className="relative z-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
