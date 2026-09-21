import React from 'react';
import { RiErrorWarningLine, RiCloseLine, RiRefreshLine, RiSparkling2Line } from '@remixicon/react';
import { useDispatch } from 'react-redux';
import { setError } from '../chat.slice';

const ChatError = ({ message, onRetry }) => {
    const dispatch = useDispatch();

    if (!message) return null;

    const isHighTraffic = /high traffic|experiencing high|overload|capacity|busy right now/i.test(message);

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg animate-in slide-in-from-top-4 duration-300 px-4">
            {isHighTraffic ? (
                // Gemini-style High Traffic / Overload Notice
                <div className="bg-white/95 dark:bg-[#121215]/95 border border-amber-500/30 dark:border-amber-400/20 backdrop-blur-2xl p-5 rounded-3xl flex items-start gap-4 shadow-[0_12px_40px_rgba(245,158,11,0.15)]">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
                        <RiSparkling2Line size={22} className="animate-pulse" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                Model High Load
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                                Traffic Surge
                            </span>
                        </div>

                        <p className="text-[13px] sm:text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                            {message}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            {onRetry && (
                                <button 
                                    onClick={onRetry}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                                >
                                    <RiRefreshLine size={14} />
                                    Try again
                                </button>
                            )}
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Tip: You can also select another model from the dropdown above.
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => dispatch(setError(null))}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
                        aria-label="Dismiss error"
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>
            ) : (
                // Standard Error Notice
                <div className="bg-white/95 dark:bg-[#121215]/95 border border-red-500/20 backdrop-blur-2xl p-4 rounded-3xl flex items-start gap-4 shadow-2xl">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
                        <RiErrorWarningLine size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[12px] font-bold text-red-500 uppercase tracking-wider mb-1">
                            Error Occurred
                        </h3>
                        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {message}
                        </p>
                        
                        {onRetry && (
                            <button 
                                onClick={onRetry}
                                className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                <RiRefreshLine size={14} />
                                Try again
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => dispatch(setError(null))}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
                        aria-label="Dismiss error"
                    >
                        <RiCloseLine size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatError;
