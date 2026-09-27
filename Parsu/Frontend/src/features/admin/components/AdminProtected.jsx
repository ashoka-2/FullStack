import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router';
import { RiShieldUserLine, RiSparklingFill, RiArrowLeftLine, RiLoader4Line } from '@remixicon/react';
import { claimInitialAdmin } from '../service/admin.api';
import { setUser } from '../../auth/auth.slice';

export default function AdminProtected({ children }) {
    const user = useSelector(state => state.auth.user);
    const loading = useSelector(state => state.auth.loading);
    const dispatch = useDispatch();
    const [claiming, setClaiming] = useState(false);
    const [claimMsg, setClaimMsg] = useState('');
    const [claimErr, setClaimErr] = useState('');
    const [secretInput, setSecretInput] = useState('');

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (user.role === 'admin') {
        return children;
    }

    const handleClaimAdmin = async () => {
        setClaiming(true);
        setClaimMsg('');
        setClaimErr('');
        try {
            const res = await claimInitialAdmin(secretInput);
            if (res.success && res.user) {
                dispatch(setUser({ ...user, role: 'admin' }));
                setClaimMsg(res.message || "Admin privileges granted!");
            }
        } catch (err) {
            setClaimErr(err.response?.data?.message || err.message || "Failed to claim admin status.");
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl text-center space-y-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/80 border border-white/[0.08] flex items-center justify-center text-zinc-200">
                    <RiShieldUserLine size={28} />
                </div>

                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">Parsu AI Admin Portal</h2>
                    <p className="text-xs text-zinc-400 mt-2">
                        Your account (<span className="text-zinc-200 font-semibold">{user.email}</span>) currently has standard <span className="text-zinc-200 font-semibold">User</span> role. Administrator privileges are required to access this dashboard.
                    </p>
                </div>

                {claimMsg && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                        {claimMsg}
                    </div>
                )}

                {claimErr && (
                    <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                        {claimErr}
                    </div>
                )}

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3.5 text-left">
                    <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <RiSparklingFill size={14} className="text-zinc-400" />
                        <span>First-Time Setup / Owner Claim</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                        If no administrator exists yet, you can claim the primary admin role below. If an admin secret key was set in the backend environment, you can enter it here.
                    </p>
                    <input
                        type="password"
                        placeholder="Admin Secret Key (optional)"
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 font-mono"
                    />
                    <button
                        onClick={handleClaimAdmin}
                        disabled={claiming}
                        className="w-full py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                        {claiming ? <RiLoader4Line size={16} className="animate-spin" /> : "Claim Primary Admin Role"}
                    </button>
                </div>

                <div className="pt-2">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                        <RiArrowLeftLine size={14} />
                        <span>Return to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
