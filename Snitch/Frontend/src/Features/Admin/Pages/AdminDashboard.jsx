import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useAdmin } from '../Hooks/useAdmin';
import { useUsers } from '../../Users/Hooks/useUsers';
import { AdminDashboardSkeleton } from '../../Components/Skeletons';
import PageLoader from '../../Components/PageLoader';

const AdminDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const { categories, units, sizes, colors, brands, loading } = useSelector(state => state.admin);
    const { allUsers, loading: usersLoading } = useSelector(state => state.users);
    const { fetchAll } = useAdmin();
    const { handleFetchAllUsers } = useUsers();

    useEffect(() => {
        fetchAll();
        handleFetchAllUsers();
    }, []);

    if (loading || usersLoading) return <PageLoader skeleton={AdminDashboardSkeleton} />;

    if (user?.role !== 'admin') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background p-10 text-center">
                <i className="ri-lock-2-line text-6xl text-accent mb-4 animate-bounce" />
                <h1 className="text-4xl font-black text-foreground">Access Denied</h1>
                <p className="text-foreground/40 mt-2">Only platform admins can access this area.</p>
            </div>
        );
    }

    const stats = [
        { label: 'Registered Users', count: allUsers.length, icon: 'ri-team-line', path: '/admin/users', color: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
        { label: 'Categories', count: categories.length, icon: 'ri-apps-2-line', path: '/admin/categories', color: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
        { label: 'Brands', count: brands.length, icon: 'ri-award-line', path: '/admin/brands', color: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
        { label: 'System Colors', count: colors.length, icon: 'ri-palette-line', path: '/admin/colors', color: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
        { label: 'System Sizes', count: sizes.length, icon: 'ri-ruler-line', path: '/admin/sizes', color: 'from-purple-500/10 to-violet-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
        { label: 'Measurement Units', count: units.length, icon: 'ri-scales-line', path: '/admin/units', color: 'from-cyan-500/10 to-sky-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <span className="text-[10px] font-black tracking-widest text-accent uppercase">Platform Control</span>
                <h1 className="text-5xl font-black tracking-tighter text-foreground mt-1">Admin Dashboard</h1>
                <p className="text-foreground/40 mt-2">Platform status overview and catalog statistics.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <Link
                        key={idx}
                        to={stat.path}
                        className={`group p-8 rounded-3xl bg-gradient-to-br ${stat.color} border ${stat.border} hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between h-56 relative overflow-hidden`}
                    >
                        {/* Huge background icon */}
                        <i className={`${stat.icon} absolute right-4 bottom-4 text-9xl opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all`} />

                        <div className="flex justify-between items-start">
                            <div className="p-3.5 rounded-2xl bg-surface/50 border border-border-theme/45">
                                <i className={`${stat.icon} text-2xl ${stat.text}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/45 group-hover:text-accent transition-colors flex items-center gap-1">
                                Manage <i className="ri-arrow-right-line" />
                            </span>
                        </div>

                        <div>
                            <p className="text-5xl font-black tracking-tighter text-foreground mb-1">{stat.count}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-foreground/40">{stat.label}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-surface/30 border border-border-theme/60 rounded-3xl p-8 backdrop-blur-md">
                <h2 className="text-xl font-black mb-4">Quick Management</h2>
                <p className="text-sm text-foreground/40 mb-6 font-medium">Access any management page directly from the left sidebar or click one of the stat cards above to begin updating the store taxonomy.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
