import React from 'react';
import { useRouteError, useNavigate } from 'react-router';
import { RiErrorWarningLine, RiArrowLeftLine, RiRefreshLine } from '@remixicon/react';

// Yeh Error Boundary saare app-level crashes ko rokkega taaki app puri tarah white screen ya toot na jaaye
const ErrorBoundary = () => {
    // react-router hook jo current path ka error laake deta hai
    const error = useRouteError();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center p-6 text-zinc-900 dark:text-zinc-100 font-sans">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#121212] border border-red-500/20 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <RiErrorWarningLine size={32} className="text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold mb-3 tracking-tight">Oops! Kuch galat ho gaya</h1>
                
                <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium leading-relaxed mb-8">
                    {error?.statusText || error?.message || "App me ek anjaan technical error aayi hai. Kripya page refresh karein ya home par wapas jayein."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold transition-all text-[14px]"
                    >
                        <RiRefreshLine size={18} />
                        Refresh Page
                    </button>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-6 py-3 rounded-full font-bold transition-all text-[14px]"
                    >
                        <RiArrowLeftLine size={18} />
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;
