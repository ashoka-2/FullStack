import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { flushSync } from 'react-dom';
import AdminNavbar from './AdminNavbar';
import { useAdmin } from '../Admin/Hooks/useAdmin';
import socket from '../../utils/socket';

const AdminLayout = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return true; // Default to dark mode
    });

    const { fetchAll } = useAdmin();

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
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
            {/* Sidebar */}
            <AdminNavbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />

            {/* Scrollable Workspace */}
            <main className="flex-1 overflow-y-auto h-screen relative p-8 md:p-12">
                {/* Background Accent Gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
                
                {/* Main page content outlet */}
                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
