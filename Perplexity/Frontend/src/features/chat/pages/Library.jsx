import React, { useState, useEffect } from 'react';
import {
    RiSearchLine,
    RiHistoryLine,
    RiCompass3Line,
    RiLayoutGridLine,
    RiListCheck2,
    RiMenuLine,
    RiMessage2Line
} from '@remixicon/react';
import { useNavigate } from 'react-router';
import Sidebar from '../../Components/Sidebar';
import ThreadCard from '../components/ThreadCard';
import MessageSearchResults from '../components/MessageSearchResults';
import PerplexityIcon from '../../Components/PerplexityIcon';
import { useChat } from '../hook/useChat';
import { useSelector } from 'react-redux';
import { LibrarySkeleton } from '../components/Skeletons';
import Toast from '../../Components/Toast';
import { setError } from '../chat.slice';
import { useDispatch } from 'react-redux';
import ConfirmationModal from '../../Components/ConfirmationModal';

const Library = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const { handleGetChats, handleDeleteChat, handleSearchMessagesGlobally } = useChat();
    const chats = useSelector(state => state.chat.chats);
    const error = useSelector(state => state.chat.error);
    const dispatch = useDispatch();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetThreadId, setTargetThreadId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Inner messages search states
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

    useEffect(() => {
        handleGetChats();
    }, []);

    // Ye useEffect 'Debouncing' laagu karta hai taaki jab user type kate, har single keyboard button (keystroke) 
    // pe backend freeze na ho. User rukega tabhi 500ms delay ke baad aaram se message search jayega. Backend aur performance bachti hai isse!
    useEffect(() => {
        if (!searchQuery.trim()) {
            setGlobalSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingGlobal(true);
            const results = await handleSearchMessagesGlobally(searchQuery);
            setGlobalSearchResults(results || []);
            setIsSearchingGlobal(false);
        }, 500); // 500 millisecond wait till the user pauses typing

        // Cleanup: Agar user 500ms se phele dobaara dbata hai toh purana timer clear ho jata hai.
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const chatsList = chats
        .filter(chat => 
            chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.messages?.[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(chat => ({
            id: chat._id,
            title: chat.title || 'Untitled Chat',
            date: new Date(chat.createdAt).toLocaleDateString(),
            desc: chat.messages?.[0]?.content || 'Chat session'
        }));

    return (
        <div className="flex bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#60A6AF]/30 overflow-x-hidden relative w-full">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <Toast message={error} type="error" onClose={() => dispatch(setError(null))} />

            <div className="flex-1 lg:pl-56 min-w-0 transition-all duration-300 w-full relative">
                <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 md:py-12">

                    {/* Mobile Menu Toggle - Fixed Header */}
                    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center py-4 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md px-4 border-b border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-all bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg"
                        >
                            <RiMenuLine size={24} />
                        </button>
                        <span className="text-lg font-bold text-zinc-900 dark:text-white ml-2 flex items-center gap-2">
                            <RiHistoryLine size={20} className="text-[#60A6AF]" /> Chats
                        </span>
                    </div>

                    {/* Spacer for fixed header */}
                    <div className="h-8 lg:hidden w-full" />
 
                    <div className="hidden lg:flex items-center gap-3 mb-10 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#60A6AF] to-[#4a8a92] flex items-center justify-center text-zinc-950 shrink-0 shadow-lg shadow-[#60A6AF]/10">
                            <RiHistoryLine size={22} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white shrink-0">Chats</h1>
                    </div>

                        <div className="flex items-center gap-3 w-full">
                            <div className="relative group flex-1 md:w-64 max-w-sm">
                                <PerplexityIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#60A6AF] transition-colors" size={16} />
                                <input
                                    className="w-full bg-zinc-100 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#60A6AF]/30 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                                    placeholder="Search your chats..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/5 rounded-xl shrink-0">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-[#60A6AF]' : 'text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><RiLayoutGridLine size={18} /></button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-[#60A6AF]' : 'text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><RiListCheck2 size={18} /></button>
                            </div>
                        </div>
 
                    <div className="mb-12" />

                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}>
                        {useSelector(state => state.chat.loading) && chatsList.length === 0 ? (
                            <LibrarySkeleton viewMode={viewMode} />
                        ) : (
                            chatsList.map((thread) => (
                                <ThreadCard 
                                    key={thread.id} 
                                    thread={thread} 
                                    viewMode={viewMode} 
                                    onDelete={() => {
                                        setTargetThreadId(thread.id);
                                        setDeleteModalOpen(true);
                                    }}
                                />
                            ))
                        )}
                        {!useSelector(state => state.chat.loading) && chatsList.length === 0 && (
                            <div className="col-span-full py-20 text-center text-zinc-500 text-sm font-medium">
                                {searchQuery ? `No chat titles found for "${searchQuery}"` : "No chats yet. Start a conversation!"}
                            </div>
                        )}
                    </div>

                    {/* Global Search Results Section ki rendering naye component se ho rahi hai taaki code aasan bane */}
                    <MessageSearchResults 
                        searchQuery={searchQuery}
                        isSearchingGlobal={isSearchingGlobal}
                        globalSearchResults={globalSearchResults}
                    />

                </main>

            </div>

            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
            )}

            <ConfirmationModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    if (targetThreadId) handleDeleteChat(targetThreadId);
                }}
                title="Delete Chat"
                message="This chat and its message history will be permanently removed."
            />
        </div>
    );
};

export default Library;
