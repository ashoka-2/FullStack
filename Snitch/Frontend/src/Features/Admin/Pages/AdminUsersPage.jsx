import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useUsers } from '../../Users/Hooks/useUsers';
import PageLoader from '../../Components/PageLoader';

const AdminUsersPage = () => {
    const navigate = useNavigate();
    const { allUsers, loading } = useSelector(state => state.users);
    const { handleFetchAllUsers } = useUsers();
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        handleFetchAllUsers();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-48 bg-surface animate-pulse rounded-lg" />
                <div className="space-y-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface animate-pulse rounded-2xl border border-border-theme" />)}
                </div>
            </div>
        );
    }

    const filteredUsers = allUsers.filter(u => {
        if (!userSearch) return true;
        const q = userSearch.toLowerCase();
        return u.fullname?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <span className="text-[10px] font-black tracking-widest text-accent uppercase">Platform Control</span>
                <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Users</h1>
                <p className="text-foreground/40 mt-2">Manage the platform users, view their activity, and apply restrictions.</p>
            </div>

            {/* Search bar */}
            <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name, email or role…"
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border-theme/50 rounded-2xl text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-foreground/25 font-medium"
                />
            </div>

            <div className="space-y-2">
                {filteredUsers.map(u => {
                    const roleColors = { admin: 'text-violet-400 bg-violet-400/10 border-violet-400/25', seller: 'text-accent bg-accent/10 border-accent/25', buyer: 'text-sky-400 bg-sky-400/10 border-sky-400/25' };
                    const roleIcons  = { admin: 'ri-shield-star-line', seller: 'ri-store-2-line', buyer: 'ri-user-line' };
                    return (
                        <div
                            key={u._id}
                            onClick={() => navigate(`/admin/users/${u._id}`)}
                            className="flex items-center gap-4 p-4 bg-surface/40 hover:bg-surface border border-border-theme/40 hover:border-accent/30 rounded-2xl cursor-pointer transition-all group animate-in fade-in duration-200"
                        >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-background flex-shrink-0 border border-border-theme/40">
                                {u.profilePic
                                    ? <img src={u.profilePic} alt={u.fullname} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center bg-accent/5"><i className="ri-user-3-line text-foreground/30" /></div>}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-sm truncate">{u.fullname}</p>
                                    {u.isBanned && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Banned</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-foreground/40 truncate">{u.email}</p>
                            </div>
                            
                            {/* Verification Status Badge */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {u.verified ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                                        <i className="ri-checkbox-circle-fill text-xs" /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-foreground/30 bg-foreground/5 border border-border-theme/35 px-2.5 py-0.5 rounded-full">
                                        Unverified
                                    </span>
                                )}
                            </div>

                            {/* Role */}
                            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest flex-shrink-0 px-2.5 py-1 rounded-full border ${roleColors[u.role] || 'text-foreground/40'}`}>
                                <i className={roleIcons[u.role] || 'ri-user-line'} />
                                {u.role}
                            </div>
                            
                            {/* Address */}
                            {u.place && <p className="text-[9px] text-foreground/25 hidden xl:block max-w-[140px] truncate">{u.place}</p>}
                            
                            {/* Arrow */}
                            <i className="ri-arrow-right-s-line text-foreground/20 group-hover:text-accent transition-colors flex-shrink-0" />
                        </div>
                    );
                })}
                {filteredUsers.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-3 text-foreground/25">
                        <i className="ri-team-line text-4xl" />
                        <p className="text-sm font-black uppercase tracking-widest">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;
