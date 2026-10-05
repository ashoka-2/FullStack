import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RiImageLine, 
  RiExternalLinkLine, 
  RiFileCopyLine, 
  RiCheckLine, 
  RiCloseLine, 
  RiSearchLine,
  RiRefreshLine
} from '@remixicon/react';

export const ImageGalleryBlock = ({ query }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchImages = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/media/images?q=${encodeURIComponent(query)}&limit=8`);
      if (res.data?.success && Array.isArray(res.data.images)) {
        setImages(res.data.images);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.warn("Failed to fetch gallery images:", err);
      setError("Could not load web images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [query]);

  const handleCopy = (url, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!query) return null;

  return (
    <div className="my-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/80 overflow-hidden shadow-sm not-prose">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100 dark:bg-white/[0.04] border-b border-zinc-200 dark:border-white/10 text-xs">
        <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
          <RiImageLine size={16} className="text-[var(--accent-cyan)] shrink-0" />
          <span>Images of "{query}"</span>
          {images.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] text-[10px] font-semibold">
              {images.length} photos
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchImages}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          title="Refresh images"
        >
          <RiRefreshLine size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="p-3">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : error && images.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            <RiSearchLine size={24} className="mx-auto mb-1.5 opacity-50" />
            <p>No preview photos found for "{query}"</p>
          </div>
        ) : images.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            <p>No images found for "{query}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(img)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-white/10 cursor-pointer shadow-xs transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <img
                  src={img.thumbnail || img.url}
                  alt={img.title || query}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <span className="text-[10px] text-white font-medium truncate max-w-[80%]">
                    {img.title || query}
                  </span>
                  <RiExternalLinkLine size={13} className="text-[var(--accent-cyan)] shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10 text-xs">
              <span className="text-zinc-200 font-semibold truncate max-w-[80%]">
                {selectedImage.title || query}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Large Image View */}
            <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.title || query}
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-t border-white/10 text-xs">
              <span className="text-zinc-500 text-[11px]">
                Source: {selectedImage.source || "Web"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleCopy(selectedImage.url, e)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-zinc-200 hover:bg-white/20 transition-all font-medium text-[11px]"
                >
                  {copiedUrl ? (
                    <>
                      <RiCheckLine size={13} className="text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <RiFileCopyLine size={13} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <a
                  href={selectedImage.contextUrl || selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-zinc-950 hover:bg-[var(--accent-cyan-hover)] transition-all font-bold text-[11px]"
                >
                  <span>Open Full Size</span>
                  <RiExternalLinkLine size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
