import React from 'react';

const LoadingPulse = () => {
  return (
    <div className="mb-8 animate-entrance">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 nb-card bg-transparent flex items-center justify-center animate-spin">
          <span className="text-lg">⚙️</span>
        </div>
        <div>
          <h3 className="text-[var(--cyan-main)] font-bold uppercase tracking-widest text-xs">
            Synchronizing Arena...
          </h3>
        </div>
      </div>

      <div className="nb-card bg-[var(--bg-card)] p-4 space-y-4 shadow-[4px_4px_0px_var(--cyan-main)] opacity-70">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-50 bg-[var(--bg-accent)] border border-[var(--border-color)] animate-pulse rounded-sm" />
          <div className="h-50 bg-[var(--bg-accent)] border border-[var(--border-color)] animate-pulse rounded-sm" />
        </div>
        <div className="h-30 bg-[var(--bg-accent)] border border-[var(--border-color)] w-full animate-pulse rounded-sm" />
      </div>
    </div>
  );
};

export default LoadingPulse;
