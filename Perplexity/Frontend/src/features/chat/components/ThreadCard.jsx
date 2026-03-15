import React from 'react';
import { Link } from 'react-router';
import { RiMoreFill, RiShareLine, RiDeleteBinLine } from '@remixicon/react';
import PerplexityIcon from '../../Components/PerplexityIcon';

const ThreadCard = ({ thread, viewMode }) => {
    if (viewMode === 'grid') {
        return (
            <Link 
                to={`/chat/${thread.id}`}
                className="group flex flex-col p-5 bg-[#0a0a0a] border border-white/5 rounded-3xl hover:border-zinc-800 hover:bg-zinc-800/10 transition-all text-left relative"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {thread.date}
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-zinc-800 transition-all text-zinc-500">
                        <RiMoreFill size={16} />
                    </button>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#60A6AF] transition-colors line-clamp-1 mb-2">
                    {thread.title}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-2">
                    {thread.desc}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-zinc-900/50 pt-4 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="flex -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-teal-600 border border-[#050505]" />
                        <div className="w-5 h-5 rounded-full bg-emerald-600 border border-[#050505]" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-600">Pro Shared</span>
                </div>
            </Link>
        );
    }

    return (
        <Link 
            to={`/chat/${thread.id}`}
            className="group flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl hover:border-zinc-800 hover:bg-zinc-800/10 transition-all"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-[#60A6AF] transition-colors shrink-0">
                    <PerplexityIcon size={18} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-[#60A6AF] transition-colors">{thread.title}</h3>
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">{thread.date} · Thread</p>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-2 text-zinc-600 hover:text-white transition-colors"><RiShareLine size={18} /></button>
                <button className="p-2 text-zinc-600 hover:text-red-400 transition-colors"><RiDeleteBinLine size={18} /></button>
            </div>
        </Link>
    );
};

export default ThreadCard;
