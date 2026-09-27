import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { createPortal } from 'react-dom';
import {
  RiBugLine,
  RiSearchLine,
  RiFilter3Line,
  RiRefreshLine,
  RiCloseLine,
  RiSendPlaneLine,
  RiLoader4Line,
  RiCheckFill,
  RiAlertLine,
  RiTimeLine,
  RiInformationLine,
  RiCompass3Line,
  RiUser3Line,
  RiChat1Line
} from '@remixicon/react';
import {
  getAdminBugReports,
  updateAdminBugReport,
  deleteAdminBugReport
} from '../service/admin.api';
import DeleteButton from '../../Components/rare-ui/DeleteButton';
import { showToast } from '../../Components/Toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'resolved', label: 'Resolved', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'closed', label: 'Closed', color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
  { value: 'wont_fix', label: "Won't Fix", color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
];

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
};

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'ui', label: '🎨 UI / Visual' },
  { value: 'chat', label: '💬 Chat / AI' },
  { value: 'auth', label: '🔐 Login / Auth' },
  { value: 'voice', label: '🎤 Voice / Speech' },
  { value: 'performance', label: '⚡ Performance' },
  { value: 'billing', label: '💳 Billing / Plan' },
  { value: 'other', label: '🔧 Other' }
];

export default function AdminBugReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');
  const [modalStatus, setModalStatus] = useState('open');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const containerRef = useRef(null);

  const loadReports = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getAdminBugReports({
        page,
        limit: 15,
        status: statusFilter,
        severity: severityFilter,
        category: categoryFilter,
        search: searchQuery
      });
      if (res.success) {
        setReports(res.reports || []);
        setPagination({
          page,
          pages: res.pages || 1,
          total: res.total || 0
        });
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load bug reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReports(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, severityFilter, categoryFilter, searchQuery]);

  // Entrance animations for items
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.bug-report-item', {
          y: 10,
          opacity: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [isLoading]);

  // Open modal & prepopulate
  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setReplyText(report.adminReply || '');
    setAdminNotesText(report.adminNotes || '');
    setModalStatus(report.status || 'open');
  };

  // Quick status change from card
  const handleQuickStatusChange = async (id, newStatus) => {
    setActionId(id);
    try {
      const res = await updateAdminBugReport(id, { status: newStatus });
      if (res.success) {
        showToast('success', `Status updated to ${newStatus}`);
        setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
        if (selectedReport?._id === id) {
          setSelectedReport(prev => ({ ...prev, status: newStatus }));
          setModalStatus(newStatus);
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionId(null);
    }
  };

  // Submit admin reply & status update in modal
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsSendingReply(true);

    try {
      const payload = {
        status: modalStatus,
        adminNotes: adminNotesText,
        adminReply: replyText.trim()
      };

      const res = await updateAdminBugReport(selectedReport._id, payload);
      if (res.success) {
        showToast('success', 'Bug report updated & reply sent to user');
        const updated = res.report;
        setReports(prev => prev.map(r => r._id === updated._id ? updated : r));
        setSelectedReport(updated);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Delete bug report
  const handleDeleteReport = async (id) => {
    setActionId(id);
    try {
      const res = await deleteAdminBugReport(id);
      if (res.success) {
        showToast('success', 'Bug report removed');
        setReports(prev => prev.filter(r => r._id !== id));
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        if (selectedReport?._id === id) setSelectedReport(null);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete report');
    } finally {
      setActionId(null);
    }
  };

  // Metrics calculation
  const metrics = {
    total: pagination.total,
    open: reports.filter(r => r.status === 'open').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };

  return (
    <div ref={containerRef} className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <RiBugLine size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Bug Reports & Issues
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Review user bug reports, track resolution state, and reply directly to users.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadReports(pagination.page)}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <RiRefreshLine size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total Reports</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">{metrics.total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
          <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Open / Pending</p>
          <p className="text-2xl font-bold text-amber-500 mt-1 font-mono">{metrics.open}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
          <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-bold text-blue-500 mt-1 font-mono">{metrics.inProgress}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1 font-mono">{metrics.resolved}</p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by title or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-white/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-all cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-all cursor-pointer"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Reports List ── */}
      {isLoading ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08]">
          <RiLoader4Line size={28} className="animate-spin mx-auto text-zinc-500 mb-2" />
          <p className="text-xs font-semibold text-zinc-500">Loading bug reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center px-4 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08]">
          <RiBugLine size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
          <p className="text-xs font-bold text-zinc-900 dark:text-white">No bug reports found</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {searchQuery || statusFilter !== 'all' ? 'Try clearing filters or search terms' : 'No user bug reports have been reported yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const userObj = report.user || { username: 'Anonymous User', email: 'N/A' };
            const sev = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium;
            const statusConfig = STATUS_OPTIONS.find(s => s.value === report.status) || STATUS_OPTIONS[1];
            const hasReply = Boolean(report.adminReply && report.adminReply.trim());

            return (
              <div
                key={report._id}
                className="bug-report-item p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${sev.bg} ${sev.color}`}>
                      {sev.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 uppercase">
                      {report.category || 'other'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {hasReply && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <RiCheckFill size={10} /> Replied
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      onClick={() => handleOpenDetail(report)}
                      className="font-bold text-sm text-zinc-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer truncate"
                    >
                      {report.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-white/10 dark:text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {userObj.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{userObj.username}</span>
                      <span className="text-zinc-400">({userObj.email})</span>
                    </div>

                    <div className="flex items-center gap-1 text-zinc-400">
                      <RiTimeLine size={12} />
                      <span>{new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick actions */}
                <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200/80 dark:border-white/[0.06]">
                  {/* Quick status selector */}
                  <select
                    value={report.status}
                    onChange={(e) => handleQuickStatusChange(report._id, e.target.value)}
                    disabled={actionId === report._id}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="wont_fix">Won't Fix</option>
                  </select>

                  {/* View & Reply Button */}
                  <button
                    onClick={() => handleOpenDetail(report)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <RiChat1Line size={13} />
                    <span>{hasReply ? 'Edit Reply' : 'View & Reply'}</span>
                  </button>

                  {/* Delete Button */}
                  <DeleteButton
                    size="sm"
                    title="Delete Bug Report"
                    onConfirm={() => handleDeleteReport(report._id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail & Reply Modal ── */}
      {selectedReport && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141517] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                  <RiBugLine size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-md">
                    Bug Details & Reply
                  </h2>
                  <p className="text-[11px] text-zinc-500">ID: {selectedReport._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Report Header Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {selectedReport.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                      {selectedReport.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-red-500 bg-red-500/10">
                      {selectedReport.severity}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </p>

                {/* Steps to reproduce */}
                {selectedReport.stepsToReproduce && (
                  <div className="pt-2 border-t border-zinc-200/80 dark:border-white/5">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Steps to Reproduce</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono bg-white dark:bg-black/40 p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/5">
                      {selectedReport.stepsToReproduce}
                    </p>
                  </div>
                )}

                {/* Expected vs Actual */}
                {(selectedReport.expectedBehavior || selectedReport.actualBehavior) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {selectedReport.expectedBehavior && (
                      <div>
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">Expected Behavior</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-black/40 p-2 rounded-xl border border-zinc-200/80 dark:border-white/5">
                          {selectedReport.expectedBehavior}
                        </p>
                      </div>
                    )}
                    {selectedReport.actualBehavior && (
                      <div>
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">Actual Behavior</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-black/40 p-2 rounded-xl border border-zinc-200/80 dark:border-white/5">
                          {selectedReport.actualBehavior}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-zinc-500">
                  <span>Reporter: <strong className="text-zinc-800 dark:text-zinc-200">{selectedReport.user?.username || 'User'}</strong> ({selectedReport.user?.email})</span>
                  {selectedReport.browserInfo && (
                    <span className="truncate max-w-xs" title={selectedReport.browserInfo}>
                      Browser: {selectedReport.browserInfo.slice(0, 45)}...
                    </span>
                  )}
                </div>
              </div>

              {/* Status Update Control */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Update Resolution Status
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {STATUS_OPTIONS.filter(s => s.value !== 'all').map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setModalStatus(opt.value)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        modalStatus === opt.value
                          ? `${opt.bg} ${opt.color} ring-2 ring-zinc-400/30 font-bold`
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Official Reply Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <RiSendPlaneLine size={14} className="text-blue-500" />
                    <span>Official Reply to User</span>
                    <span className="text-[10px] font-normal text-zinc-400">(Visible to the user on their bug reports page)</span>
                  </label>
                  {selectedReport.adminRepliedAt && (
                    <span className="text-[10px] text-emerald-500 font-mono">
                      Last replied: {new Date(selectedReport.adminRepliedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Explain the fix, provide a workaround, or thank the user for pointing it out..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
                />
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <RiInformationLine size={14} />
                  <span>Internal Admin Notes (Private)</span>
                </label>
                <textarea
                  value={adminNotesText}
                  onChange={(e) => setAdminNotesText(e.target.value)}
                  placeholder="Notes for the dev team, reproduction details, PR links..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 resize-none transition-all"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
                >
                  {isSendingReply ? <RiLoader4Line size={14} className="animate-spin" /> : <RiSendPlaneLine size={14} />}
                  <span>{isSendingReply ? 'Saving...' : 'Send Reply & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
