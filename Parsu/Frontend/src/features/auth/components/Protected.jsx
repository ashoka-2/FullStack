import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router'

const Protected = ({children}) => {
    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)
    const location = useLocation()

    // If user is already available (synchronously cached), proceed immediately
    if (user) {
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return children;
    }

    // While initial auth is verifying on page refresh/reload, don't redirect away
    if (loading) {
        return (
            <div className="min-h-screen w-full bg-[var(--bg)] flex items-center justify-center p-6">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[var(--accent-cyan)] animate-spin" />
            </div>
        );
    }

    // Admins should only use the admin console — redirect away from user routes
    if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children
}

export default Protected