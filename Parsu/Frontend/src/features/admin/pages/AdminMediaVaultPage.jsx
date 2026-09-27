import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
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
  RiGridLine,
  RiListCheck,
  RiPlayFill,
  RiFilePdfLine
} from '@remixicon/react';
import { getAdminMediaAssets, deleteAdminMediaAsset } from '../service/admin.api';
import DeleteButton from '../../Components/rare-ui/DeleteButton';
import { showToast } from '../../Components/Toast';

/**
 * Bulletproof Media Card Preview
 * Handles decoding first-frame for video (#t=0.001), hover preview playback,
 * and graceful fallback for broken/unloaded images instead of pitch black void.
 */
function MediaCardPreview({ asset }) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const url = asset.url || '';
  const name = asset.name || '';

  // Smart heuristic detection: URL extension overrides fallback fileType
  const isDoc = asset.fileType === 'document' || /\.(pdf|txt|md|doc|docx)(\?|$)/i.test(url) || /\.(pdf|txt|md|doc|docx)$/i.test(name);
  const isVideo = (asset.fileType === 'video' || /\.(mp4|mov|webm|mkv|avi)(\?|$)/i.test(url) || /\.(mp4|mov|webm|mkv|avi)$/i.test(name)) && !/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|$)/i.test(url) && !isDoc;
  const isImage = (asset.fileType === 'image' || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|$)/i.test(url) || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i.test(name)) && !isVideo && !isDoc;

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0.001;
      setIsPlaying(false);
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900/60 p-3 text-center">
        {isVideo ? (
          <RiVideoLine size={28} className="text-zinc-400 mb-1" />
        ) : isDoc ? (
          <RiFilePdfLine size={28} className="text-red-400 mb-1" />
        ) : (
          <RiImageLine size={28} className="text-zinc-400 mb-1" />
        )}
        <span className="text-[10px] text-zinc-500 line-clamp-1">{asset.name || 'Media Asset'}</span>
      </div>
    );
  }

  if (isDoc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900/90 p-4 text-center group-hover:bg-zinc-200/70 dark:group-hover:bg-zinc-800/80 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
          <RiFilePdfLine size={28} />
        </div>
        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 max-w-[170px]">{asset.name || 'PDF Document'}</p>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Click to view document</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={asset.thumbnailUrl || asset.url}
        alt={asset.name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    );
  }

  if (isVideo) {
    // Append #t=0.001 so chromium/firefox/safari generates a first-frame preview instead of a black rectangle
    const videoSrc = url.includes('#') ? url : `${url}#t=0.001`;
    return (
      <div
        className="w-full h-full relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          muted
          playsInline
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
        {/* Play Icon Badge indicator */}
        <div className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold tracking-wider flex items-center gap-1 transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
          <RiPlayFill size={10} className="fill-white" />
          <span>VIDEO</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 text-zinc-500 dark:text-zinc-400">
      <RiFileTextLine size={30} className="text-zinc-700 dark:text-zinc-300" />
      <span className="text-[11px] font-mono text-center truncate max-w-[160px]">{asset.name}</span>
    </div>
  );
}

/**
 * Thumbnail for Table View
 */
