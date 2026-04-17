import React, { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────
// Base Shimmer Block — reusable building block
// ─────────────────────────────────────────────
export const SkeletonBase = ({ className = '' }) => (
    <div className={`relative overflow-hidden bg-foreground/8 dark:bg-white/5 rounded-md ${className}`}>
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full" />
    </div>
);


// ─────────────────────────────────────────────
// Navbar Skeleton
// Matches: fixed top bar with hamburger (mobile) | nav links (desktop) | logo center | cart + profile right
// ─────────────────────────────────────────────
export const NavbarSkeleton = () => (
    <nav className="fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-4 flex items-center justify-between bg-transparent">
        {/* Left: Nav links (desktop) / Hamburger (mobile) */}
        <div className="hidden md:flex gap-10">
            <SkeletonBase className="w-10 h-3 rounded-full" />
            <SkeletonBase className="w-10 h-3 rounded-full" />
            <SkeletonBase className="w-10 h-3 rounded-full" />
        </div>
        {/* Mobile hamburger button */}
        <SkeletonBase className="md:hidden w-12 h-12 rounded-full" />

        {/* Center: Logo */}
        <SkeletonBase className="absolute left-1/2 -translate-x-1/2 w-28 h-6 rounded-md" />

        {/* Right: Theme toggle + Profile/Login + Cart */}
        <div className="flex items-center gap-2 lg:gap-5">
            <SkeletonBase className="hidden md:block w-10 h-10 rounded-full" />
            <SkeletonBase className="hidden md:block w-10 h-10 rounded-full" />
            {/* Cart pill */}
            <SkeletonBase className="w-16 h-9 rounded-full" />
        </div>
    </nav>
);


// ─────────────────────────────────────────────
// Hero Section Skeleton
// Matches: HeroHeader (EDGE/VIBE text) + colored card box + model position
// ─────────────────────────────────────────────
export const HeroSkeleton = () => (
    <div className="w-full pb-16 flex flex-col items-center pt-4">
        {/* HeroHeader — "Own the EDGE" / "Keep the VIBE" */}
        <div className="w-full max-w-[1350px] flex justify-between items-end px-4 sm:px-8 mb-12 lg:mb-[-30px] relative z-20">
            <div className="flex flex-col gap-2">
                <SkeletonBase className="w-20 h-8 sm:h-10 rounded-md" />
                <SkeletonBase className="w-32 h-16 sm:h-20 lg:h-24 rounded-md" />
            </div>
            <div className="flex flex-col gap-2 items-end">
                <SkeletonBase className="w-20 h-8 sm:h-10 rounded-md" />
                <SkeletonBase className="w-28 h-16 sm:h-20 lg:h-24 rounded-md" />
            </div>
        </div>

        {/* Main card container */}
        <div className="relative w-full max-w-[1300px] mx-auto px-2 sm:px-6 z-10">
            {/* Big colored card */}
            <div className="w-full h-auto lg:h-[500px] bg-foreground/8 dark:bg-white/5 rounded-[40px] lg:rounded-[64px] relative flex flex-col lg:flex-row border border-border-theme overflow-hidden">

                {/* Left Info Column */}
                <div className="w-full lg:w-[35%] p-8 lg:p-16 flex flex-col justify-center gap-5">
                    <SkeletonBase className="w-24 h-3 rounded-full" />
                    <SkeletonBase className="w-3/4 h-12 rounded-xl" />
                    <SkeletonBase className="w-full h-4 rounded-full" />
                    <SkeletonBase className="w-5/6 h-4 rounded-full" />
                    {/* Button */}
                    <SkeletonBase className="w-36 h-14 rounded-full mt-2" />
                    {/* Avatar group */}
                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex -space-x-3">
                            <SkeletonBase className="w-10 h-10 rounded-xl" />
                            <SkeletonBase className="w-10 h-10 rounded-xl" />
                            <SkeletonBase className="w-10 h-10 rounded-xl" />
                        </div>
                        <SkeletonBase className="w-28 h-8 rounded-xl" />
                    </div>
                </div>

                {/* Center gutter — where model sits */}
                <div className="hidden lg:block lg:w-[30%]" />

                {/* Right Info Column (Desktop) */}
                <div className="hidden lg:flex lg:w-[35%] flex-col justify-center items-end px-12 gap-4">
                    {/* 3 feature icons */}
                    <div className="flex gap-6 mb-4">
                        <SkeletonBase className="w-11 h-11 rounded-full" />
                        <SkeletonBase className="w-11 h-11 rounded-full" />
                        <SkeletonBase className="w-11 h-11 rounded-full" />
                    </div>
                    {/* Featured product card — matches ProductCardItem: 240px wide with rounded image + 2 lines + pill button */}
                    <div className="bg-surface dark:bg-[#1C1C1E] p-3 rounded-[2.5rem] w-[240px] border border-white/10">
                        <SkeletonBase className="w-full h-[180px] rounded-[1.7rem]" />
                        <div className="px-2 pt-4 pb-2 flex flex-col items-center gap-2">
                            <SkeletonBase className="w-3/4 h-3 rounded-full" />
                            <SkeletonBase className="w-1/2 h-2.5 rounded-full" />
                            <SkeletonBase className="w-full h-10 rounded-full mt-2" />
                        </div>
                    </div>
                    {/* Dots */}
                    <div className="flex gap-2">
                        <SkeletonBase className="w-4 h-1.5 rounded-full" />
                        <SkeletonBase className="w-1.5 h-1.5 rounded-full" />
                        <SkeletonBase className="w-1.5 h-1.5 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Mobile Right Info — product carousel */}
            <div className="lg:hidden w-full mt-6 flex gap-4 overflow-hidden">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-surface dark:bg-[#1C1C1E] p-3 rounded-[2.5rem] w-[240px] flex-shrink-0 border border-white/10">
                        <SkeletonBase className="w-full h-[180px] rounded-[1.7rem]" />
                        <div className="px-2 pt-4 pb-2 flex flex-col items-center gap-2">
                            <SkeletonBase className="w-3/4 h-3 rounded-full" />
                            <SkeletonBase className="w-1/2 h-2.5 rounded-full" />
                            <SkeletonBase className="w-full h-10 rounded-full mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


// ─────────────────────────────────────────────
// Product Card Skeleton
// Matches: rounded-[2.5rem] card + rounded image (220px) + title + desc + pill slider button
// ─────────────────────────────────────────────
export const ProductCardSkeleton = () => (
    <div className="bg-surface dark:bg-[#1C1C1E] p-3 rounded-[2.5rem] w-full max-w-[280px] mx-auto border border-white/10">
        {/* Image */}
        <SkeletonBase className="w-full h-[220px] rounded-[1.7rem]" />
        {/* Info */}
        <div className="px-2 pt-4 pb-2 flex flex-col items-center gap-2">
            <SkeletonBase className="w-3/4 h-3.5 rounded-full" />
            <SkeletonBase className="w-1/2 h-2.5 rounded-full" />
            {/* Pill slide to cart button */}
            <SkeletonBase className="w-full h-10 rounded-full mt-3" />
        </div>
    </div>
);


// ─────────────────────────────────────────────
// Product Section Skeleton
// Matches: section header (badge + title + "View All") + 4 card grid
// ─────────────────────────────────────────────
export const ProductSectionSkeleton = () => (
    <div className="w-full mb-20">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8 px-1">
            <div className="flex flex-col gap-2">
                <SkeletonBase className="w-14 h-2 rounded-full" />
                <SkeletonBase className="w-48 h-8 rounded-lg" />
                <SkeletonBase className="w-64 h-3 rounded-full" />
            </div>
            <SkeletonBase className="w-16 h-3 rounded-full" />
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
    </div>
);


// ─────────────────────────────────────────────
// Profile Page Skeleton
// Matches: "Your Identity" header + 3-col grid (left: avatar card, right: form card + seller section)
// ─────────────────────────────────────────────
export const ProfileSkeleton = () => (
    <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-12 space-y-3">
            <SkeletonBase className="w-52 h-10 rounded-xl" />
            <SkeletonBase className="w-80 h-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Profile Preview Card */}
            <div className="lg:col-span-1">
                <div className="bg-surface border border-border-theme rounded-3xl p-8 space-y-5 flex flex-col items-center">
                    {/* Avatar circle */}
                    <SkeletonBase className="w-32 h-32 rounded-full" />
                    {/* Name + role */}
                    <SkeletonBase className="w-36 h-5 rounded-full" />
                    <SkeletonBase className="w-20 h-3 rounded-full" />
                    {/* Divider */}
                    <div className="w-full border-t border-border-theme pt-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <SkeletonBase className="w-4 h-4 rounded-full" />
                            <SkeletonBase className="flex-1 h-3 rounded-full" />
                        </div>
                        <div className="flex items-center gap-3">
                            <SkeletonBase className="w-4 h-4 rounded-full" />
                            <SkeletonBase className="w-24 h-3 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Form Card */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface/50 border border-border-theme rounded-3xl p-8 md:p-12 space-y-8">
                    {/* Full name field */}
                    <div className="space-y-2">
                        <SkeletonBase className="w-24 h-3 rounded-full" />
                        <SkeletonBase className="w-full h-12 rounded-xl" />
                    </div>
                    {/* Email field */}
                    <div className="space-y-2">
                        <SkeletonBase className="w-32 h-3 rounded-full" />
                        <SkeletonBase className="w-full h-12 rounded-xl" />
                    </div>
                    {/* Contact field */}
                    <div className="space-y-2">
                        <SkeletonBase className="w-28 h-3 rounded-full" />
                        <div className="flex gap-0">
                            <SkeletonBase className="w-20 h-12 rounded-l-xl" />
                            <SkeletonBase className="flex-1 h-12 rounded-r-xl" />
                        </div>
                    </div>
                    {/* Save button */}
                    <div className="flex justify-end pt-4">
                        <SkeletonBase className="w-40 h-12 rounded-xl" />
                    </div>
                </div>

                {/* Become a Seller section */}
                <div className="bg-foreground/5 border border-border-theme rounded-3xl p-8 md:p-12 space-y-4">
                    <SkeletonBase className="w-48 h-6 rounded-lg" />
                    <SkeletonBase className="w-full h-3 rounded-full" />
                    <SkeletonBase className="w-5/6 h-3 rounded-full" />
                    <SkeletonBase className="w-44 h-4 rounded-full mt-4" />
                </div>
            </div>
        </div>
    </div>
);


// ─────────────────────────────────────────────
// Full Home Page Skeleton (Hero + Product Sections)
// ─────────────────────────────────────────────
export const HomeSkeleton = () => (
    <div className="space-y-2 pb-20">
        <HeroSkeleton />
        <div className="w-full py-16 px-2 space-y-20">
            <ProductSectionSkeleton />
            <ProductSectionSkeleton />
        </div>
    </div>
);


// ─────────────────────────────────────────────
// Auth Page Skeleton (Login / Register)
// Matches: split layout — left image panel + right form panel
// ─────────────────────────────────────────────
export const AuthSkeleton = () => (
    <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left image panel */}
        <div className="hidden lg:block w-1/2 bg-foreground/8 dark:bg-white/5" />
        {/* Right form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="space-y-3 text-center">
                    <SkeletonBase className="w-32 h-8 rounded-lg mx-auto" />
                    <SkeletonBase className="w-64 h-3 rounded-full mx-auto" />
                </div>
                <div className="space-y-5">
                    <SkeletonBase className="w-full h-14 rounded-xl" />
                    <SkeletonBase className="w-full h-14 rounded-xl" />
                    <SkeletonBase className="w-full h-14 rounded-xl" />
                </div>
                <SkeletonBase className="w-full h-14 rounded-xl" />
                <SkeletonBase className="w-40 h-3 rounded-full mx-auto" />
            </div>
        </div>
    </div>
);
