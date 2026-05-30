import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';

const SellerRoute = ({ children }) => {
    const { user, loading } = useSelector(state => state.auth);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-accent animate-pulse">Checking Store Authorization...</span>
                </div>
            </div>
        );
    }

    // Admins are allowed to access seller tools as well for debugging and content management.
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default SellerRoute;
