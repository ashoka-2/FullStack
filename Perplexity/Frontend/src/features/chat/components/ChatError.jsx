import React from 'react';
import { RiErrorWarningLine, RiCloseLine, RiRefreshLine } from '@remixicon/react';
import { useDispatch } from 'react-redux';
import { setError } from '../chat.slice';

const ChatError = ({ message, onRetry }) => {
    const dispatch = useDispatch();

    if (!message) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md animate-in slide-in-from-top-4 duration-300">
            <div className="mx-4 bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-start gap-4 shadow-2xl">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <RiErrorWarningLine className="text-red-500" size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-red-500 uppercase tracking-wider mb-1">Error Occurred</h3>
                    <p className="text-[14px] text-zinc-300 leading-relaxed font-medium">
                        {message}
                    </p>
                    
                    {onRetry && (
                        <button 
                            onClick={onRetry}
                            className="mt-3 flex items-center gap-2 text-[12px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                        >
                            <RiRefreshLine size={14} />
                            Try again
                        </button>
                    )}
                </div>

                <button 
                    onClick={() => dispatch(setError(null))}
                    className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all"
                >
                    <RiCloseLine size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatError;
