import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { createPortal } from 'react-dom';
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
  RiFlashlightLine,
  RiDeleteBinLine,
  RiForbidLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiCpuLine,
  RiArrowDownLine
} from '@remixicon/react';
import { useSelector } from 'react-redux';
import {
  getAdminUsers,
  updateUserRole,
  updateUserSubscription,
  deleteAdminUser,
  toggleAdminUserBlock
} from '../service/admin.api';
import DeleteButton from '../../Components/rare-ui/DeleteButton';
import { CircleButton, PillBadge, PillGroup } from '../../Components/PillButton';
import ThemedSkeleton from '../../Components/SkeletonLoader';

export default function AdminUsersPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [subForm, setSubForm] = useState({
    plan: 'free',
    status: 'active',
    billingCycle: 'monthly'
  });
  const [isSavingSub, setIsSavingSub] = useState(false);

  // Refs to avoid stale closures in observer
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  pageRef.current = page;
  hasMoreRef.current = hasMore;
  isLoadingRef.current = isLoading;
  isLoadingMoreRef.current = isLoadingMore;

  // Sentinel ref for infinite scroll observer
  const observerSentinelRef = useRef(null);

  const fetchUsers = async (targetPage = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await getAdminUsers({
        page: targetPage,
        limit: 10,
        search: searchQuery,
        role: roleFilter,
        plan: planFilter
      });

      if (res && (res.success || Array.isArray(res.users) || Array.isArray(res.data?.users))) {
        const rawUsers = res.data?.users || res.users || [];
        const pagination = res.data?.pagination || res.pagination || {};
        const total = pagination.totalUsers ?? pagination.total ?? rawUsers.length;
        const currentPage = pagination.currentPage ?? pagination.page ?? targetPage;
        const totalPages = pagination.totalPages ?? pagination.pages ?? (Math.ceil(total / 10) || 1);
        const more = pagination.hasMore ?? (currentPage < totalPages);

        if (append) {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u._id));
            const newUsers = rawUsers.filter((u) => !existingIds.has(u._id));
            return [...prev, ...newUsers];
          });
        } else {
          setUsers(rawUsers);
        }

        setPage(currentPage);
        setHasMore(more);
        setTotalCount(total);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to load user records.'
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const containerRef = useRef(null);

  useEffect(() => {
    fetchUsers(1, false);
  }, [searchQuery, roleFilter, planFilter]);

  useEffect(() => {
    if (!isLoading && containerRef.current && users.length > 0 && page === 1) {
      const ctx = gsap.context(() => {
        gsap.from('.admin-user-row', {
          y: 12,
          opacity: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isLoading, page]);

  // Infinite scroll observer setup
  useEffect(() => {
    const element = observerSentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [target] = entries;
        if (target.isIntersecting && hasMoreRef.current && !isLoadingRef.current && !isLoadingMoreRef.current) {
          fetchUsers(pageRef.current + 1, true);
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.05
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Role Promotion / Demotion
  const handleRoleToggle = async (user) => {
    if (currentUser?._id === user._id) {
      alert("You cannot change your own admin status.");
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Are you sure you want to change ${user.username}'s role to "${newRole.toUpperCase()}"?`;
    if (!window.confirm(confirmMsg)) return;

    setActionUserId(user._id);
    try {
      const res = await updateUserRole(user._id, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
        );
        setNotification({
          type: 'success',
          message: `Role for ${user.username} updated to ${newRole}.`
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update user role.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionUserId(null);
    }
  };

  // Block / Unblock User
  const handleToggleBlock = async (user) => {
    if (currentUser?._id === user._id) {
      alert("You cannot block your own account.");
      return;
    }
    const nextState = !user.isBlocked;
    const confirmMsg = `Are you sure you want to ${nextState ? 'BLOCK' : 'UNBLOCK'} ${user.username}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionUserId(user._id);
    try {
      const res = await toggleAdminUserBlock(user._id);
      if (res && res.success) {
        const nextBlocked = res.isBlocked !== undefined 
          ? res.isBlocked 
          : (res.data?.isBlocked !== undefined ? res.data.isBlocked : nextState);
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isBlocked: nextBlocked } : u
          )
        );
        setNotification({
          type: 'success',
          message: `User ${user.username} is now ${nextBlocked ? 'Blocked' : 'Active'}.`
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to toggle user block status.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionUserId(null);
    }
  };

  // Open Subscription Modal
  const openSubscriptionModal = (user) => {
    if (!user) return;
    setEditingUser(user);
    setSubForm({
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active',
      billingCycle: user.subscription?.billingCycle || 'monthly'
    });
  };

  // Save Subscription Plan
  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSavingSub(true);
    try {
      const res = await updateUserSubscription(editingUser._id, subForm);
      if (res && (res.success || res.subscription || res.data?.subscription)) {
        const updatedSubscription = res.subscription || res.data?.subscription || {
          plan: subForm.plan,
          status: subForm.status,
          billingCycle: subForm.billingCycle
        };
        setUsers((prev) =>
          prev.map((u) =>
            u._id === editingUser._id
              ? { ...u, subscription: updatedSubscription }
              : u
          )
        );
        setNotification({
          type: 'success',
          message: `Subscription plan for ${editingUser.username} updated to ${(subForm.plan || 'free').toUpperCase()}.`
        });
        setEditingUser(null);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update subscription.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSavingSub(false);
    }
  };

  // Delete User Confirmation
  const confirmDeleteUser = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminUser(deleteModalUser._id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== deleteModalUser._id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setNotification({
          type: 'success',
          message: `Account ${deleteModalUser.username} has been deleted permanently.`
        });
        setDeleteModalUser(null);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete user.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Direct Delete via Rare UI DeleteButton
  const handleDirectDeleteUser = async (userToDelete) => {
    if (!userToDelete || currentUser?._id === userToDelete._id) return;
    setActionUserId(userToDelete._id);
    try {
      const res = await deleteAdminUser(userToDelete._id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setNotification({
          type: 'success',
          message: `Account ${userToDelete.username} deleted permanently.`
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete user.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionUserId(null);
    }
  };

  const getPlanBadge = (sub) => {
    const plan = sub?.plan || 'free';
    const status = sub?.status || 'active';

    if (plan === 'ultra' || plan === 'enterprise') {
      return (
        <div className="flex flex-col gap-0.5 items-start">
          <PillBadge variant="amber" className="text-[10px] uppercase font-bold">
            <RiVipCrownLine size={12} className="text-amber-400" />
            <span>Ultra Plan</span>
          </PillBadge>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
            {status} • {sub?.billingCycle || 'monthly'}
          </span>
        </div>
      );
    }

    if (plan === 'pro' || plan === 'starter') {
      return (
        <div className="flex flex-col gap-0.5 items-start">
          <PillBadge variant="accent" className="text-[10px] uppercase font-bold">
            <RiSparkling2Line size={12} />
            <span>Pro Plan</span>
          </PillBadge>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
            {status} • {sub?.billingCycle || 'monthly'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5 items-start">
        <PillBadge variant="default" className="text-[10px] uppercase font-medium">
          Free Starter
        </PillBadge>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Standard</span>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span>User Directory & Governance</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Displaying 10 users per batch. Grant subscriptions, promote admins, block or delete accounts.
          </p>
        </div>

        <CircleButton
          onClick={() => fetchUsers(1, false)}
          title="Refresh user directory"
          ariaLabel="Refresh"
        >
          <RiRefreshLine size={15} className={isLoading ? 'animate-spin' : ''} />
        </CircleButton>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            <RiCloseLine size={15} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div className="relative w-full sm:w-80">
          <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 cursor-pointer"
          >
            <option value="">All Plans</option>
            <option value="free">Free Starter</option>
            <option value="pro">Pro Plan</option>
            <option value="ultra">Ultra Plan</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Standard Users</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-white/[0.01]">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-xs">
              {isLoading && users.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="admin-user-row">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <ThemedSkeleton circle width={32} height={32} />
                        <div className="space-y-1.5">
                          <ThemedSkeleton width={110} height={14} />
                          <ThemedSkeleton width={150} height={11} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <ThemedSkeleton width={60} height={20} borderRadius="9999px" />
                    </td>
                    <td className="py-3.5 px-4">
                      <ThemedSkeleton width={75} height={20} borderRadius="9999px" />
                    </td>
                    <td className="py-3.5 px-4">
                      <ThemedSkeleton width={50} height={20} borderRadius="9999px" />
                    </td>
                    <td className="py-3.5 px-4">
                      <ThemedSkeleton width={70} height={14} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ThemedSkeleton width={28} height={28} borderRadius="0.5rem" />
                        <ThemedSkeleton width={28} height={28} borderRadius="0.5rem" />
                        <ThemedSkeleton width={28} height={28} borderRadius="0.5rem" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isBlocked = !!u.isBlocked;
                  const isSelf = currentUser?._id === u._id;
                  const isActing = actionUserId === u._id;

                  return (
                    <tr key={u._id} className="admin-user-row hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                            alt={u.username}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                          />
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isSelf && (
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">(You)</span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status / Blocked Indicator */}
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                            <RiForbidLine size={11} /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <RiCheckboxCircleLine size={11} /> Active
                          </span>
                        )}
                      </td>

                      {/* Subscription Mode */}
                      <td className="py-3.5 px-4">
                        {getPlanBadge(u.subscription)}
                      </td>

                      {/* Role Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isAdmin
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-800 dark:border-white/20'
                              : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                          }`}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. Subscription Button */}
                          <button
                            type="button"
                            onClick={() => openSubscriptionModal(u)}
                            title="Assign Subscription Plan"
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <RiExchangeDollarLine size={15} />
                          </button>

                          {/* 2. Role Toggle (Make Admin / Demote) */}
                          <button
                            type="button"
                            onClick={() => handleRoleToggle(u)}
                            disabled={isActing || isSelf}
                            title={isAdmin ? "Demote to User" : "Promote to Admin"}
                            className={`p-1.5 rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 ${
                              isAdmin
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
                            }`}
                          >
                            <RiShieldStarLine size={15} />
                          </button>

                          {/* 3. Block / Unblock Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(u)}
                            disabled={isActing || isSelf}
                            title={isBlocked ? "Unblock User" : "Block User"}
                            className={`p-1.5 rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 ${
                              isBlocked
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            <RiForbidLine size={15} />
                          </button>

                          {/* 4. Rare UI Animated Delete Button */}
                          {!isSelf && (
                            <DeleteButton
                              size="sm"
                              title={`Delete ${u.username}`}
                              onConfirm={() => handleDirectDeleteUser(u)}
                            />
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sentinel element for infinite scroll observer */}
        <div ref={observerSentinelRef} className="w-full flex items-center justify-center min-h-[16px]">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-semibold py-2">
              <RiLoader4Line size={16} className="animate-spin" />
              <span>Fetching next 10 users...</span>
            </div>
          )}
        </div>

        {/* Load More Button & Status Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-zinc-200 dark:border-white/[0.05] text-xs text-zinc-500 dark:text-zinc-400 gap-3">
          <span>
            Showing <strong className="text-zinc-900 dark:text-white">{users.length}</strong> of <strong className="text-zinc-900 dark:text-white">{totalCount}</strong> users (10 per batch)
          </span>

          {hasMore && (
            <button
              type="button"
              onClick={() => fetchUsers(page + 1, true)}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isLoadingMore ? (
                <>
                  <RiLoader4Line size={14} className="animate-spin" />
                  <span>Loading next 10...</span>
                </>
              ) : (
                <>
                  <RiArrowDownLine size={14} />
                  <span>Load More 10 Users</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Subscription Mode Modal rendered via createPortal at the very top of DOM */}
      {editingUser && createPortal(
        <div
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#11131a] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl relative cursor-default"
          >
            <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                    <RiVipCrownLine size={15} />
                  </div>
                  <span>Assign Subscription</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Update plan tier and privileges for {editingUser.username}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer transition-colors"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Plan Tier</label>
                <select
                  value={subForm.plan}
                  onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
                >
                  <option value="free">Free Starter</option>
                  <option value="pro">Pro Plan</option>
                  <option value="ultra">Ultra Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
                >
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Billing Cycle</label>
                <select
                  value={subForm.billingCycle}
                  onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSub}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer disabled:opacity-50 shadow-sm transition-all active:scale-[0.98]"
                >
                  {isSavingSub ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete User Confirmation Modal rendered via createPortal at top of DOM */}
      {deleteModalUser && createPortal(
        <div
          onClick={() => setDeleteModalUser(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#13141a] border border-red-500/20 p-6 shadow-2xl relative text-center cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <RiAlertLine size={24} />
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Delete User Account?</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-white">{deleteModalUser.username}</strong> ({deleteModalUser.email})? All their chat histories and records will be deleted forever.
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
