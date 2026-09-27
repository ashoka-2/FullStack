import React, { useState, useEffect } from 'react';
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
  RiUser3Line,
  RiCheckLine,
  RiAlertLine
} from '@remixicon/react';
import { getAdminSocialConnections, disconnectAdminSocialConnection } from '../service/admin.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const PLATFORM_CONFIG = {
  google:    { label: 'Google',    icon: RiGoogleLine,          color: 'text-red-500',    bg: 'bg-red-500/10' },
  instagram: { label: 'Instagram', icon: RiInstagramLine,       color: 'text-pink-500',   bg: 'bg-pink-500/10' },
  facebook:  { label: 'Facebook',  icon: RiFacebookCircleLine,  color: 'text-blue-600',   bg: 'bg-blue-600/10' },
  twitter:   { label: 'Twitter/X', icon: RiTwitterXLine,        color: 'text-zinc-400',   bg: 'bg-zinc-500/10' },
  linkedin:  { label: 'LinkedIn',  icon: RiLinkedinBoxLine,     color: 'text-sky-600',    bg: 'bg-sky-600/10' },
  youtube:   { label: 'YouTube',   icon: RiYoutubeLine,         color: 'text-red-600',    bg: 'bg-red-600/10' },
  tiktok:    { label: 'TikTok',    icon: RiTiktokLine,          color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  pinterest: { label: 'Pinterest', icon: RiPinterestLine,       color: 'text-red-500',    bg: 'bg-red-500/10' }
};

export default function AdminSocialHubPage() {
  const dispatch = useDispatch();
  const [connections, setConnections] = useState([]);
  const [platformCounts, setPlatformCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [disconnectingId, setDisconnectingId] = useState(null);

  const fetchConnections = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [selectedPlatform]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConnections();
  };

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

  const totalAllConnections = Object.values(platformCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
            <RiShareLine size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Social Hub Operations</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Live audit of all user-connected social publishing profiles across the platform
            </p>
          </div>
        </div>
        <button
          onClick={fetchConnections}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RiRefreshLine size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Platform Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = platformCounts[key] || 0;
          const isSelected = selectedPlatform === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedPlatform(isSelected ? 'all' : key)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-500/30 ring-2 ring-cyan-500/20 shadow-xs'
                  : 'bg-[var(--bg-surface)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                  <Icon size={16} className={config.color} />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">{count}</span>
              </div>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] mt-2 capitalize">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)]">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or handle..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-500"
          />
        </form>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="font-semibold">Showing:</span>
          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold">
            {connections.length} {selectedPlatform !== 'all' ? selectedPlatform : 'total'} connections
          </span>
        </div>
      </div>

      {/* ── Connections Table ── */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center">
            <RiRefreshLine size={32} className="animate-spin mx-auto text-cyan-500 mb-3" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Fetching social connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="py-16 text-center px-4">
            <RiAlertLine size={36} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)]">No social connections found</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {searchQuery ? 'Try clearing your search query' : 'Users have not connected any accounts in this category yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3.5 font-bold">Platform</th>
                  <th className="px-5 py-3.5 font-bold">Platform Handle / ID</th>
                  <th className="px-5 py-3.5 font-bold">Registered User</th>
                  <th className="px-5 py-3.5 font-bold">Connected At</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                {connections.map((conn) => {
                  const cfg = PLATFORM_CONFIG[conn.platform] || {
                    label: conn.platform,
                    icon: RiShareLine,
                    color: 'text-cyan-500',
                    bg: 'bg-cyan-500/10'
                  };
                  const Icon = cfg.icon;
                  const userObj = conn.user || { username: 'Deleted User', email: 'N/A' };

                  return (
                    <tr key={conn._id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                            <Icon size={15} className={cfg.color} />
                          </div>
                          <span className="font-bold capitalize">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                          {conn.platformUsername || conn.platformUserId || 'Active Token'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 font-black text-xs shrink-0">
                            {userObj.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-primary)] leading-none">{userObj.username}</p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{userObj.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)]">
                        {new Date(conn.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <RiCheckLine size={11} /> Connected
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDisconnect(conn._id, conn.platform, userObj.username)}
                          disabled={disconnectingId === conn._id}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          title="Revoke / Disconnect account"
                        >
                          <RiDeleteBinLine size={13} />
                          {disconnectingId === conn._id ? 'Unlinking...' : 'Disconnect'}
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
  );
}
