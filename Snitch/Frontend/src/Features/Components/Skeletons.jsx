import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const SkeletonBase = ({ className }) => {
    const shimmerRef = useRef(null);

    useEffect(() => {
        if (shimmerRef.current) {
            gsap.to(shimmerRef.current, {
                x: '100%',
                duration: 1.5,
                repeat: -1,
                ease: "power1.inOut",
            });
        }
    }, []);

    return (
        <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-md ${className}`}>
            <div 
                ref={shimmerRef}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full"
            />
        </div>
    );
};

export const HeroSkeleton = () => (
    <div className="w-full max-w-[1300px] mx-auto min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-end px-2 sm:px-6 z-10 w-[98%]">
        <div className="w-full h-[300px] lg:h-[500px] bg-gray-200 dark:bg-gray-800/50 rounded-[40px] lg:rounded-[64px] relative border border-border-theme flex flex-col lg:flex-row">
            <div className="w-full lg:w-[35%] p-8 lg:p-16 space-y-4">
                <SkeletonBase className="w-3/4 h-12" />
                <SkeletonBase className="w-1/2 h-8" />
                <SkeletonBase className="w-full h-24 mt-4" />
                <SkeletonBase className="w-40 h-12 rounded-full mt-6" />
            </div>
            <div className="hidden lg:block lg:w-[30%] h-full flex items-center justify-center">
                <SkeletonBase className="w-4/5 h-4/5 rounded-2xl" />
            </div>
            <div className="w-full lg:w-[35%] p-8 space-y-4">
                <SkeletonBase className="w-1/2 h-6" />
                <SkeletonBase className="w-full h-[200px] rounded-2xl" />
                <div className="flex gap-4 mt-6">
                    <SkeletonBase className="w-12 h-12 rounded-full" />
                    <SkeletonBase className="w-12 h-12 rounded-full" />
                    <SkeletonBase className="w-12 h-12 rounded-full" />
                </div>
            </div>
        </div>
    </div>
);

export const NavbarSkeleton = () => (
    <div className="fixed top-0 left-0 w-full h-16 md:h-20 px-4 md:px-10 flex items-center justify-between z-50">
        <SkeletonBase className="w-32 h-8" />
        <div className="hidden md:flex gap-8">
            <SkeletonBase className="w-16 h-4" />
            <SkeletonBase className="w-16 h-4" />
            <SkeletonBase className="w-16 h-4" />
        </div>
        <div className="flex gap-4">
            <SkeletonBase className="w-10 h-10 rounded-full" />
            <SkeletonBase className="w-10 h-10 rounded-full" />
        </div>
    </div>
);

export const ProductCardSkeleton = () => (
    <div className="w-full space-y-4">
        <SkeletonBase className="w-full aspect-[4/5] rounded-3xl" />
        <div className="px-2 space-y-2">
            <SkeletonBase className="w-3/4 h-4" />
            <SkeletonBase className="w-1/2 h-3 opacity-60" />
            <div className="flex justify-between items-center pt-2">
                <SkeletonBase className="w-20 h-5" />
                <SkeletonBase className="w-8 h-8 rounded-full" />
            </div>
        </div>
    </div>
);

export const ProfileSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
            <SkeletonBase className="w-48 h-10" />
            <SkeletonBase className="w-72 h-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
                <SkeletonBase className="w-full h-[400px] rounded-3xl" />
            </div>
            <div className="lg:col-span-2 space-y-8">
                <SkeletonBase className="w-full h-16 rounded-xl" />
                <SkeletonBase className="w-full h-16 rounded-xl" />
                <SkeletonBase className="w-full h-16 rounded-xl" />
                <div className="flex justify-end pt-4">
                    <SkeletonBase className="w-40 h-14 rounded-xl" />
                </div>
            </div>
        </div>
    </div>
);

export const AuthSkeleton = () => (
    <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
                <SkeletonBase className="w-32 h-10 mx-auto" />
                <SkeletonBase className="w-64 h-4 mx-auto" />
            </div>
            <div className="space-y-6">
                <SkeletonBase className="w-full h-14 rounded-xl" />
                <SkeletonBase className="w-full h-14 rounded-xl" />
                <SkeletonBase className="w-full h-14 rounded-xl" />
                <SkeletonBase className="w-full h-14 rounded-xl mt-8" />
            </div>
        </div>
    </div>
);

export const HomeSkeleton = () => (
    <div className="space-y-12 pb-20">
        <HeroSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
        </div>
    </div>
);
