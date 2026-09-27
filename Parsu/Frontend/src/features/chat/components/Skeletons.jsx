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

export const ThinkingSkeleton = () => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);

  const steps = [
    "Thinking…",
    "Analyzing your request…",
    "Retrieving context & memory…",
    "Synthesizing response…"
  ];

  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => +(e + 0.5).toFixed(1)), 500);
    const s = setInterval(() => setStepIndex(i => (i + 1) % steps.length), 2000);
    return () => { clearInterval(t); clearInterval(s); };
  }, [steps.length]);

  return (
    <div className="flex flex-col gap-3 py-3 px-1 max-w-2xl animate-in fade-in duration-300">
      {/* Sleek single status line with MatrixOrb */}
      <div className="flex items-center gap-2.5">
        <MatrixOrb size={26} state="thinking" color="#20b8cd" dots={8} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 font-mono tracking-wide animate-pulse">
            {steps[stepIndex]}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            {elapsed}s
          </span>
        </div>
      </div>

      {/* Shimmering placeholder lines like standard AI apps */}
      <div className="space-y-2.5 pl-8 max-w-xl">
        <ThemedSkeleton height={14} width="90%" borderRadius="0.375rem" />
        <ThemedSkeleton height={14} width="75%" borderRadius="0.375rem" />
        <ThemedSkeleton height={14} width="40%" borderRadius="0.375rem" />
      </div>
    </div>
  );
};

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
