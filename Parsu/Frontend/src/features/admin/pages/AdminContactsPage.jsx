import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { createPortal } from 'react-dom';
import {
  RiInboxArchiveLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiCheckFill,
  RiMailLine,
  RiCloseLine,
  RiRefreshLine,
  RiExternalLinkLine
} from '@remixicon/react';
import { getAdminContacts, updateContactStatus, deleteContact } from '../service/admin.api';
import DeleteButton from '../../Components/rare-ui/DeleteButton';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadData = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getAdminContacts({
        page,
        limit: 12,
        status: statusFilter,
        search: searchQuery
      });
      if (res.success) {
        setContacts(res.contacts);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.contact-inquiry-item', {
          y: 12,
          opacity: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isLoading]);

  const handleStatusChange = async (id, newStatus) => {
    setActionId(id);
    try {
      const res = await updateContactStatus(id, { status: newStatus });
      if (res.success) {
        setContacts(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
        if (selectedMessage?._id === id) {
          setSelectedMessage(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact inquiry?")) return;
    setActionId(id);
    try {
      const res = await deleteContact(id);
      if (res.success) {
        setContacts(prev => prev.filter(c => c._id !== id));
        if (selectedMessage?._id === id) setSelectedMessage(null);
      }
    } catch (err) {
      console.error("Failed to delete contact:", err);
    } finally {
      setActionId(null);
    }
  };

  const openMessage = (contact) => {
    setSelectedMessage(contact);
    if (contact.status === 'new') {
      handleStatusChange(contact._id, 'read');
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Contact Inquiries Inbox</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Customer inquiries, support questions, and feedback submitted through the Parsu AI Contact page.
          </p>
        </div>

        <button
          onClick={() => loadData(pagination.page)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer"
        >
          <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
        <div className="relative w-full sm:w-80">
          <RiSearchLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 cursor-pointer"
          >
            <option value="">All Inquiries</option>
            <option value="new">New (Unread)</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      {/* Messages Table & Mobile Cards */}
      <div className="rounded-2xl bg-white dark:bg-[#11131a]/80 border border-zinc-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.05] text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-white/[0.01]">
                <th className="py-3 px-5">Sender</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <RiLoader4Line size={24} className="animate-spin mx-auto mb-2 text-zinc-600 dark:text-zinc-400" />
                    Loading customer inquiries...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No contact messages found.
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => openMessage(c)}
                    className="contact-inquiry-item hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    {/* Sender */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.status === 'new' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{c.email}</div>
                    </td>

                    {/* Subject & Preview */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-zinc-900 dark:text-white truncate">{c.subject}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{c.message}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-mono">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        c.status === 'new'
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-800 dark:border-white/20'
                          : c.status === 'replied'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject)}`}
                          onClick={() => handleStatusChange(c._id, 'replied')}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                          title="Reply via Email"
                        >
                          <RiMailLine size={14} />
                        </a>
                        <DeleteButton
                          size="sm"
                          title="Delete message"
                          onConfirm={() => handleDelete(c._id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-zinc-200 dark:divide-white/[0.05]">
          {isLoading ? (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              <RiLoader4Line size={24} className="animate-spin mx-auto mb-2 text-zinc-600 dark:text-zinc-400" />
              Loading customer inquiries...
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              No contact messages found.
            </div>
          ) : (
            contacts.map((c) => (
              <div
                key={c._id}
                onClick={() => openMessage(c)}
                className="contact-inquiry-item p-4 space-y-2 hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <span>{c.name}</span>
                    {c.status === 'new' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white"></span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    c.status === 'new'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-800 dark:border-white/20'
                      : c.status === 'replied'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{c.subject}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{c.message}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                  <span className="font-mono">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject)}`}
                      onClick={() => handleStatusChange(c._id, 'replied')}
                      className="p-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.08]"
                    >
                      <RiMailLine size={13} />
                    </a>
                    <DeleteButton
                      size="sm"
                      title="Delete message"
                      onConfirm={() => handleDelete(c._id)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-white/[0.05] text-xs text-zinc-500 dark:text-zinc-400">
            <span>Showing {contacts.length} of {pagination.total} inquiries</span>
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

      {/* Message Viewer Modal rendered via createPortal at top of DOM */}
      {selectedMessage && createPortal(
        <div
          onClick={() => setSelectedMessage(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">{selectedMessage.subject}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  From: {selectedMessage.name} (<a href={`mailto:${selectedMessage.email}`} className="text-zinc-900 dark:text-white underline font-mono">{selectedMessage.email}</a>)
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
              {selectedMessage.message}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Status:</span>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleStatusChange(selectedMessage._id, e.target.value)}
                  className="bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 cursor-pointer"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  onClick={() => handleStatusChange(selectedMessage._id, 'replied')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition-all active:scale-[0.98] shadow-sm"
                >
                  <RiMailLine size={14} />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
