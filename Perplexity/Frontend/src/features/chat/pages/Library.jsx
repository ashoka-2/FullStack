import React, { useState } from 'react';
import {
    RiSearchLine,
    RiHistoryLine,
    RiCompass3Line,
    RiLayoutGridLine,
    RiListCheck2,
    RiMenuLine
} from '@remixicon/react';
import Sidebar from '../../Components/Sidebar';
import ThreadCard from '../components/ThreadCard';
import PerplexityIcon from '../../Components/PerplexityIcon';

const Library = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    const threads = [
        { id: 0, title: 'bollyflix', date: '2 days ago', desc: 'Explored movie categories and streaming options.' },
        { id: 1, title: 'Compare prices for noise', date: '3 days ago', desc: 'Analyzed noise canceling headphones across multiple retailers.' },
        { id: 2, title: 'Sei.', date: '4 days ago', desc: 'Detailed look into the Sei blockchain ecosystem.' },
        { id: 3, title: 'sheryians/job', date: '5 days ago', desc: 'Discussed job opportunities and frontend roles.' },
        { id: 4, title: 'dub.co partners', date: '1 week ago', desc: 'Researched partnership models for link shorteners.' },
        { id: 5, title: 'sarthak sharma github', date: '1 week ago', desc: 'Reviewed open source contributions and projects.' },
        { id: 6, title: 'latitude and logitude', date: '2 weeks ago', desc: 'Geospatial coordinates and mapping fundamentals.' },
        { id: 7, title: 'netmirror', date: '2 weeks ago', desc: 'Service analysis for proxy and mirroring tools.' },
    ];

    return (
        <div className="flex bg-[#050505] min-h-screen text-zinc-100 font-sans selection:bg-[#60A6AF]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 lg:pl-56 transition-all duration-300">
                <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 md:py-12">

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden flex items-center mb-6">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-zinc-500 hover:text-white transition-all"
                        >
                            <RiMenuLine size={24} />
                        </button>
                        <span className="text-lg font-bold text-white ml-2">Library</span>
                    </div>

                    <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#60A6AF] to-[#4a8a92] flex items-center justify-center text-zinc-950 shrink-0 shadow-lg shadow-[#60A6AF]/10">
                            <RiHistoryLine size={22} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white shrink-0">Library</h1>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar border-b border-zinc-900 md:border-none pb-4 md:pb-0">
                            {['All', 'Threads', 'Discover', 'Collections'].map((tab, i) => (
                                <button key={i} className={`text-sm font-bold tracking-wide transition-all pb-1 whitespace-nowrap ${i === 1 ? 'text-white border-b-2 border-[#60A6AF]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group flex-1 md:w-64">
                                <PerplexityIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#60A6AF] transition-colors" size={16} />
                                <input
                                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:border-[#60A6AF]/30 focus:bg-zinc-900 transition-all"
                                    placeholder="Search your library..."
                                />
                            </div>
                            <div className="flex items-center p-1 bg-[#0a0a0a] border border-white/5 rounded-xl shrink-0">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-[#60A6AF]' : 'text-zinc-600 hover:text-zinc-300'}`}><RiLayoutGridLine size={18} /></button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-[#60A6AF]' : 'text-zinc-600 hover:text-zinc-300'}`}><RiListCheck2 size={18} /></button>
                            </div>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}>
                        {threads.map((thread) => (
                            <ThreadCard key={thread.id} thread={thread} viewMode={viewMode} />
                        ))}
                    </div>
                </main>
            </div>

            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
            )}
        </div>
    );
};

export default Library;
