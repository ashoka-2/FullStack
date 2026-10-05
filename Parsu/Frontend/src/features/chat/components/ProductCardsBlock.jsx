import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RiCheckDoubleLine, 
  RiExternalLinkLine, 
  RiShoppingBag3Line,
  RiSparklingLine,
  RiArrowRightLine
} from '@remixicon/react';

// Single product card with asynchronous image loading
function ProductCardItem({ item }) {
  const [imageUrl, setImageUrl] = useState(item.image || item.imageUrl || null);
  const [imgLoading, setImgLoading] = useState(!imageUrl);

  useEffect(() => {
    let mounted = true;
    if (!imageUrl) {
      const q = item.imageQuery || item.name;
      if (q) {
        axios.get(`/api/media/images?q=${encodeURIComponent(q)}&limit=1`)
          .then(res => {
            if (mounted && res.data?.success && res.data.images?.length > 0) {
              setImageUrl(res.data.images[0].url);
            }
          })
          .catch(() => {})
          .finally(() => {
            if (mounted) setImgLoading(false);
          });
      } else {
        setImgLoading(false);
      }
    }
    return () => { mounted = false; };
  }, [item, imageUrl]);

  const uses = Array.isArray(item.uses) 
    ? item.uses 
    : (item.benefits ? (Array.isArray(item.benefits) ? item.benefits : [item.benefits]) : []);

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Top: Product Image */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden border-b border-zinc-200 dark:border-white/5 flex items-center justify-center">
        {imgLoading ? (
          <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800/80 animate-pulse flex items-center justify-center">
            <span className="text-[11px] text-zinc-400 font-medium">Finding photo...</span>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageUrl(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-zinc-400 p-4 text-center">
            <RiShoppingBag3Line size={28} className="opacity-40" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </div>
        )}

        {/* Category / Badge if provided */}
        {item.badge && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
            {item.badge}
          </span>
        )}
      </div>

      {/* Details Section */}
      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-[var(--accent-cyan)] transition-colors leading-snug">
            {item.name}
          </h4>
          {item.description && (
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Uses & Key Highlights */}
        {uses.length > 0 && (
          <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-cyan)] flex items-center gap-1">
              <RiSparklingLine size={11} /> Uses & Benefits
            </span>
            <ul className="space-y-1">
              {uses.map((u, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                  <RiCheckDoubleLine size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{u}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Search Google action link */}
        <div className="pt-1 flex items-center justify-between text-[11px]">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(item.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--accent-cyan)] hover:underline font-semibold"
          >
            <span>Search web</span>
            <RiExternalLinkLine size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}

export const ProductCardsBlock = ({ code }) => {
  let items = [];
  try {
    const raw = typeof code === 'string' ? code.trim() : '';
    // Strip markdown code fences if wrapped
    const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/g, '').trim();
    items = JSON.parse(clean);
  } catch (err) {
    try {
      // Fallback: match JSON array inside text
      const arrayMatch = code.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) items = JSON.parse(arrayMatch[0]);
    } catch {
      console.warn("ProductCardsBlock failed to parse JSON:", err);
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className="my-5 not-prose">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {items.map((item, idx) => (
          <ProductCardItem key={`${item.name || idx}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
};