function MediaTableThumbnail({ asset }) {
  const [hasError, setHasError] = useState(false);
  const url = asset.url || '';
  const name = asset.name || '';

  const isDoc = asset.fileType === 'document' || /\.(pdf|txt|md|doc|docx)(\?|$)/i.test(url) || /\.(pdf|txt|md|doc|docx)$/i.test(name);
  const isVideo = (asset.fileType === 'video' || /\.(mp4|mov|webm|mkv|avi)(\?|$)/i.test(url) || /\.(mp4|mov|webm|mkv|avi)$/i.test(name)) && !/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|$)/i.test(url) && !isDoc;
  const isImage = (asset.fileType === 'image' || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|$)/i.test(url) || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i.test(name)) && !isVideo && !isDoc;

  if (hasError) {
    return <RiFileTextLine size={18} className="text-zinc-400" />;
  }

  if (isDoc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-500/10 text-red-500 rounded-md">
        <RiFilePdfLine size={18} />
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={asset.thumbnailUrl || asset.url}
        alt={asset.name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  if (isVideo) {
    const videoSrc = url.includes('#') ? url : `${url}#t=0.001`;
    return (
      <div className="relative w-full h-full">
        <video
          src={videoSrc}
          preload="metadata"
          muted
          playsInline
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <RiPlayFill size={10} className="text-white fill-white" />
        </div>
      </div>
    );
  }

  return <RiFileTextLine size={18} className="text-zinc-400" />;
}

export default function AdminMediaVaultPage() {
  const [assets, setAssets] = useState([]);
  const [counts, setCounts] = useState({ total: 0, image: 0, video: 0, document: 0 });
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const containerRef = useRef(null);

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

  // GSAP animation for initial cards and items
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.media-vault-item', {
          y: 12,
          opacity: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, viewMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  const handleDelete = async (asset) => {
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
    <div ref={containerRef} className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
            <RiFolder3Line size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Platform Media Vault & Moderation
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Review, audit and moderate user-uploaded attachments, generated media, and documents across all conversations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <RiGridLine size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <RiListCheck size={16} />
            </button>
          </div>
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
          >
            <RiRefreshLine size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Summary Counters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'all',      label: 'All Assets', icon: RiFolder3Line, count: counts.total },
          { key: 'image',    label: 'Images',     icon: RiImageLine,   count: counts.image },
          { key: 'video',    label: 'Videos',     icon: RiVideoLine,   count: counts.video },
          { key: 'document', label: 'Documents',  icon: RiFileTextLine,count: counts.document }
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = activeType === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveType(item.key)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-95 ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-xs'
                  : 'bg-white dark:bg-[#11131a]/85 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div>
                <p className={`text-[11px] font-semibold ${isSelected ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'}`}>{item.label}</p>
                <p className="text-xl font-black mt-1 font-mono">{item.count || 0}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/10 dark:bg-black/10' : 'bg-zinc-100 dark:bg-white/[0.06]'}`}>
                <Icon size={18} className={isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-700 dark:text-zinc-200'} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name or username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 focus:ring-1 focus:ring-zinc-400/20"
          />
        </form>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
          {assets.length} items loaded
        </span>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08]">
          <RiRefreshLine size={28} className="animate-spin mx-auto text-zinc-500 dark:text-zinc-400 mb-2" />
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Scanning media storage and chats...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center px-4 rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08]">
          <RiAlertLine size={32} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
          <p className="text-xs font-bold text-zinc-900 dark:text-white">No media assets found</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {searchQuery ? 'Try clearing your search query' : 'No user-uploaded or generated files exist in this category yet'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const userObj = asset.user || { username: 'User' };

            return (
              <div
                key={asset.id}
                className="media-vault-item group relative rounded-2xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 overflow-hidden transition-all shadow-xs flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video bg-zinc-100 dark:bg-black/50 flex items-center justify-center overflow-hidden">
                  <MediaCardPreview asset={asset} />

                  {/* Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-md">
                    {asset.fileType}
                  </span>

                  {/* Overlay Action Buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewAsset(asset)}
                      className="p-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 transition-all cursor-pointer shadow-md active:scale-95"
                      title="Preview Media"
                    >
                      <RiEyeLine size={15} />
                    </button>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 transition-all cursor-pointer shadow-md active:scale-95"
                      title="Open full CDN link"
                    >
                      <RiExternalLinkLine size={15} />
                    </a>
                  </div>
                </div>

                {/* Info Card Body */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs text-zinc-900 dark:text-white truncate" title={asset.name}>
                      {asset.name}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                      {formatSize(asset.size)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-200/80 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <div className="w-5 h-5 rounded-md bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {userObj.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{userObj.username}</span>
                    </div>

                    <DeleteButton
                      size="sm"
                      title="Delete vulgar or policy-violating file"
                      onConfirm={() => handleDelete(asset)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl bg-white dark:bg-[#11131a]/85 border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3.5">Asset Preview</th>
                  <th className="px-5 py-3.5">File Name & Type</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Uploaded By</th>
                  <th className="px-5 py-3.5">Chat Thread</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-white/[0.05] text-zinc-700 dark:text-zinc-300">
                {assets.map((asset) => {
                  const userObj = asset.user || { username: 'User', email: 'N/A' };
                  return (
                    <tr key={asset.id} className="media-vault-item hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div
                          onClick={() => setPreviewAsset(asset)}
                          className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <MediaTableThumbnail asset={asset} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-zinc-900 dark:text-white truncate max-w-xs">{asset.name}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                          {asset.fileType}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-500">
                        {formatSize(asset.size)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-zinc-900 dark:text-white">{userObj.username}</p>
                        <p className="text-[11px] text-zinc-500">{userObj.email}</p>
                      </td>
                      <td className="px-5 py-3 text-zinc-500 truncate max-w-xs font-mono text-[11px]">
                        {asset.chatTitle || 'Vault Document'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewAsset(asset)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer active:scale-95"
                            title="Preview Asset"
                          >
                            <RiEyeLine size={14} />
                          </button>
                          <DeleteButton
                            size="sm"
                            title="Delete file"
                            onConfirm={() => handleDelete(asset)}
                          />
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
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#161718] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                  {previewAsset.fileType}
                </span>
                <p className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-md">
                  {previewAsset.name}
                </p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Media Body */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-zinc-100 dark:bg-black/60 min-h-[300px]">
              {previewAsset.fileType === 'image' || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|$)/i.test(previewAsset.url) ? (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : previewAsset.fileType === 'video' || /\.(mp4|mov|webm|mkv|avi)(\?|$)/i.test(previewAsset.url) ? (
                <video
                  src={previewAsset.url}
                  controls
                  autoPlay
                  className="max-h-[60vh] max-w-full rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <RiFileTextLine size={48} className="mx-auto text-zinc-400 dark:text-zinc-600" />
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">{previewAsset.name}</p>
                  <p className="text-xs text-zinc-500">{formatSize(previewAsset.size)}</p>
                  <a
                    href={previewAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-colors"
                  >
                    <RiExternalLinkLine size={14} /> Open Document
                  </a>
                </div>
              )}
            </div>

            {/* Footer with moderation controls */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
              <div className="text-xs text-zinc-500">
                Uploaded by <span className="font-bold text-zinc-900 dark:text-white">{previewAsset.user?.username || 'User'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all flex items-center gap-1"
                >
                  <RiExternalLinkLine size={13} /> Full CDN Link
                </a>
                <button
                  onClick={() => handleDelete(previewAsset)}
                  disabled={deletingId === previewAsset.id}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 active:scale-95"
                >
                  <RiDeleteBinLine size={14} />
                  <span>{deletingId === previewAsset.id ? 'Deleting...' : 'Delete Content'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
