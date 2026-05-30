import React from 'react';
import { Outlet } from 'react-router';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
            {/* Sidebar */}
            <AdminNavbar />

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
