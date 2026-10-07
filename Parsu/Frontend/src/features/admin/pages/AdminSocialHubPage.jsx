import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  RiShareLine,
  RiSearchLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiShieldCheckLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiYoutubeLine,
  RiTiktokLine,
  RiPinterestLine,
  RiGoogleLine,
  RiMailLine,
  RiCalendarLine,
  RiDriveLine,
  RiUser3Line,
  RiCheckLine,
  RiAlertLine,
  RiLock2Line,
  RiLockUnlockLine,
  RiSparklingLine,
  RiToolsLine,
  RiSettings4Line,
  RiCloseLine,
  RiExternalLinkLine,
  RiApps2Line,
  RiInformationLine,
  RiTimeLine
} from '@remixicon/react';
import { 
  getAdminSocialConnections, 
  disconnectAdminSocialConnection,
  getAdminConnectors,
  toggleAdminConnectorLock,
  updateAdminConnector
} from '../service/admin.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const PLATFORM_CONFIG = {
  instagram:       { label: 'Instagram',       icon: RiInstagramLine,      color: '#ee2a7b', bg: 'rgba(238, 42, 123, 0.12)' },
  facebook:        { label: 'Facebook',        icon: RiFacebookCircleLine, color: '#1877F2', bg: 'rgba(24, 119, 242, 0.12)' },
  pinterest:       { label: 'Pinterest',       icon: RiPinterestLine,      color: '#E60023', bg: 'rgba(230, 0, 35, 0.12)' },
  twitter:         { label: 'Twitter/X',       icon: RiTwitterXLine,       color: '#1DA1F2', bg: 'rgba(29, 161, 242, 0.12)' },
  tiktok:          { label: 'TikTok',          icon: RiTiktokLine,         color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.12)' },
  linkedin:        { label: 'LinkedIn',        icon: RiLinkedinBoxLine,    color: '#0A66C2', bg: 'rgba(10, 102, 194, 0.12)' },
  youtube:         { label: 'YouTube',         icon: RiYoutubeLine,        color: '#FF0000', bg: 'rgba(255, 0, 0, 0.12)' },
  gmail:           { label: 'Gmail',           icon: RiMailLine,           color: '#EA4335', bg: 'rgba(234, 67, 53, 0.12)' },
  google_calendar: { label: 'Google Calendar', icon: RiCalendarLine,       color: '#4285F4', bg: 'rgba(66, 133, 244, 0.12)' },
  google_drive:    { label: 'Google Drive',    icon: RiDriveLine,          color: '#0F9D58', bg: 'rgba(15, 157, 88, 0.12)' },
  google:          { label: 'Google',          icon: RiGoogleLine,         color: '#4285F4', bg: 'rgba(66, 133, 244, 0.12)' }
};

