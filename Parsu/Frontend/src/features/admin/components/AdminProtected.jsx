import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router';
import { RiShieldUserLine, RiSparklingFill, RiArrowLeftLine, RiLoader4Line } from '@remixicon/react';
import { claimInitialAdmin } from '../service/admin.api';
import { setUser } from '../../auth/auth.slice';

export default function AdminProtected({ children }) {
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();
    const [claiming, setClaiming] = useState(false);
    const [claimMsg, setClaimMsg] = useState('');
    const [claimErr, setClaimErr] = useState('');
    const [secretInput, setSecretInput] = useState('');

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
        <div className="min-h-screen bg-[#0d0f12] text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 border border-white/10 shadow-2xl backdrop-blur-xl text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <RiShieldUserLine size={32} />
                </div>

                <div>
                    <h2 className="text-xl font-bold tracking-tight">Parsu AI Admin Portal</h2>
                    <p className="text-xs text-zinc-400 mt-2">
                        Your account (<span className="text-zinc-200 font-semibold">{user.email}</span>) currently has standard <span className="text-cyan-400 font-semibold">User</span> role. Administrator privileges are required to access this dashboard.
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

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 text-left">
                    <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <RiSparklingFill size={14} className="text-cyan-400" />
                        <span>First-Time Setup / Owner Claim</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                        If no administrator exists yet, you can claim the primary admin role below. If an admin secret key was set in the backend environment, you can enter it here.
                    </p>
                    <input
                        type="password"
                        placeholder="Admin Secret Key (optional)"
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                        onClick={handleClaimAdmin}
                        disabled={claiming}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                        <span>Return to Parsu AI Chat</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
