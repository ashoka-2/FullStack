import React, { useState, useEffect } from 'react';
import {
  RiFolder3Line,
  RiImageLine,
  RiVideoLine,
  RiFileTextLine,
  RiSearchLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiAlertLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiGridLine,
  RiListCheck
} from '@remixicon/react';
import { getAdminMediaAssets, deleteAdminMediaAsset } from '../service/admin.api';
import { showToast } from '../../Components/Toast';

export default function AdminMediaVaultPage() {
  const [assets, setAssets] = useState([]);
  const [counts, setCounts] = useState({ total: 0, image: 0, video: 0, document: 0 });
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await getAdminMediaAssets({
        type: activeType,
        search: searchQuery
      });
      if (res.success) {
        setAssets(res.data.assets || []);
        setCounts(res.data.counts || { total: 0, image: 0, video: 0, document: 0 });
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load media vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [activeType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  const handleDelete = async (asset) => {
    const isConfirmed = window.confirm(
      `MODERATION ACTION:\nAre you sure you want to delete this ${asset.fileType} (${asset.name})?\n\nThis will remove it permanently from the CDN and chat history.`
    );
    if (!isConfirmed) return;

    setDeletingId(asset.id);
    try {
      const res = await deleteAdminMediaAsset(asset.messageId || asset.id, {
        fileIndex: asset.fileIndex,
        fileId: asset.fileId,
        documentId: asset.documentId
      });
      if (res.success) {
        showToast('success', res.message || 'Media asset deleted successfully');
        setAssets(prev => prev.filter(a => a.id !== asset.id));
        setCounts(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          [asset.fileType]: Math.max(0, (prev[asset.fileType] || 1) - 1)
        }));
        if (previewAsset?.id === asset.id) {
          setPreviewAsset(null);
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete media asset');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
            <RiFolder3Line size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Platform Media Vault & Moderation</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review, audit and moderate user-uploaded attachments, generated media, and documents across all conversations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[var(--bg-surface)] text-cyan-500 shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Grid View"
            >
              <RiGridLine size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[var(--bg-surface)] text-cyan-500 shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Table View"
            >
              <RiListCheck size={16} />
            </button>
          </div>
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RiRefreshLine size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Counters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'all',      label: 'All Assets', icon: RiFolder3Line, count: counts.total,    color: 'text-cyan-500',   bg: 'bg-cyan-500/10' },
          { key: 'image',    label: 'Images',     icon: RiImageLine,   count: counts.image,    color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
          { key: 'video',    label: 'Videos',     icon: RiVideoLine,   count: counts.video,    color: 'text-amber-500',  bg: 'bg-amber-500/10' },
          { key: 'document', label: 'Documents',  icon: RiFileTextLine,count: counts.document, color: 'text-blue-500',   bg: 'bg-blue-500/10' }
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = activeType === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveType(item.key)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-500/30 ring-2 ring-cyan-500/20 shadow-xs'
                  : 'bg-[var(--bg-surface)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <div>
                <p className="text-[11px] font-bold text-[var(--text-secondary)]">{item.label}</p>
                <p className="text-xl font-black text-[var(--text-primary)] mt-1">{item.count || 0}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${item.bg}`}>
                <Icon size={20} className={item.color} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)]">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name or username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-500"
          />
        </form>
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {assets.length} items loaded
        </span>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="py-20 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)]">
          <RiRefreshLine size={32} className="animate-spin mx-auto text-cyan-500 mb-3" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Scanning media storage and chats...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)]">
          <RiAlertLine size={36} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-bold text-[var(--text-primary)]">No media assets found</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {searchQuery ? 'Try clearing your search query' : 'No user-uploaded or generated files exist in this category yet'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const isImage = asset.fileType === 'image';
            const isVideo = asset.fileType === 'video';
            const userObj = asset.user || { username: 'User' };

            return (
              <div
                key={asset.id}
                className="group relative rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] overflow-hidden transition-all shadow-xs flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : isVideo ? (
                    <video
                      src={asset.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-[var(--text-secondary)]">
                      <RiFileTextLine size={32} className="text-blue-500" />
                      <span className="text-[11px] font-mono text-center truncate max-w-[160px]">{asset.name}</span>
                    </div>
                  )}

                  {/* Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/70 text-white backdrop-blur-md">
                    {asset.fileType}
                  </span>

                  {/* Overlay Action Buttons */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewAsset(asset)}
                      className="p-2 rounded-xl bg-white/90 text-black hover:bg-white transition-all cursor-pointer shadow-md"
                      title="Preview Media"
                    >
                      <RiEyeLine size={16} />
                    </button>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/90 text-black hover:bg-white transition-all cursor-pointer shadow-md"
                      title="Open full CDN link"
                    >
                      <RiExternalLinkLine size={16} />
                    </a>
                  </div>
                </div>

                {/* Info Card Body */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs text-[var(--text-primary)] truncate" title={asset.name}>
                      {asset.name}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                      {formatSize(asset.size)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-primary)]">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-500 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {userObj.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="truncate font-medium">{userObj.username}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(asset)}
                      disabled={deletingId === asset.id}
                      className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title="Delete vulgar or policy-violating file"
                    >
                      <RiDeleteBinLine size={12} />
                      {deletingId === asset.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3.5 font-bold">Asset Preview</th>
                  <th className="px-5 py-3.5 font-bold">File Name & Type</th>
                  <th className="px-5 py-3.5 font-bold">Size</th>
                  <th className="px-5 py-3.5 font-bold">Uploaded By</th>
                  <th className="px-5 py-3.5 font-bold">Chat Thread</th>
                  <th className="px-5 py-3.5 font-bold text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                {assets.map((asset) => {
                  const userObj = asset.user || { username: 'User', email: 'N/A' };
                  return (
                    <tr key={asset.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-5 py-3">
                        <div
                          onClick={() => setPreviewAsset(asset)}
                          className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {asset.fileType === 'image' ? (
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                          ) : asset.fileType === 'video' ? (
                            <RiVideoLine size={20} className="text-amber-500" />
                          ) : (
                            <RiFileTextLine size={20} className="text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-[var(--text-primary)] truncate max-w-xs">{asset.name}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-black bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                          {asset.fileType}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[var(--text-secondary)]">
                        {formatSize(asset.size)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-[var(--text-primary)]">{userObj.username}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{userObj.email}</p>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-secondary)] truncate max-w-xs">
                        {asset.chatTitle || 'Vault Document'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewAsset(asset)}
                            className="p-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] transition-all cursor-pointer"
                            title="Preview Asset"
                          >
                            <RiEyeLine size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            disabled={deletingId === asset.id}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            title="Delete inappropriate content"
                          >
                            <RiDeleteBinLine size={13} />
                            {deletingId === asset.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Lightbox Preview Modal ── */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  {previewAsset.fileType}
                </span>
                <p className="font-bold text-xs text-[var(--text-primary)] truncate max-w-md">
                  {previewAsset.name}
                </p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Media Body */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-[var(--bg-primary)] min-h-[300px]">
              {previewAsset.fileType === 'image' ? (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewAsset.fileType === 'video' ? (
                <video
                  src={previewAsset.url}
                  controls
                  autoPlay
                  className="max-h-[60vh] max-w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <RiFileTextLine size={48} className="mx-auto text-blue-500" />
                  <p className="font-bold text-sm text-[var(--text-primary)]">{previewAsset.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatSize(previewAsset.size)}</p>
                  <a
                    href={previewAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-colors"
                  >
                    <RiExternalLinkLine size={14} /> Open Document
                  </a>
                </div>
              )}
            </div>

            {/* Footer with moderation controls */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <div className="text-xs text-[var(--text-secondary)]">
                Uploaded by <span className="font-bold text-[var(--text-primary)]">{previewAsset.user?.username || 'User'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-primary)] transition-all flex items-center gap-1"
                >
                  <RiExternalLinkLine size={13} /> Full CDN Link
                </a>
                <button
                  onClick={() => handleDelete(previewAsset)}
                  disabled={deletingId === previewAsset.id}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <RiDeleteBinLine size={14} />
                  {deletingId === previewAsset.id ? 'Deleting...' : 'Delete Content'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
