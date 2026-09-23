import React from 'react';
import MatrixOrb from '../../Components/rare-ui/MatrixOrb';

const PulseBase = ({ className }) => (
    <div className={`bg-zinc-800/40 rounded animate-pulse ${className}`} />
);

export const SidebarSkeleton = () => (
    <div className="space-y-3 px-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-3 py-1.5">
                <PulseBase className="w-full h-4 rounded-lg" />
            </div>
        ))}
    </div>
);

export const MessagesSkeleton = () => (
    <div className="max-w-fluid mx-auto space-y-24 py-8">
        {[1, 2].map(i => (
            <div key={i} className="flex flex-col gap-8">
                {/* User Message Skeleton */}
                <div className="flex justify-end pr-1">
                    <PulseBase className="w-1/3 h-10 rounded-[22px] bg-zinc-800/60" />
                </div>
                
                {/* AI Message Skeleton */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <PulseBase className="w-6 h-6 rounded-full" />
                        <PulseBase className="w-24 h-4 rounded-lg" />
                    </div>
                    <div className="space-y-4 pl-9">
                        <PulseBase className="w-full h-4 rounded-lg" />
                        <PulseBase className="w-5/6 h-4 rounded-lg" />
                        <PulseBase className="w-4/6 h-4 rounded-lg" />
                    </div>
                    <div className="flex gap-4 pl-9 pt-4">
                        <PulseBase className="w-8 h-8 rounded-lg" />
                        <PulseBase className="w-8 h-8 rounded-lg" />
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
        <div className="space-y-2.5 w-full pl-0 sm:pl-14">
            <PulseBase className="w-full h-3.5 rounded-lg" />
            <PulseBase className="w-[85%] h-3.5 rounded-lg" />
        </div>
    </div>
);

export const LibrarySkeleton = ({ viewMode }) => (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 animate-pulse ${viewMode === 'list' ? 'h-24' : 'h-48'}`}>
                <div className="flex justify-between items-start">
                    <PulseBase className="w-2/3 h-6 rounded-lg" />
                    <PulseBase className="w-12 h-4 rounded-lg" />
                </div>
                <div className="mt-auto flex flex-col gap-2">
                    <PulseBase className="w-full h-4 rounded-lg" />
                    <PulseBase className="w-1/2 h-3 rounded-lg bg-zinc-800/20" />
                </div>
            </div>
        ))}
    </div>
);
