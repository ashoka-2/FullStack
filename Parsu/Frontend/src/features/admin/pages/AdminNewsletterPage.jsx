import React, { useState, useEffect } from 'react';
import {
  RiMailSendLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiFileCopyLine,
  RiRefreshLine,
  RiCheckFill
} from '@remixicon/react';
import { getAdminNewsletter, deleteNewsletterSubscriber } from '../service/admin.api';

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadData = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getAdminNewsletter({ page, limit: 15, search: searchQuery });
      if (res.success) {
        setSubscribers(res.subscribers);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load newsletter:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this subscriber from the list?")) return;
    setActionId(id);
    try {
      const res = await deleteNewsletterSubscriber(id);
      if (res.success) {
        setSubscribers(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
    } finally {
      setActionId(null);
    }
  };

  const handleCopyAll = () => {
    const emails = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Newsletter Audience</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Audience mailing list subscribed via Parsu AI landing pages and footer opt-ins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subscribers.length > 0 && (
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              {copied ? <RiCheckFill size={14} className="text-emerald-500" /> : <RiFileCopyLine size={14} />}
              <span>{copied ? 'Copied Emails' : 'Copy All Emails'}</span>
            </button>
          )}

          <button
            onClick={() => loadData(pagination.page)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div className="relative w-full sm:w-80">
          <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search subscriber email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-2xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-white/[0.01]">
                <th className="py-3 px-5">Subscriber Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Date Subscribed</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <RiLoader4Line size={24} className="animate-spin mx-auto mb-2 text-cyan-500" />
                    Loading subscriber directory...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s._id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-zinc-900 dark:text-white">
                      {s.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {s.source || 'website'}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDelete(s._id)}
                        disabled={actionId === s._id}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove subscriber"
                      >
                        {actionId === s._id ? (
                          <RiLoader4Line size={14} className="animate-spin" />
                        ) : (
                          <RiDeleteBinLine size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-white/[0.05] text-xs text-zinc-500 dark:text-zinc-400">
            <span>Showing {subscribers.length} of {pagination.total} subscribers</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadData(pagination.page - 1)}
                className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-white disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <span className="px-2 font-mono text-zinc-600 dark:text-zinc-300">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadData(pagination.page + 1)}
                className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-white disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
