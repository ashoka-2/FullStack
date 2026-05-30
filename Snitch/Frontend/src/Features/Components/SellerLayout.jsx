import React from 'react';
import { Outlet } from 'react-router';
import SellerNavbar from './SellerNavbar';

const SellerLayout = () => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)] relative items-start">
            {/* Seller Left Sidebar */}
            <SellerNavbar />

            {/* Scrollable Seller Content Pane */}
            <main className="flex-1 w-full min-w-0 bg-surface/30 dark:bg-surface/10 border border-border-theme/50 dark:border-border-theme/20 rounded-[32px] p-6 md:p-8 relative backdrop-blur-md">
                {/* Background Accent Gradients */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
                
                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SellerLayout;
