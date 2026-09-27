import React from 'react';
import MatrixOrb from '../../Components/rare-ui/MatrixOrb';
import ThemedSkeleton from '../../Components/SkeletonLoader';

export const SidebarSkeleton = () => (
  <div className="space-y-3 px-3 py-2">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex items-center gap-3 py-1">
        <ThemedSkeleton height={20} className="w-full" borderRadius="0.5rem" />
      </div>
    ))}
  </div>
);

export const MessagesSkeleton = () => (
  <div className="max-w-fluid mx-auto space-y-16 py-8 px-4">
    {[1, 2].map((i) => (
      <div key={i} className="flex flex-col gap-6">
        {/* User Message Skeleton */}
        <div className="flex justify-end pr-1">
          <ThemedSkeleton width={260} height={42} borderRadius="1.25rem" />
        </div>
        
        {/* AI Message Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ThemedSkeleton circle width={28} height={28} />
            <ThemedSkeleton width={110} height={18} borderRadius="0.5rem" />
          </div>
          <div className="space-y-2.5 pl-10 max-w-2xl">
            <ThemedSkeleton height={16} count={3} borderRadius="0.4rem" />
            <ThemedSkeleton width="70%" height={16} borderRadius="0.4rem" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ThinkingSkeleton = () => (
  <div className="flex flex-col items-center sm:items-start gap-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="flex items-center gap-3">
      <MatrixOrb size={44} state="thinking" color="#20b8cd" dots={10} />
      <div className="flex flex-col">
        <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">
          Parsu AI is thinking...
        </span>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
          Reasoning and formulating response
        </span>
      </div>
    </div>
    <div className="space-y-2 w-full pl-0 sm:pl-14 max-w-xl">
      <ThemedSkeleton height={14} borderRadius="0.4rem" />
      <ThemedSkeleton width="80%" height={14} borderRadius="0.4rem" />
    </div>
  </div>
);

export const LibrarySkeleton = ({ viewMode }) => (
  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className={`bg-white/60 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between ${viewMode === 'list' ? 'h-28' : 'h-48'}`}
      >
        <div className="flex justify-between items-start gap-4">
          <ThemedSkeleton width={180} height={20} borderRadius="0.5rem" />
          <ThemedSkeleton width={50} height={16} borderRadius="0.4rem" />
        </div>
        <div className="space-y-2 mt-auto">
          <ThemedSkeleton height={14} borderRadius="0.4rem" />
          <ThemedSkeleton width="60%" height={14} borderRadius="0.4rem" />
        </div>
      </div>
    ))}
  </div>
);
