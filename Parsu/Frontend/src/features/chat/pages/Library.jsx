import React, { useState, useEffect, useMemo } from 'react';
import {
    RiSearchLine,
    RiHistoryLine,
    RiCompass3Line,
    RiLayoutGridLine,
    RiListCheck2,
    RiMenuLine,
    RiMessage2Line,
    RiCalendarLine,
    RiSortDesc,
    RiSortAsc,
    RiUploadCloud2Line
} from '@remixicon/react';
import { useNavigate } from 'react-router';
import Sidebar from '../../Components/Sidebar';
import ThreadCard from '../components/ThreadCard';
import MessageSearchResults from '../components/MessageSearchResults';
import ParsuLogo from '../../Components/ParsuLogo';
import { useChat } from '../hook/useChat';
import { useSelector } from 'react-redux';
import { LibrarySkeleton } from '../components/Skeletons';
import { setError } from '../chat.slice';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import ConfirmationModal from '../../Components/ConfirmationModal';
import { triggerBlobLibrarySearch, triggerBlobChatDeleted } from '../../../utils/blobReactions';
import { uploadDocument, searchDocuments } from '../service/chat.api';
import Footer from '../../Components/Footer';

// ─── Date filter helpers ──────────────────────────────────────────────────────
const DATE_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
];

function getDateThreshold(filterValue) {
    const now = new Date();
    switch (filterValue) {
        case 'today': {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            return start;
        }
        case 'yesterday': {
            const start = new Date(now);
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            return start;
        }
        case '7d': {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            return d;
        }
        case '30d': {
            const d = new Date(now);
            d.setDate(d.getDate() - 30);
            return d;
        }
        default:
            return null; // 'all' — no filter
    }
}

