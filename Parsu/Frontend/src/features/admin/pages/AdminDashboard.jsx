import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import {
  RiDashboard3Line,
  RiUser3Line,
  RiChat3Line,
  RiShareLine,
  RiMapPinLine,
  RiCalendarLine,
  RiHardDriveLine,
  RiYoutubeLine,
  RiLineChartLine,
  RiRefreshLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiCheckFill,
  RiCloseLine,
  RiArrowLeftLine,
  RiLoader4Line,
  RiAlertLine,
  RiGlobalLine
} from '@remixicon/react';
import ParsuLogo from '../../Components/ParsuLogo';
import { getAdminOverview, getAdminUsers, updateUserRole } from '../service/admin.api';

export default function AdminDashboard() {
  const currentUser = useSelector((state) => state.auth.user);

  // Overview stats & metrics
  const [overview, setOverview] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // User management table state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [actionUserId, setActionUserId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load overview data
  const loadOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await getAdminOverview();
      if (res.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error("Failed to load overview:", err);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // Load users list
  const loadUsers = async (page = 1) => {
    setIsLoadingUsers(true);
    try {
      const res = await getAdminUsers({
        page,
        limit: 10,
        search: searchQuery,
        role: roleFilter
      });
      if (res.success) {
        setUsers(res.users);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter]);

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionUserId(user._id);
    try {
      const res = await updateUserRole(user._id, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
        );
        setNotification({
          type: 'success',
          message: `Updated ${user.username}'s role to ${newRole.toUpperCase()}`
        });
        loadOverview();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || "Failed to update role."
      });
    } finally {
      setActionUserId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#12141a]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-sky-400 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#12141a] rounded-[10px] flex items-center justify-center text-cyan-400">
                  <ParsuLogo size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">Parsu AI</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Admin Portal
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">System Monitoring & Access Governance</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadOverview();
                loadUsers(pagination.page);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Refresh Stats"
            >
              <RiRefreshLine size={16} className={isLoadingOverview ? 'animate-spin' : ''} />
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <RiArrowLeftLine size={14} />
              <span>Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              <RiCloseLine size={16} />
            </button>
          </div>
        )}

        {/* Section 1: KPI Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Users */}
          <div className="p-5 rounded-3xl bg-[#14161f]/70 border border-white/10 hover:border-cyan-500/30 transition-all shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Users</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <RiUser3Line size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {isLoadingOverview ? '...' : overview?.metrics?.totalUsers ?? 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {overview?.metrics?.verifiedUsers ?? 0} verified • {overview?.metrics?.adminUsers ?? 1} admins
              </p>
            </div>
          </div>

          {/* AI Conversations */}
          <div className="p-5 rounded-3xl bg-[#14161f]/70 border border-white/10 hover:border-teal-500/30 transition-all shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">AI Chats & Prompts</span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <RiChat3Line size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {isLoadingOverview ? '...' : overview?.metrics?.totalChats ?? 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {overview?.metrics?.totalMessages ?? 0} messages processed across models
              </p>
            </div>
          </div>

          {/* Connected Social Accounts */}
          <div className="p-5 rounded-3xl bg-[#14161f]/70 border border-white/10 hover:border-indigo-500/30 transition-all shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Social Accounts</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <RiShareLine size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {isLoadingOverview ? '...' : overview?.metrics?.activeSocialConnections ?? 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                YouTube, Instagram, Twitter, Facebook active
              </p>
            </div>
          </div>

          {/* Real-time Traffic */}
          <div className="p-5 rounded-3xl bg-[#14161f]/70 border border-white/10 hover:border-amber-500/30 transition-all shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Google Analytics</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <RiLineChartLine size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-white">
                {isLoadingOverview ? '...' : overview?.analytics?.totalPageviewsThisMonth ?? '350+'}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {overview?.analytics?.activeRealtimeUsers ?? 1} active live users now
              </p>
            </div>
          </div>

        </section>

        {/* Section 2: Google Services & Analytics Matrix */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Google Cloud Integrations Status */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#14161f]/70 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <RiGlobalLine size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Google Cloud Platform Services Status
                </h3>
              </div>
              <span className="text-xs text-zinc-400">Parsu AI Cloud Architecture</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Google Maps API */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <RiMapPinLine size={16} className="text-red-400" />
                    <span>Google Maps Platform</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {overview?.integrations?.googleMaps?.status || "Active"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Maps JavaScript API & Places Autocomplete.
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] text-cyan-400 font-medium">
                  {overview?.integrations?.googleMaps?.freeQuota}
                </div>
              </div>

              {/* YouTube Data API */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <RiYoutubeLine size={16} className="text-red-500" />
                    <span>YouTube Publisher</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    OAuth Ready
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Uploads Videos & Shorts with Native Scheduled Releases.
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                  Direct Live Clickable Links & Zero Server Cron
                </div>
              </div>

              {/* Google Calendar API */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <RiCalendarLine size={16} className="text-blue-400" />
                    <span>Google Calendar API</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Per-User OAuth
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Users authenticate to sync events, social schedules, and AI reminders.
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                  100% Free Quota (1M req/day)
                </div>
              </div>

              {/* Google Drive API */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <RiHardDriveLine size={16} className="text-amber-400" />
                    <span>Google Drive API</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Per-User OAuth
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Users connect Drive files for Parsu AI Vector RAG and document export.
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                  100% Free API (Uses user's Drive storage)
                </div>
              </div>

            </div>
          </div>

          {/* Traffic & Analytics Breakdown */}
          <div className="p-6 rounded-3xl bg-[#14161f]/70 border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <RiLineChartLine size={18} className="text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    GA4 Traffic Monitor
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {overview?.integrations?.googleAnalytics?.measurementId || 'G-PARSUAI'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Average Session Duration</span>
                  <span className="font-bold text-white">
                    {overview?.analytics?.avgSessionDuration || '4m 32s'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Pageviews (30 Days)</span>
                  <span className="font-bold text-cyan-400">
                    {overview?.analytics?.totalPageviewsThisMonth || '350+'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                  Top Referral Channels
                </span>
                <div className="space-y-2">
                  {overview?.analytics?.topTrafficSources?.map((src, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-300">{src.source}</span>
                        <span className="text-zinc-400 font-mono">{src.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full"
                          style={{ width: `${src.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
              💡 <strong>Tip:</strong> Add <code className="bg-black/30 px-1 py-0.5 rounded">VITE_GA_MEASUREMENT_ID</code> to frontend environment to connect your live GA4 production container.
            </div>
          </div>

        </section>

        {/* Section 3: User Governance & Role Management */}
        <section className="p-6 rounded-3xl bg-[#14161f]/70 border border-white/10 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RiShieldUserLine size={20} className="text-cyan-400" />
                <span>User Directory & Role Governance</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Manage accounts, promote administrators, and review account authentication providers.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="user">Users Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      <RiLoader4Line size={24} className="animate-spin mx-auto mb-2 text-cyan-400" />
                      Loading users directory...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isAdmin = u.role === 'admin';
                    const isSelf = currentUser?._id === u._id;
                    const isActing = actionUserId === u._id;

                    return (
                      <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                        
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                              alt={u.username}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {isSelf && (
                                  <span className="text-[10px] text-cyan-400 font-normal">(You)</span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Auth Provider */}
                        <td className="py-3.5 px-4 capitalize">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            u.authProvider === 'google'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {u.authProvider || 'local'}
                          </span>
                        </td>

                        {/* Verification Status */}
                        <td className="py-3.5 px-4">
                          {u.verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <RiCheckFill size={13} /> Verified
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500">Unverified</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Current Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isAdmin
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-white/5 text-zinc-400 border-white/10'
                            }`}
                          >
                            {u.role || 'user'}
                          </span>
                        </td>

                        {/* Role Toggle Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleRoleToggle(u)}
                            disabled={isActing}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                              isAdmin
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-md shadow-cyan-500/10 hover:scale-[1.02]'
                            }`}
                          >
                            {isActing ? (
                              <RiLoader4Line size={13} className="animate-spin" />
                            ) : isAdmin ? (
                              'Demote to User'
                            ) : (
                              'Promote to Admin'
                            )}
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
              <span>Showing {users.length} of {pagination.total} users</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadUsers(pagination.page - 1)}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer text-white"
                >
                  Prev
                </button>
                <span className="px-2 font-mono text-zinc-300">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadUsers(pagination.page + 1)}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-zinc-500">
        Parsu AI Admin Platform • Built with Google Cloud Ecosystem & Intelligent Multi-Channel Operations
      </footer>

    </div>
  );
}
