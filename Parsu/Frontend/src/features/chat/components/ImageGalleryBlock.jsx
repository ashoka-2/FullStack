import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  RiImageLine, 
  RiExternalLinkLine, 
  RiFileCopyLine, 
  RiCheckLine, 
  RiCloseLine, 
  RiSearchLine,
} from '@remixicon/react';

const imageResultCache = new Map();
const IMAGE_RESULT_CACHE_TTL = 15 * 60 * 1000;

const loadGalleryImages = async (query, mode) => {
  const key = `${query.trim().toLocaleLowerCase()}::${mode}`;
  const cached = imageResultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  imageResultCache.delete(key);

  const promise = axios.get(`/api/media/images?q=${encodeURIComponent(query)}&limit=${mode === 'place' ? 6 : 8}`)
    .then(res => (res.data?.success && Array.isArray(res.data.images) ? res.data.images : []));
  imageResultCache.set(key, { promise, expiresAt: Date.now() + IMAGE_RESULT_CACHE_TTL });
  if (imageResultCache.size > 200) imageResultCache.delete(imageResultCache.keys().next().value);
  try {
    return await promise;
  } catch (error) {
    imageResultCache.delete(key);
    throw error;
  }
};

export const ImageGalleryBlock = ({ query, title, details, mode = 'search' }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});

  const fetchImages = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setLoadedImages({});
    try {
      setImages(await loadGalleryImages(query, mode));
    } catch (err) {
      console.warn("Failed to fetch gallery images:", err);
      setError("Could not load web images");
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleCopy = (url, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleImageError = (image, event) => {
    const imageKey = image.thumbnail || image.url;
    const failedUrl = event?.currentTarget?.currentSrc || event?.currentTarget?.src;
    if (image.url && image.thumbnail && image.url !== image.thumbnail && failedUrl !== image.url) {
      // Search APIs often return a stale thumbnail but a working original image URL.
      setImages(current => current.map(item => (item.thumbnail || item.url) === imageKey
        ? { ...item, thumbnail: item.url }
        : item));
      return;
    }
    // Remove unavailable results entirely so users only see working photos.
    setImages(current => current.filter(item => (item.thumbnail || item.url) !== imageKey));
    setLoadedImages(current => {
      const next = { ...current };
      delete next[imageKey];
      return next;
    });
  };

  if (!query) return null;

  return (
    <div className={mode === 'place' ? 'my-5 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/50 not-prose' : 'my-4 not-prose'}>
      {mode === 'place' && <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
          <RiImageLine size={16} className="shrink-0 text-[var(--accent-cyan)]" />
          <span>{title || query.split(',')[0]}</span>
        </div>
        {details && <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{details}</p>}
      </div>}

      {/* Gallery Grid */}
      <div className={mode === 'place' ? 'px-3 pb-3' : ''}>
        {loading ? (
          <div className={mode === 'place' ? 'space-y-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5'}>
            {[...Array(mode === 'place' ? 1 : 4)].map((_, i) => (
              <div key={i} className={`${mode === 'place' ? 'aspect-[16/9]' : 'aspect-square'} rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse`} />
            ))}
          </div>
        ) : error && images.length === 0 ? (
          mode === 'place' ? <div className="px-4 pb-4 text-xs text-zinc-500">No photo found for this place.</div> : <div className="py-8 text-center text-xs text-zinc-500"><RiSearchLine size={24} className="mx-auto mb-1.5 opacity-50" /><p>No preview photos found for "{query}"</p></div>
        ) : images.length === 0 ? (
          mode === 'place' ? <div className="px-4 pb-4 text-xs text-zinc-500">No photo found for this place.</div> : <div className="py-8 text-center text-xs text-zinc-500"><p>No images found for "{query}"</p></div>
        ) : (
          <div className={mode === 'place' ? 'space-y-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5'}>
            {(mode === 'place' ? images.slice(0, 1) : images).map((img, idx) => (
              <div key={`${img.url}-${idx}`}>
              <button
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`group relative w-full ${mode === 'place' ? 'aspect-[16/9]' : 'aspect-square'} rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-white/10 cursor-pointer shadow-xs transition-all hover:shadow-md`}
                aria-label={`View ${img.title || query}`}
              >
                {!loadedImages[img.thumbnail || img.url] && <span aria-hidden="true" className="absolute inset-0 bg-zinc-800/70 animate-pulse" />}
                <img
                  src={img.thumbnail || img.url}
                  alt={img.title || query}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-[opacity,transform] duration-300 group-hover:scale-105 ${loadedImages[img.thumbnail || img.url] ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLoadedImages(current => ({ ...current, [img.thumbnail || img.url]: true }))}
                  onError={event => handleImageError(img, event)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <span className="text-[10px] text-white font-medium truncate max-w-[80%]">
                    {img.title || title || query}
                  </span>
                  <RiExternalLinkLine size={13} className="text-[var(--accent-cyan)] shrink-0" />
                </div>
              </button>
              {mode === 'place' && img.source && <div className="px-1 pt-1 text-[10px] text-zinc-500">Photo: {img.source}</div>}
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
                {title || selectedImage.title || query}
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
                onError={() => {
                  if (selectedImage.thumbnail && selectedImage.thumbnail !== selectedImage.url) {
                    setSelectedImage(current => ({ ...current, url: current.thumbnail }));
                  } else {
                    handleImageError(selectedImage);
                    setSelectedImage(null);
                  }
                }}
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
