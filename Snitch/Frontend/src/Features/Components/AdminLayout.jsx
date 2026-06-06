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
            <AdminNavbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />

            <main className="flex-1 overflow-y-auto relative p-6 md:p-10">
                <div className="fixed top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
                <div className="fixed bottom-0 left-64 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
