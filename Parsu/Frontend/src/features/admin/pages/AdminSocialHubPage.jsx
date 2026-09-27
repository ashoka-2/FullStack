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
  RiUser3Line,
  RiCheckLine,
  RiAlertLine
} from '@remixicon/react';
import { getAdminSocialConnections, disconnectAdminSocialConnection } from '../service/admin.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const PLATFORM_CONFIG = {
  google:    { label: 'Google',    icon: RiGoogleLine },
  instagram: { label: 'Instagram', icon: RiInstagramLine },
  facebook:  { label: 'Facebook',  icon: RiFacebookCircleLine },
  twitter:   { label: 'Twitter/X', icon: RiTwitterXLine },
  linkedin:  { label: 'LinkedIn',  icon: RiLinkedinBoxLine },
  youtube:   { label: 'YouTube',   icon: RiYoutubeLine },
  tiktok:    { label: 'TikTok',    icon: RiTiktokLine },
  pinterest: { label: 'Pinterest', icon: RiPinterestLine }
};

export default function AdminSocialHubPage() {
  const dispatch = useDispatch();
  const [connections, setConnections] = useState([]);
  const [platformCounts, setPlatformCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [disconnectingId, setDisconnectingId] = useState(null);
  const containerRef = useRef(null);

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

  // GSAP animation for initial cards and row reveal
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.social-hub-item', {
          y: 12,
          opacity: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

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

  return (
    <div ref={containerRef} className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
            <RiShareLine size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Social Hub Operations
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live audit of all user-connected social publishing profiles and access tokens across the platform.
            </p>
          </div>
        </div>
        <button
          onClick={fetchConnections}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
        >
          <RiRefreshLine size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
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

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or handle..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20"
          />
        </form>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Filter active:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 font-semibold font-mono text-[11px]">
            {connections.length} {selectedPlatform !== 'all' ? selectedPlatform : 'total'} connections
          </span>
        </div>
      </div>

      {/* ── Connections Table ── */}
      <div className="rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
        {loading ? (
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
                  <th className="px-5 py-3.5">Platform Handle / ID</th>
                  <th className="px-5 py-3.5">Registered User</th>
                  <th className="px-5 py-3.5">Connected At</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
                {connections.map((conn) => {
                  const cfg = PLATFORM_CONFIG[conn.platform] || {
                    label: conn.platform,
                    icon: RiShareLine
                  };
                  const Icon = cfg.icon;
                  const userObj = conn.user || { username: 'Deleted User', email: 'N/A' };

                  return (
                    <tr key={conn._id} className="social-hub-item hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200">
                            <Icon size={14} />
                          </div>
                          <span className="font-bold capitalize text-zinc-900 dark:text-white">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200">
                          {conn.platformUsername || conn.platformUserId || 'Active Token'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-xs shrink-0">
                            {userObj.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white leading-none">{userObj.username}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{userObj.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">
                        {new Date(conn.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <RiCheckLine size={11} /> Connected
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDisconnect(conn._id, conn.platform, userObj.username)}
                          disabled={disconnectingId === conn._id}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 active:scale-95"
                          title="Revoke / Disconnect account"
                        >
                          <RiDeleteBinLine size={13} />
                          <span>{disconnectingId === conn._id ? 'Unlinking...' : 'Disconnect'}</span>
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