function isYesterday(date) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return date.getFullYear() === y.getFullYear() && date.getMonth() === y.getMonth() && date.getDate() === y.getDate();
}

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

    // ─── Date filter & sort states ────────────────────────────────────────────
    const [dateFilter, setDateFilter] = useState('all');
    const [sortDirection, setSortDirection] = useState('newest'); // 'newest' | 'oldest'

    // Inner messages search states
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

    // ─── RAG / Document upload states ─────────────────────────────────────────
    const [isUploading, setIsUploading] = useState(false);
    const [semanticResults, setSemanticResults] = useState([]);
    const docInputRef = React.useRef(null);

    useEffect(() => {
        handleGetChats();
    }, []);

    // Dispatch errors as toasts via Redux
    useEffect(() => {
        if (error) {
            dispatch(addToast({ message: error, type: 'error' }));
            dispatch(setError(null));
        }
    }, [error, dispatch]);

    // Debounced search — backend text search + semantic vector search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setGlobalSearchResults([]);
            setSemanticResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingGlobal(true);
            // Fire both text and semantic search in parallel
            const [textResults, semanticData] = await Promise.allSettled([
                handleSearchMessagesGlobally(searchQuery),
                searchDocuments(searchQuery).catch(() => ({ results: [] }))
            ]);
            setGlobalSearchResults(textResults.status === 'fulfilled' ? (textResults.value || []) : []);
            setSemanticResults(semanticData.status === 'fulfilled' ? (semanticData.value?.results || []) : []);
            setIsSearchingGlobal(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // ─── Filtered and sorted chats list ───────────────────────────────────────
    const chatsList = useMemo(() => {
        const threshold = getDateThreshold(dateFilter);

        let filtered = chats.filter(chat => {
            // Text filter
            const matchesText = !searchQuery || 
                chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.messages?.[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesText) return false;

            // Date filter
            if (!threshold) return true;
            const chatDate = new Date(chat.createdAt);
            if (dateFilter === 'yesterday') {
                return isYesterday(chatDate);
            }
            return chatDate >= threshold;
        });

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortDirection === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return filtered.map(chat => ({
            id: chat._id,
            title: chat.title || 'Untitled Chat',
            date: new Date(chat.createdAt).toLocaleDateString(),
            desc: chat.messages?.[0]?.content || 'Chat session'
        }));
    }, [chats, searchQuery, dateFilter, sortDirection]);

    // Document upload handler
    const handleDocUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            await uploadDocument(file);
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'happy', speech: "Document uploaded! I'll remember it 📄✨", duration: 2200, revert: true }
                })
            );
        } catch (err) {
            console.error("Document upload failed:", err);
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'surprised', speech: "Upload failed! Try again 😕", duration: 2200, revert: true }
                })
            );
        } finally {
            setIsUploading(false);
            if (docInputRef.current) docInputRef.current.value = '';
        }
    };

    return (
        <div className="flex bg-[#f4f5f7] dark:bg-[#050505] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#60A6AF]/30 w-full">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col h-full lg:pl-56 min-w-0 transition-all duration-300 w-full overflow-hidden">
                {/* Sticky Header - always pinned, never scrolls away */}
                <header className="shrink-0 h-12 sm:h-14 bg-[#f4f5f7]/90 dark:bg-[#050505]/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/5 flex items-center justify-between px-3 sm:px-6 z-40">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-all rounded-lg active:scale-95 cursor-pointer"
                            aria-label="Open sidebar"
                        >
                            <RiMenuLine size={20} />
                        </button>
                        <span className="lg:hidden text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <RiHistoryLine size={17} className="text-[#20b8cd]" /> Chats
                        </span>
                        <span className="hidden lg:flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                            <RiHistoryLine size={17} className="text-[#20b8cd]" /> Chats
                        </span>
                    </div>
                </header>

                {/* Scrollable content — only this area scrolls */}
                <div data-lenis-prevent className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 md:py-10">
 
                    <div className="hidden lg:flex items-center gap-3 mb-10 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#20b8cd] to-[#1da9bc] flex items-center justify-center text-zinc-950 shrink-0 shadow-lg shadow-[#20b8cd]/20">
                            <RiHistoryLine size={22} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white shrink-0">Chats</h1>
                    </div>

                    {/* ─── Search Bar + View Toggle + Upload Button ─────────────────────── */}
                    <div className="flex items-center gap-3 w-full">
                        <div className="relative group flex-1 md:w-64 max-w-sm">
                            <ParsuLogo className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#60A6AF] transition-colors" size={16} />
                            <input
                                className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200/90 dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#60A6AF]/40 focus:ring-1 focus:ring-[#60A6AF]/20 shadow-2xs transition-all"
                                placeholder="Search your chats..."
                                value={searchQuery}
                                onMouseEnter={() => triggerBlobLibrarySearch('hover')}
                                onFocus={() => triggerBlobLibrarySearch('focus')}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    triggerBlobLibrarySearch('typing');
                                }}
                            />
                        </div>

                        {/* Upload PDF for RAG */}
                        <input ref={docInputRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={handleDocUpload} />
                        <button
                            onClick={() => docInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200/90 dark:border-white/5 bg-white dark:bg-[#0a0a0a] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all disabled:opacity-50 shrink-0 shadow-2xs cursor-pointer"
                            title="Upload a document for semantic search"
                        >
                            {isUploading ? (
                                <div className="w-4 h-4 border-2 border-[#60A6AF]/30 border-t-[#60A6AF] rounded-full animate-spin" />
                            ) : (
                                <RiUploadCloud2Line size={16} />
                            )}
                            <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
                        </button>

                        <div className="flex items-center p-1 bg-white/80 dark:bg-[#0a0a0a] border border-zinc-200/90 dark:border-white/5 rounded-xl shrink-0 shadow-2xs">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-800 text-[#60A6AF] font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><RiLayoutGridLine size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800 text-[#60A6AF] font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><RiListCheck2 size={18} /></button>
                        </div>
                    </div>

                    {/* ─── Date Filter Pills & Sort Toggle ─────────────────────────────── */}
                    <div className="flex items-center gap-2 mt-4 mb-6 flex-wrap">
                        <RiCalendarLine size={16} className="text-zinc-400 shrink-0" />
                        {DATE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setDateFilter(f.value)}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                                    dateFilter === f.value
                                        ? 'bg-[#60A6AF]/10 border-[#60A6AF]/30 text-[#60A6AF]'
                                        : 'border-zinc-200 dark:border-white/5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/10'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                        <div className="ml-auto">
                            <button
                                onClick={() => setSortDirection(d => d === 'newest' ? 'oldest' : 'newest')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all"
                                title={sortDirection === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
                            >
                                {sortDirection === 'newest' ? <RiSortDesc size={14} /> : <RiSortAsc size={14} />}
                                {sortDirection === 'newest' ? 'Newest' : 'Oldest'}
                            </button>
                        </div>
                    </div>

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
                                {searchQuery ? `No chat titles found for "${searchQuery}"` : 
                                 dateFilter !== 'all' ? 'No chats found for this date range.' : 
                                 "No chats yet. Start a conversation!"}
                            </div>
                        )}
                    </div>

                    {/* Global Search Results Section */}
                    <MessageSearchResults 
                        searchQuery={searchQuery}
                        isSearchingGlobal={isSearchingGlobal}
                        globalSearchResults={globalSearchResults}
                    />

                    {/* ─── RAG Semantic Results ────────────────────────────────────────── */}
                    {semanticResults.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                Semantic Results from Documents
                            </h3>
                            <div className="space-y-3">
                                {semanticResults.map((result, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-zinc-200/90 dark:border-white/5 bg-white dark:bg-zinc-900/50 hover:border-[#60A6AF]/30 shadow-2xs transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                                {(result.score * 100).toFixed(0)}% match
                                            </span>
                                            <span className="text-[11px] text-zinc-400 font-medium">{result.filename}</span>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">{result.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </main>

                <Footer />
                </div>{/* end scrollable content */}
            </div>{/* end inner column */}

            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
            )}

            <ConfirmationModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    if (targetThreadId) {
                        handleDeleteChat(targetThreadId);
                        triggerBlobChatDeleted();
                        setDeleteModalOpen(false);
                    }
                }}
                title="Delete Chat"
                message="This chat and its message history will be permanently removed."
            />
        </div>
    );
};

export default Library;
