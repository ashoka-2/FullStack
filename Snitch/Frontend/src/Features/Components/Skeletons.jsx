import React from 'react';

// ─── Base Shimmer Component ──────────────────────────────────────────────
const SkeletonBase = ({ className }) => (
    <div className={`bg-surface/60 animate-pulse rounded-2xl relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
);

// ─── Core Building Blocks ──────────────────────────────────────────────────
export const ProductCardSkeleton = () => (
    <div className="bg-surface/50 border border-border-theme/50 rounded-3xl overflow-hidden aspect-[4/5] p-3 space-y-3">
        <SkeletonBase className="w-full h-2/3 rounded-2xl" />
        <div className="px-1 space-y-3">
            <SkeletonBase className="w-3/4 h-3 rounded-full" />
            <SkeletonBase className="w-1/2 h-2 rounded-full opacity-40" />
            <div className="flex justify-between items-center pt-2">
                <SkeletonBase className="w-12 h-6 rounded-lg" />
                <SkeletonBase className="w-6 h-6 rounded-full" />
            </div>
        </div>
    </div>
);

// ─── Navbar Skeleton ────────────────────────────────────────────────────────
export const NavbarSkeleton = () => (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-10 py-4 flex items-center justify-between pointer-events-none">
        <SkeletonBase className="w-32 h-10 rounded-xl" />
        <div className="hidden md:flex gap-6">
            {[1, 2, 3, 4].map(i => <SkeletonBase key={i} className="w-16 h-3 rounded-full opacity-30 mt-3" />)}
        </div>
        <div className="flex gap-4">
            <SkeletonBase className="w-10 h-10 rounded-full" />
            <SkeletonBase className="w-10 h-10 rounded-full" />
        </div>
    </div>
);

// ─── Auth Skeleton (Login/Register) ──────────────────────────────────────────
export const AuthSkeleton = () => (
    <div className="h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-border-theme rounded-[40px] p-8 md:p-12 space-y-8">
            <div className="text-center space-y-2">
                <SkeletonBase className="w-48 h-10 mx-auto rounded-xl" />
                <SkeletonBase className="w-64 h-4 mx-auto opacity-30" />
            </div>
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                        <SkeletonBase className="w-20 h-3 rounded-full" />
                        <SkeletonBase className="w-full h-12 rounded-xl" />
                    </div>
                ))}
                <SkeletonBase className="w-full h-14 rounded-2xl shadow-lg mt-8" />
            </div>
        </div>
    </div>
);

// ─── Product Section Skeleton (All Products) ─────────────────────────────────
export const ProductSectionSkeleton = () => (
    <div className="w-full mb-20 px-1">
        <div className="flex items-end justify-between mb-8">
            <div className="space-y-3">
                <SkeletonBase className="w-20 h-2 rounded-full opacity-30" />
                <SkeletonBase className="w-64 h-10 rounded-xl" />
                <SkeletonBase className="w-48 h-3 rounded-full opacity-30" />
            </div>
            <SkeletonBase className="w-24 h-6 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
        </div>
    </div>
);

// ─── Home Skeleton ───────────────────────────────────────────────────────────
export const HomeSkeleton = () => (
    <div className="space-y-20">
        {/* Hero Area */}
        <div className="relative w-full aspect-[21/9] md:aspect-[21/7] rounded-[40px] overflow-hidden">
            <SkeletonBase className="w-full h-full" />
            <div className="absolute inset-x-8 bottom-12 space-y-4">
                <SkeletonBase className="w-96 h-16 rounded-2xl" />
                <SkeletonBase className="w-64 h-10 rounded-xl opacity-40" />
            </div>
        </div>
        
        {/* Sections */}
        <ProductSectionSkeleton />
        <ProductSectionSkeleton />
    </div>
);

// ─── Profile Skeleton ────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
    <div className="max-w-[1200px] mx-auto space-y-12 py-10 px-4">
        {/* User Info Header */}
        <div className="bg-surface/40 p-10 rounded-[40px] border border-border-theme flex items-center gap-8">
            <SkeletonBase className="w-32 h-32 rounded-full shrink-0 shadow-2xl" />
            <div className="space-y-3 flex-1">
                <div className="flex items-center gap-4">
                    <SkeletonBase className="w-48 h-10" />
                    <SkeletonBase className="w-24 h-6 rounded-full" />
                </div>
                <SkeletonBase className="w-64 h-5 opacity-40" />
                <div className="flex gap-4 pt-2">
                    <SkeletonBase className="w-32 h-10 rounded-xl" />
                    <SkeletonBase className="w-32 h-10 rounded-xl" />
                </div>
            </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-10 border-b border-border-theme px-4">
            <SkeletonBase className="w-32 h-10 rounded-t-xl" />
            <SkeletonBase className="w-32 h-10 rounded-t-xl opacity-30" />
            <SkeletonBase className="w-32 h-10 rounded-t-xl opacity-30" />
        </div>

        {/* Content Section Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// ─── Admin Dashboard Skeleton ────────────────────────────────────────────────
export const AdminDashboardSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-12 pt-24 pb-20 px-4 md:px-10">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
            <div className="space-y-3">
                <SkeletonBase className="w-32 h-3 rounded-full opacity-30" />
                <SkeletonBase className="w-[450px] h-14 rounded-2xl" />
                <SkeletonBase className="w-80 h-4 opacity-40" />
            </div>
            <SkeletonBase className="w-44 h-14 rounded-2xl shadow-lg" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-surface/50 rounded-2xl border border-border-theme">
            {[1, 2, 3, 4, 5].map(i => (
                <SkeletonBase key={i} className="min-w-[140px] h-12 rounded-xl" />
            ))}
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <SkeletonBase key={i} className="h-44 border border-border-theme/40" />
            ))}
        </div>
    </div>
);

// ─── Product Form Skeleton (Create/Edit) ──────────────────────────────────────────
export const ProductFormSkeleton = () => (
    <div className="max-w-3xl mx-auto pt-24 pb-20 px-4">
        <div className="mb-10 space-y-6">
            <SkeletonBase className="w-24 h-8 rounded-lg" />
            <SkeletonBase className="w-[400px] h-14 rounded-2xl" />
        </div>

        <div className="flex items-center gap-4 mb-12">
            {[1, 2, 3, 4].map(i => (
                <React.Fragment key={i}>
                    <SkeletonBase className="w-9 h-9 rounded-full shrink-0" />
                    {i < 4 && <SkeletonBase className="flex-1 h-[2px] rounded-full" />}
                </React.Fragment>
            ))}
        </div>

        <div className="bg-surface/50 border border-border-theme rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
                <SkeletonBase className="w-7 h-7 rounded-lg" />
                <SkeletonBase className="w-40 h-7" />
            </div>
            
            <div className="space-y-10">
                <div className="space-y-3">
                    <SkeletonBase className="w-24 h-3 rounded-full opacity-40 ml-1" />
                    <SkeletonBase className="w-full h-14" />
                </div>
                <div className="space-y-3">
                    <SkeletonBase className="w-24 h-3 rounded-full opacity-40 ml-1" />
                    <SkeletonBase className="w-full h-40" />
                </div>
                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <SkeletonBase className="w-24 h-3 rounded-full opacity-40 ml-1" />
                        <SkeletonBase className="w-full h-14" />
                    </div>
                    <div className="space-y-3">
                        <SkeletonBase className="w-24 h-3 rounded-full opacity-40 ml-1" />
                        <SkeletonBase className="w-full h-14" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default SkeletonBase;
