import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

/**
 * Global SkeletonLoader component powered by `react-loading-skeleton`
 * Automatically matches current theme variables (--skeleton-base, --skeleton-highlight).
 */
export const ThemedSkeleton = (props) => {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base, #1e2028)"
      highlightColor="var(--skeleton-highlight, #2a2e3d)"
      borderRadius={props.borderRadius || '0.75rem'}
    >
      <Skeleton {...props} />
    </SkeletonTheme>
  );
};

export default ThemedSkeleton;

/**
 * Standard Multi-row Table Skeleton Loader
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base, #1e2028)"
      highlightColor="var(--skeleton-highlight, #2a2e3d)"
      borderRadius="0.6rem"
    >
      <div className="w-full space-y-3 p-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2 border-b border-zinc-200/50 dark:border-white/[0.04]">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={cIdx === 0 ? 'w-1/3' : cIdx === cols - 1 ? 'w-20 ml-auto' : 'flex-1'}
              >
                <Skeleton height={20} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
};

/**
 * Standard Card Skeleton Loader
 */
export const CardSkeleton = ({ count = 3, height = 140 }) => {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base, #1e2028)"
      highlightColor="var(--skeleton-highlight, #2a2e3d)"
      borderRadius="1rem"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton width={110} height={18} />
              <Skeleton circle width={28} height={28} />
            </div>
            <Skeleton height={height - 70} />
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
};

/**
 * Full Page Skeleton Loader
 */
export const PageSkeleton = () => {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base, #1e2028)"
      highlightColor="var(--skeleton-highlight, #2a2e3d)"
      borderRadius="0.75rem"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton width="40%" height={32} />
          <Skeleton width="25%" height={16} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </div>
        <Skeleton height={340} />
      </div>
    </SkeletonTheme>
  );
};
