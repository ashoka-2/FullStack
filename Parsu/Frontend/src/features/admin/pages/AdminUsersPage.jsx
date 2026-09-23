import React, { useState, useEffect } from 'react';
import {
  RiUser3Line,
  RiSearchLine,
  RiCheckFill,
  RiLoader4Line,
  RiCloseLine,
  RiRefreshLine,
  RiVipCrownLine,
  RiSparkling2Line,
  RiShieldStarLine,
  RiExchangeDollarLine,
  RiTimeLine,
  RiFlashlightLine
} from '@remixicon/react';
import { useSelector } from 'react-redux';
import { getAdminUsers, updateUserRole, updateUserSubscription } from '../service/admin.api';

export default function AdminUsersPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Subscription change modal state
  const [editingUser, setEditingUser] = useState(null);
  const [subForm, setSubForm] = useState({
    plan: 'free',
    status: 'active',
    billingCycle: 'lifetime'
  });
  const [isSavingSub, setIsSavingSub] = useState(false);

  const loadUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers({
        page,
        limit: 12,
        search: searchQuery,
        role: roleFilter,
        plan: planFilter
      });
      if (res.success) {
        setUsers(res.users);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, planFilter]);

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

  const openSubscriptionModal = (user) => {
    setEditingUser(user);
    setSubForm({
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active',
      billingCycle: user.subscription?.billingCycle || 'lifetime'
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingSub(true);
    try {
      const res = await updateUserSubscription(editingUser._id, subForm);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === editingUser._id
              ? { ...u, subscription: res.subscription }
              : u
          )
        );
        setNotification({
          type: 'success',
          message: `Updated subscription for ${editingUser.username} to ${subForm.plan.toUpperCase()} (${subForm.status})`
        });
        setEditingUser(null);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || "Failed to update subscription."
      });
    } finally {
      setIsSavingSub(false);
      setTimeout(() => setNotification(null), 4500);
    }
  };

  const getPlanBadge = (sub) => {
    const plan = sub?.plan || 'free';
    const status = sub?.status || 'active';

    if (plan === 'enterprise') {
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/30">
            <RiVipCrownLine size={12} className="text-amber-400" />
            Super Hero
          </span>
          <span className="text-[10px] text-zinc-400 capitalize">
            {status} • {sub?.billingCycle || 'perpetual'}
          </span>
        </div>
      );
    }

    if (plan === 'starter' || plan === 'pro') {
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-cyan-500/15 text-[#20b8cd] border border-cyan-500/30">
            <RiFlashlightLine size={12} />
            Web Hero
          </span>
          <span className="text-[10px] text-zinc-400 capitalize">
            {status} • {sub?.billingCycle || 'perpetual'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase bg-white/5 text-zinc-400 border border-white/10">
          Free Starter
        </span>
        <span className="text-[10px] text-zinc-500">Standard Quotas</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>User Directory & Subscriptions</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access governance, subscription mode management, and authentication tracking across all Parsu AI members.
          </p>
        </div>

        <button
          onClick={() => loadUsers(pagination.page)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 border border-white/10 transition-colors cursor-pointer"
        >
          <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            <RiCloseLine size={15} />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#11131a]/80 border border-white/[0.08]">
        <div className="relative w-full sm:w-80">
          <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="">All Subscription Plans</option>
            <option value="free">Free Starter</option>
            <option value="starter">Web Hero (Starter)</option>
            <option value="pro">Web Hero (Pro)</option>
            <option value="enterprise">Super Hero (Enterprise)</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Standard Users</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-[#11131a]/80 border border-white/[0.08] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/[0.01]">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Subscription Mode</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <RiLoader4Line size={24} className="animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isSelf = currentUser?._id === u._id;
                  const isActing = actionUserId === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-5">
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

                      {/* Provider */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          u.authProvider === 'google'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {u.authProvider || 'local'}
                        </span>
                      </td>

                      {/* Verification */}
                      <td className="py-3.5 px-4">
                        {u.verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <RiCheckFill size={13} /> Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">Unverified</span>
                        )}
                      </td>

                      {/* Subscription Mode */}
                      <td className="py-3.5 px-4">
                        {getPlanBadge(u.subscription)}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-[11px] text-zinc-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Role Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isAdmin
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : 'bg-white/5 text-zinc-400 border-white/10'
                          }`}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Change Subscription Mode Button */}
                          <button
                            onClick={() => openSubscriptionModal(u)}
                            title="Change Subscription Mode"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-[#20b8cd] border border-cyan-500/25 transition-all hover:scale-[1.02] cursor-pointer"
                          >
                            <RiExchangeDollarLine size={13} />
                            <span>Subscription</span>
                          </button>

                          {/* Role Toggle Action */}
                          <button
                            onClick={() => handleRoleToggle(u)}
                            disabled={isActing}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                              isAdmin
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 hover:scale-[1.02]'
                            }`}
                          >
                            {isActing ? (
                              <RiLoader4Line size={13} className="animate-spin" />
                            ) : isAdmin ? (
                              'Demote'
                            ) : (
                              'Make Admin'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/[0.05] text-xs text-zinc-400">
            <span>Showing {users.length} of {pagination.total} records</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <span className="px-2 font-mono text-zinc-300">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadUsers(pagination.page + 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Mode Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#11131a] border border-white/10 p-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RiVipCrownLine size={18} className="text-[#20b8cd]" />
                  <span>Change Subscription Mode</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Adjust plan access, quotas, and billing status for this user.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Target User Info */}
            <div className="my-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <img
                src={editingUser.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt={editingUser.username}
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{editingUser.username}</div>
                <div className="text-xs text-zinc-400 truncate">{editingUser.email}</div>
              </div>
            </div>

            {/* Subscription Form */}
            <form onSubmit={handleSaveSubscription} className="space-y-4">
              
              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Subscription Plan / Mode
                </label>
                <select
                  value={subForm.plan}
                  onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="free">Free Starter (50 queries/day, 2 doc uploads)</option>
                  <option value="starter">Web Hero (Unlimited queries, 50 uploads)</option>
                  <option value="enterprise">Super Hero (Unlimited queries & uploads, VIP neural routing)</option>
                </select>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Subscription Status
                </label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="active">Active (Granted Full Plan Features)</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="past_due">Past Due</option>
                </select>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Billing Cycle Mode
                </label>
                <select
                  value={subForm.billingCycle}
                  onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="lifetime">Lifetime / Perpetual License</option>
                  <option value="monthly">Monthly Recurring</option>
                  <option value="annual">Annual Plan</option>
                  <option value="none">None (Complimentary)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSub}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-black shadow-md hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
                >
                  {isSavingSub ? (
                    <>
                      <RiLoader4Line size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <RiCheckFill size={15} />
                      <span>Apply Subscription</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