export default function AdminSocialHubPage() {
  const dispatch = useDispatch();

  // Active Tab: 'connectors' (Lock Manager) | 'connections' (User Accounts Audit)
  const [activeTab, setActiveTab] = useState('connectors');

  // App Connectors (Lock Governance) state
  const [connectors, setConnectors] = useState([]);
  const [connectorsLoading, setConnectorsLoading] = useState(true);
  const [togglingAppId, setTogglingAppId] = useState(null);
  const [connectorFilter, setConnectorFilter] = useState('all'); // 'all' | 'active' | 'locked' | 'coming_soon'
  const [connectorSearch, setConnectorSearch] = useState('');

  // Edit Modal State
  const [editingConnector, setEditingConnector] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'active', lockReason: '', badgeText: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // User Connections state
  const [connections, setConnections] = useState([]);
  const [platformCounts, setPlatformCounts] = useState({});
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [disconnectingId, setDisconnectingId] = useState(null);

  const containerRef = useRef(null);

  // ── Fetch Connectors Matrix ──────────────────────────────────────────────
  const fetchConnectors = async () => {
    setConnectorsLoading(true);
    try {
      const res = await getAdminConnectors();
      if (res.success) {
        setConnectors(res.data || []);
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to load app connectors matrix'
      }));
    } finally {
      setConnectorsLoading(false);
    }
  };

  // ── Fetch User Connections Telemetry ─────────────────────────────────────
  const fetchConnections = async () => {
    setConnectionsLoading(true);
    try {
      const res = await getAdminSocialConnections({
        platform: selectedPlatform,
        search: searchQuery
      });
      if (res.success) {
        setConnections(res.data.connections || []);
        setPlatformCounts(res.data.platformCounts || {});
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to load social connections'
      }));
    } finally {
      setConnectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  useEffect(() => {
    if (activeTab === 'connections') {
      fetchConnections();
    }
  }, [activeTab, selectedPlatform]);

  // ── 1-Click Fast Lock Toggle ─────────────────────────────────────────────
  const handleToggleLock = async (connector) => {
    setTogglingAppId(connector.appId);
    try {
      const res = await toggleAdminConnectorLock(connector.appId);
      if (res.success) {
        dispatch(addToast({
          type: res.data.isLocked ? 'warning' : 'success',
          title: res.data.isLocked ? 'App Locked' : 'App Unlocked',
          message: res.message
        }));
        setConnectors(prev => prev.map(c => c.appId === connector.appId ? { ...c, ...res.data } : c));
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.message || 'Could not change lock state'
      }));
    } finally {
      setTogglingAppId(null);
    }
  };

  // ── Open Edit Notice Modal ───────────────────────────────────────────────
  const handleOpenEdit = (connector) => {
    setEditingConnector(connector);
    setEditForm({
      status: connector.status || 'active',
      lockReason: connector.lockReason || '',
      badgeText: connector.badgeText || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingConnector) return;
    setSavingEdit(true);
    try {
      const res = await updateAdminConnector(editingConnector.appId, editForm);
      if (res.success) {
        dispatch(addToast({
          type: 'success',
          title: 'Settings Saved',
          message: res.message
        }));
        setConnectors(prev => prev.map(c => c.appId === editingConnector.appId ? { ...c, ...res.data } : c));
        setEditingConnector(null);
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to update connector'
      }));
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Disconnect User Connection ───────────────────────────────────────────
  const handleDisconnect = async (id, platform, username) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform.toUpperCase()} for ${username}?`)) {
      return;
    }
    setDisconnectingId(id);
    try {
      const res = await disconnectAdminSocialConnection(id);
      if (res.success) {
        dispatch(addToast({
          type: 'success',
          title: 'Disconnected',
          message: res.message || 'Connection removed successfully'
        }));
        setConnections(prev => prev.filter(c => c._id !== id));
        setPlatformCounts(prev => ({
          ...prev,
          [platform]: Math.max(0, (prev[platform] || 1) - 1)
        }));
      }
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to disconnect account'
      }));
    } finally {
      setDisconnectingId(null);
    }
  };

  // Filtered connectors
  const filteredConnectors = connectors.filter(c => {
    const matchesFilter = 
      connectorFilter === 'all' ? true :
      connectorFilter === 'active' ? c.status === 'active' :
      connectorFilter === 'locked' ? c.status === 'locked' :
      connectorFilter === 'coming_soon' ? c.status === 'coming_soon' :
      connectorFilter === 'maintenance' ? c.status === 'maintenance' : true;

    const s = connectorSearch.trim().toLowerCase();
    const matchesSearch = !s || 
      c.name.toLowerCase().includes(s) || 
      c.appId.toLowerCase().includes(s) || 
      (c.category && c.category.toLowerCase().includes(s)) ||
      (c.developer && c.developer.toLowerCase().includes(s));

    return matchesFilter && matchesSearch;
  });

  const totalAppsCount = connectors.length;
  const activeAppsCount = connectors.filter(c => c.status === 'active').length;
  const lockedAppsCount = connectors.filter(c => c.isLocked && c.status === 'locked').length;
  const comingSoonCount = connectors.filter(c => c.status === 'coming_soon').length;

  return (
    <div ref={containerRef} className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
            <RiApps2Line size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Connectors & Social Control Matrix
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                Admin Governance
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Lock or unlock developer apps, publish "Coming Soon" notices, or audit live connected profiles in real time.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={activeTab === 'connectors' ? fetchConnectors : fetchConnections}
            disabled={connectorsLoading || connectionsLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
          >
            <RiRefreshLine size={15} className={(connectorsLoading || connectionsLoading) ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── View Switcher Tabs ── */}
      <div className="flex border-b border-zinc-200 dark:border-white/[0.08] gap-2 px-1">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'connectors'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <RiLock2Line size={16} />
          <span>App Lock & Status Manager</span>
          <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300">
            {totalAppsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'connections'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <RiShareLine size={16} />
          <span>Live User Connections</span>
          <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300">
            {connections.length}
          </span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: APP CONNECTORS & LOCK GOVERNANCE                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'connectors' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Developer Apps</span>
                <RiApps2Line size={16} className="text-zinc-400" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-zinc-900 dark:text-white">{totalAppsCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live & Unlocked</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">{activeAppsCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Locked by Admin</span>
                <RiLock2Line size={16} className="text-rose-500" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-rose-600 dark:text-rose-400">{lockedAppsCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Coming Soon</span>
                <RiSparklingLine size={16} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-indigo-600 dark:text-indigo-400">{comingSoonCount}</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
            <div className="relative w-full sm:w-80">
              <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={connectorSearch}
                onChange={(e) => setConnectorSearch(e.target.value)}
                placeholder="Search app by name, category, or id..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Apps' },
                { id: 'active', label: 'Live' },
                { id: 'locked', label: 'Locked' },
                { id: 'coming_soon', label: 'Coming Soon' },
                { id: 'maintenance', label: 'Maintenance' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setConnectorFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    connectorFilter === f.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connectors Grid */}
          {connectorsLoading ? (
            <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08]">
              <RiRefreshLine size={28} className="animate-spin mx-auto text-zinc-500 dark:text-zinc-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loading app connectors matrix...</p>
            </div>
          ) : filteredConnectors.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08]">
              <RiAlertLine size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
              <p className="text-xs font-bold text-zinc-900 dark:text-white">No app connectors match your filter</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Try clearing your search query or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnectors.map((connector) => {
                const conf = PLATFORM_CONFIG[connector.appId] || { label: connector.name, icon: RiApps2Line, color: '#20B8CD', bg: 'rgba(32, 184, 205, 0.12)' };
                const Icon = conf.icon;
                const isToggling = togglingAppId === connector.appId;
                const isLocked = Boolean(connector.isLocked || connector.status !== 'active');

                return (
                  <div
                    key={connector.appId}
                    className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                      isLocked
                        ? 'bg-zinc-50/90 dark:bg-[#12131a]/80 border-amber-500/25 dark:border-amber-500/20'
                        : 'bg-white dark:bg-[#11131a]/85 border-zinc-200 dark:border-white/[0.08] shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Row: App Icon + Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-11 h-11 rounded-2xl flex items-center justify-center border border-zinc-200/80 dark:border-white/10 shrink-0"
                            style={{ backgroundColor: conf.bg }}
                          >
                            <Icon size={22} style={{ color: conf.color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
                                {connector.name}
                              </h3>
                              {connector.setupUrl && (
                                <a 
                                  href={connector.setupUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  title="Developer API Portal"
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                >
                                  <RiExternalLinkLine size={13} />
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              {connector.category} • {connector.developer}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {connector.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live</span>
                          </span>
                        ) : connector.status === 'coming_soon' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                            <RiSparklingLine size={11} />
                            <span>{connector.badgeText || 'Coming Soon'}</span>
                          </span>
                        ) : connector.status === 'maintenance' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            <RiToolsLine size={11} />
                            <span>{connector.badgeText || 'Maintenance'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                            <RiLock2Line size={11} />
                            <span>{connector.badgeText || 'Locked'}</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                        {connector.description}
                      </p>

                      {/* Active Reason Notice if locked or coming soon */}
                      {isLocked && (
                        <div className="flex items-start gap-2 p-2.5 mb-3.5 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-400/[0.06] border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-medium leading-relaxed">
                          <RiInformationLine size={14} className="shrink-0 text-amber-500 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold block text-[10px] uppercase tracking-wider">User-Facing Notice:</span>
                            <span className="line-clamp-2">
                              {connector.lockReason || 'This app integration is currently restricted by the administrator.'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Telemetry info: users connected */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 py-1 border-t border-zinc-100 dark:border-white/[0.04] mb-4">
                        <span>Connected Users:</span>
                        <span className="font-bold font-mono text-zinc-900 dark:text-white">
                          {connector.connectedUsersCount || 0} users
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                      {/* Fast 1-Click Lock/Unlock Toggle */}
                      <button
                        onClick={() => handleToggleLock(connector)}
                        disabled={isToggling}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                          connector.isLocked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 shadow-xs'
                        }`}
                      >
                        {isToggling ? (
                          <RiRefreshLine size={14} className="animate-spin" />
                        ) : connector.isLocked ? (
                          <>
                            <RiLockUnlockLine size={14} />
                            <span>Unlock App</span>
                          </>
                        ) : (
                          <>
                            <RiLock2Line size={14} />
                            <span>Lock App</span>
                          </>
                        )}
                      </button>

                      {/* Configure Notice Button */}
                      <button
                        onClick={() => handleOpenEdit(connector)}
                        title="Configure Notice & Status"
                        className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                      >
                        <RiSettings4Line size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: LIVE USER CONNECTIONS AUDIT                                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Platform Summary Quick Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const count = platformCounts[key] || 0;
              const isSelected = selectedPlatform === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlatform(isSelected ? 'all' : key)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-95 ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xs'
                      : 'bg-white dark:bg-[#11131a]/85 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/10 dark:bg-black/10' : 'bg-zinc-100 dark:bg-white/[0.06]'}`}>
                      <Icon size={16} className={isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-700 dark:text-zinc-200'} />
                    </div>
                    <span className="text-xs font-bold font-mono">{count}</span>
                  </div>
                  <p className="text-[11px] font-semibold mt-2.5 capitalize">{config.label}</p>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
            <div className="relative w-full sm:w-80">
              <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by user or handle..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium">Filter active:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 font-semibold font-mono text-[11px]">
                {connections.length} {selectedPlatform !== 'all' ? selectedPlatform : 'total'} connections
              </span>
            </div>
          </div>

          {/* Connections Table */}
          <div className="rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
            {connectionsLoading ? (
              <div className="py-20 text-center">
                <RiRefreshLine size={28} className="animate-spin mx-auto text-zinc-500 dark:text-zinc-400 mb-2" />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fetching social connections telemetry...</p>
              </div>
            ) : connections.length === 0 ? (
              <div className="py-20 text-center px-4">
                <RiAlertLine size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
                <p className="text-xs font-bold text-zinc-900 dark:text-white">No social connections found</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {searchQuery ? 'Try clearing your search query' : 'Users have not connected any accounts in this category yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="px-5 py-3.5">Platform</th>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Platform Handle</th>
                      <th className="px-5 py-3.5">Connected At</th>
                      <th className="px-5 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.04]">
                    {connections.map((c) => {
                      const conf = PLATFORM_CONFIG[c.platform] || { label: c.platform, icon: RiShareLine };
                      const Icon = conf.icon;
                      const isDeleting = disconnectingId === c._id;

                      return (
                        <tr key={c._id} className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-lg bg-zinc-100 dark:bg-white/[0.06]">
                                <Icon size={14} className="text-zinc-700 dark:text-zinc-300" />
                              </div>
                              <span className="capitalize text-zinc-900 dark:text-white font-semibold">{conf.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {c.user?.profilePic ? (
                                <img src={c.user.profilePic} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                                  {c.user?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-zinc-900 dark:text-white leading-tight">{c.user?.username || 'Anonymous'}</p>
                                <p className="text-[10px] text-zinc-400">{c.user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-zinc-700 dark:text-zinc-300">
                            {c.platformUsername ? `@${c.platformUsername}` : c.platformUserId || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 font-mono">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleDisconnect(c._id, c.platform, c.user?.username || 'user')}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-600 hover:bg-red-500/10 transition-colors text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {isDeleting ? <RiRefreshLine size={13} className="animate-spin" /> : <RiDeleteBinLine size={13} />}
                              <span>Disconnect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CONFIGURE CONNECTOR STATUS & USER NOTICE                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {editingConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#12131a] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingConnector(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <RiCloseLine size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center shrink-0">
                <RiSettings4Line size={20} className="text-zinc-900 dark:text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Configure {editingConnector.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  App ID: <code className="font-mono text-zinc-800 dark:text-zinc-200">{editingConnector.appId}</code>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Platform Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    let defaultBadge = editForm.badgeText;
                    if (nextStatus === 'coming_soon' && (!defaultBadge || defaultBadge === 'Locked by Admin')) defaultBadge = 'Coming Soon';
                    if (nextStatus === 'locked' && (!defaultBadge || defaultBadge === 'Coming Soon')) defaultBadge = 'Locked by Admin';
                    if (nextStatus === 'maintenance') defaultBadge = 'Maintenance';
                    if (nextStatus === 'active') defaultBadge = '';
                    setEditForm(prev => ({ ...prev, status: nextStatus, badgeText: defaultBadge }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
                >
                  <option value="active">🟢 Active (Unlocked & Live for All Users)</option>
                  <option value="locked">🔒 Locked by Admin (Disabled with Notice)</option>
                  <option value="coming_soon">🚀 Coming Soon (Marked as Upcoming)</option>
                  <option value="maintenance">🛠️ Under Maintenance (Temporary Pause)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  User-Facing Notice / Reason
                </label>
                <textarea
                  rows={3}
                  value={editForm.lockReason}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lockReason: e.target.value }))}
                  placeholder="e.g. This app is being upgraded. Integrations will re-open soon."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  This explanation is shown directly to users inside their Social Command Center.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Badge Label (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.badgeText}
                  onChange={(e) => setEditForm(prev => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="e.g. Coming Soon, Locked, Paused"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingConnector(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
