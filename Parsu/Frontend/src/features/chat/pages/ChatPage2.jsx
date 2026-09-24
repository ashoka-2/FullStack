import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import {
    RiMenuLine,
    RiShareLine,
    RiArrowDownLine,
    RiCheckLine,
    RiSpyLine,
    RiSideBarLine
} from '@remixicon/react';
import Sidebar from '../../Components/Sidebar';
import ParsuLogo from '../../Components/ParsuLogo';
import ChatMessage from '../components/ChatMessage';
import FollowUpInput from '../components/FollowUpInput';
import { useChat } from '../hook/useChat';
import { useSelector, useDispatch } from 'react-redux';
import { MessagesSkeleton, ThinkingSkeleton } from '../components/Skeletons';
import { setError, setLoading, toggleSidebarCollapse } from '../chat.slice';
import { addToast } from '../../../utils/toast.slice';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import ModelSelectorDropdown from '../components/ModelSelectorDropdown';
import { saveQueueItem, getQueueItems, removeQueueItem } from '../../../utils/queueDb';
import { useAiFeatureToggles } from '../../../utils/aiSettingsSync';

const ChatPage2 = () => {
    // Extract chat id from URL parameters (e.g., /chat/123 -> id: 123)
    const { id } = useParams();
    
    // UI states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar drawer state
    const [input, setInput] = useState(''); // Chat input field
    const [isScrolled, setIsScrolled] = useState(false); // Header shadow state on scroll
    const [selectedModel, setSelectedModel] = useState(null); // Active AI model for chat
    const [messageQueue, setMessageQueue] = useState([]); // Queued messages waiting for current response
    
    // References & Elements
    const scrollerRef = useRef(null); // Chat message history container scroll reference
    const fileInputRef = useRef(null); // Hidden file input element
    
    // Attachment & Upload Menu States
    const [files, setFiles] = useState([]); // Selected local file attachments
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false); // Attachment picker toggle
    
    // Chat custom hook functions
    const { handleGetMessages, handleSendMessage, handleLoadMoreMessages, loading, isGenerating } = useChat();

    // Redux selectors for messages, pagination, and error states
    const messages = useSelector(state => state.chat.messages);
    const error = useSelector(state => state.chat.error);
    const hasMoreMessages = useSelector(state => state.chat.hasMoreMessages);
    const messagesPage = useSelector(state => state.chat.messagesPage);
    const isLoadingMore = useSelector(state => state.chat.isLoadingMore);
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
    const dispatch = useDispatch();
    const [latestMessageId, setLatestMessageId] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Web Search and Cross-Chat Memory feature toggles synced across all pages & settings
    const {
        webSearch,
        setWebSearch,
        handleToggleWebSearch,
        memoryEnabled,
        setMemoryEnabled,
        handleToggleMemory,
    } = useAiFeatureToggles();

    // Incognito state synced with localStorage and event
    const [incognito, setIncognito] = useState(() => localStorage.getItem('parsu_incognito') === '1');

    useEffect(() => {
        const handler = (e) => setIncognito(Boolean(e.detail));
        window.addEventListener('parsu_incognito_change', handler);
        return () => window.removeEventListener('parsu_incognito_change', handler);
    }, []);

    // Share link button state
    const [isCopied, setIsCopied] = useState(false);

    // JellyBlob mascot reactive states
    const [blobMood, setBlobMood] = useState('curious');
    const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });
    const [celebrateCount, setCelebrateCount] = useState(0);
    const prevGeneratingRef = useRef(isGenerating);

    useEffect(() => {
        if (isGenerating) {
            setBlobMood('hmm');
            setBlobGaze({ x: 0, y: 0 });
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: {
                        mood: 'hmm',
                        speech: webSearch ? "Searching web & generating... 🔍" : "Thinking... Let me check! 🧠",
                        duration: 3500,
                        revert: true
                    }
                })
            );
        } else if (prevGeneratingRef.current && !isGenerating) {
            setBlobMood('happy');
            setCelebrateCount(c => c + 1);
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: {
                        mood: 'happy',
                        speech: "Here's what I found! ✨🚀",
                        duration: 3500,
                        celebrate: true,
                        revert: true
                    }
                })
            );
            const timer = setTimeout(() => {
                setBlobMood('curious');
            }, 2500);
            return () => clearTimeout(timer);
        }
        prevGeneratingRef.current = isGenerating;
    }, [isGenerating, webSearch]);

    useEffect(() => {
        if (error) {
            setBlobMood('surprised');
            dispatch(addToast({ message: error, type: 'error' }));
            dispatch(setError(null));
        }
    }, [error, dispatch]);

    useEffect(() => {
        if (input.trim().length > 0) {
            setBlobGaze({ x: 0, y: 15 });
        } else {
            setBlobGaze({ x: 0, y: 0 });
        }
    }, [input]);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // 2 seconds delay
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    useEffect(() => {
        // Prevent API calls when navigating to optimistic '/chat/new' route
        if (id && id !== 'new') {
            handleGetMessages(id);
            // Restore persistent queued messages from IndexedDB
            getQueueItems(id).then(storedQueue => {
                if (storedQueue && storedQueue.length > 0) {
                    setMessageQueue(storedQueue);
                }
            }).catch(e => console.warn("Failed to load queue from IndexedDB", e));
        }
    }, [id]);

    const handleRetry = () => {
        dispatch(setError(null));
        if (id && id !== 'new') {
            handleGetMessages(id);
        }
    };

    const scrollToBottom = () => {
        if (scrollerRef.current) {
            scrollerRef.current.scrollTo({
                top: scrollerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Auto scroll logic: scroll to bottom or to a specifically searched message hash
    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(() => {
                const scroller = scrollerRef.current;
                const hash = window.location.hash;
                
                // If URL contains a message hash (e.g. redirected from Library message search)
                if (hash && hash.startsWith('#msg-')) {
                    const targetElement = document.querySelector(hash);
                    if (targetElement && scroller) {
                        scroller.scrollTo({
                            top: targetElement.offsetTop - 40,
                            behavior: 'smooth'
                        });
                        
                        // Apply subtle highlight animation
                        targetElement.style.transition = 'background-color 1s ease';
                        targetElement.style.backgroundColor = 'rgba(96, 166, 175, 0.1)';
                        setTimeout(() => {
                            targetElement.style.backgroundColor = 'transparent';
                            window.history.replaceState(null, null, ' ');
                        }, 2500);
                        
                        return;
                    }
                }
                
                // Normal behavior: scroll to bottom of chat
                if (scroller) {
                    scroller.scrollTop = scroller.scrollHeight;
                }
            });
        }
    }, [messages.length, id]);

    // Show/hide scroll to bottom button based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            if (scrollerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;
                // Show button if we're not near the bottom (more than 300px away)
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;
                setShowScrollButton(!isNearBottom);
                setIsScrolled(scrollTop > 20);
            }
        };

        const scroller = scrollerRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll);
        }
        return () => scroller?.removeEventListener('scroll', handleScroll);
    }, []);

    // ─── Scroll-up pagination: load older messages when near top ─────────────
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const handleScrollUp = async () => {
            // Trigger when scrolled near top (< 60px from top) and more messages exist
            if (scroller.scrollTop < 60 && hasMoreMessages && !isLoadingMore && id && id !== 'new') {
                const prevScrollHeight = scroller.scrollHeight;
                await handleLoadMoreMessages(id, messagesPage);
                // Preserve scroll position after prepending older messages
                requestAnimationFrame(() => {
                    const newScrollHeight = scroller.scrollHeight;
                    scroller.scrollTop = newScrollHeight - prevScrollHeight;
                });
            }
        };

        scroller.addEventListener('scroll', handleScrollUp);
        return () => scroller.removeEventListener('scroll', handleScrollUp);
    }, [hasMoreMessages, isLoadingMore, messagesPage, id]);

    const handleSendFollowUp = async (e) => {
        if (e) e.preventDefault();
        const fileObjects = files.map(f => f.fileObject).filter(Boolean);
        const filesToSend = fileObjects.length > 1 ? fileObjects : (fileObjects[0] || null);
        if (!input.trim() && !filesToSend) return;

        const currentInput = input;

        // If AI is currently generating response, add message to queue!
        if (isGenerating) {
            const queueItem = {
                id: Date.now().toString(),
                chatId: id,
                createdAt: Date.now(),
                text: currentInput,
                files: [...files],
                fileObjects: filesToSend,
                model: selectedModel,
                webSearch: webSearch
            };
            setMessageQueue(prev => [...prev, queueItem]);
            saveQueueItem(queueItem);
            setInput('');
            setFiles([]);
            dispatch(addToast({ message: "Message added to queue! Saved offline & will automatically send when AI finishes.", type: "info" }));
            return;
        }

        setInput(''); // Immediately clear input
        setFiles([]);

        try {
            const response = await handleSendMessage(currentInput, id, filesToSend, selectedModel, webSearch, memoryEnabled, incognito);
            if (response && response.aiMessage) {
                setLatestMessageId(response.aiMessage._id);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Failed to send follow-up:", error);
            setInput(currentInput); // Restore on error
        }
    };

    // Auto-process message queue once active AI response is finished
    useEffect(() => {
        if (!isGenerating && messageQueue.length > 0) {
            const nextItem = messageQueue[0];
            setMessageQueue(prev => prev.slice(1));
            removeQueueItem(nextItem.id);
            (async () => {
                try {
                    const response = await handleSendMessage(
                        nextItem.text, 
                        id, 
                        nextItem.fileObjects, 
                        nextItem.model || selectedModel,
                        nextItem.webSearch !== undefined ? nextItem.webSearch : webSearch,
                        memoryEnabled,
                        incognito
                    );
                    if (response && response.aiMessage) {
                        setLatestMessageId(response.aiMessage._id);
                        setTimeout(scrollToBottom, 100);
                    }
                } catch (err) {
                    console.error("Failed to execute queued message:", err);
                }
            })();
        }
    }, [isGenerating, messageQueue, id, selectedModel, webSearch]);

    // Queue management actions
    const handleEditQueuedMessage = (item, index) => {
        setMessageQueue(prev => prev.filter((_, i) => i !== index));
        if (item?.id) {
            removeQueueItem(item.id);
        }
        setInput(item.text || '');
        if (item.files) setFiles(item.files);
        dispatch(addToast({ message: "Loaded queued message back into input box.", type: "info" }));
    };

    const handleDeleteQueuedMessage = (index, item) => {
        setMessageQueue(prev => prev.filter((_, i) => i !== index));
        const targetId = item?.id || messageQueue[index]?.id;
        if (targetId) {
            removeQueueItem(targetId);
        }
        dispatch(addToast({ message: "Queued message removed.", type: "info" }));
    };

    const handleStopGenerating = () => {
        dispatch(setIsGenerating(false));
        dispatch(setLoading(false));
        setBlobMood('surprised');
        dispatch(addToast({ message: "Stopped AI response.", type: "info" }));
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e) => {
        const uploadedFiles = Array.from(e.target.files);
        setFiles([...files, ...uploadedFiles.map(f => ({ name: f.name, isLink: false, fileObject: f }))]);
        setIsUploadMenuOpen(false);
    };


    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[var(--color-clear-hanada)]/30">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className={`flex-1 flex flex-col h-[100dvh] ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} overflow-hidden relative transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>

                {/* ChatGPT-style Header Container */}
                <header className={`h-12 sm:h-14 bg-[#0B0B0B]/90 backdrop-blur-md z-30 shrink-0 border-b border-white/[0.08] transition-all duration-300`}>
                    <div className="max-w-[800px] mx-auto h-full flex items-center justify-between px-2.5 sm:px-6">
                        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
                            {/* Mobile sidebar button */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-1.5 sm:p-2 -ml-1 text-zinc-400 hover:text-white transition-all rounded-lg shrink-0 active:scale-95 cursor-pointer"
                                aria-label="Open sidebar"
                            >
                                <RiMenuLine size={20} />
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <ParsuLogo className="w-5 h-5 text-[var(--accent-cyan)] shrink-0" />
                                <span className="font-bold text-sm text-zinc-100 truncate">Parsu</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            <ModelSelectorDropdown
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                compact={true}
                                placement="bottom"
                            />

                            <button 
                                onClick={handleShare}
                                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-[11px] font-bold shrink-0 border
                                        ${isCopied 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                                        }`}
                                title="Share conversation"
                            >
                                {isCopied ? <RiCheckLine size={13} /> : <RiShareLine size={13} />}
                                <span className="hidden md:inline">{isCopied ? "Copied" : "Share"}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Incognito Banner */}
                {incognito && (
                    <div className="bg-purple-950/40 border-b border-purple-500/20 px-3 sm:px-6 py-2 flex items-center justify-between text-xs text-purple-300 backdrop-blur-sm z-20 shrink-0">
                        <div className="max-w-[800px] mx-auto w-full flex items-center gap-2">
                            <RiSpyLine size={15} className="text-purple-400 shrink-0" />
                            <span className="font-semibold text-purple-200">Incognito Mode Active</span>
                            <span className="text-purple-300/70 hidden sm:inline">— Chats are private, not saved to your history, and cross-chat memory is disabled.</span>
                            <button
                                onClick={() => {
                                    localStorage.setItem('parsu_incognito', '0');
                                    setIncognito(false);
                                    window.dispatchEvent(new CustomEvent('parsu_incognito_change', { detail: false }));
                                }}
                                className="ml-auto text-[11px] underline text-purple-400 hover:text-purple-200 cursor-pointer font-medium"
                            >
                                Turn off
                            </button>
                        </div>
                    </div>
                )}

                <div ref={scrollerRef} data-lenis-prevent className="flex-1 overflow-y-auto px-4 md:px-6 py-8 md:py-16 pb-[300px] custom-scrollbar scroll-smooth relative">
                    <div className="max-w-[800px] mx-auto space-y-8 mb-32">
                        {/* Load earlier messages indicator */}
                        {hasMoreMessages && (
                            <div className="flex justify-center py-3">
                                {isLoadingMore ? (
                                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                        <div className="w-4 h-4 border-2 border-[var(--color-clear-hanada)]/30 border-t-[#60A6AF] rounded-full animate-spin" />
                                        Loading earlier messages...
                                    </div>
                                ) : (
                                    <button 
                                        onClick={async () => {
                                            const scroller = scrollerRef.current;
                                            const prevScrollHeight = scroller?.scrollHeight || 0;
                                            await handleLoadMoreMessages(id, messagesPage);
                                            requestAnimationFrame(() => {
                                                if (scroller) scroller.scrollTop = scroller.scrollHeight - prevScrollHeight;
                                            });
                                        }}
                                        className="text-xs text-[var(--color-clear-hanada)] hover:text-[var(--color-deep-hanada)] font-semibold transition-colors"
                                    >
                                        ↑ Load earlier messages
                                    </button>
                                )}
                            </div>
                        )}

                        {loading && messages.length === 0 ? (
                            <MessagesSkeleton />
                        ) : (
                            <>
                                {messages.map((msg, index) => (
                                    <ChatMessage 
                                        key={msg._id} 
                                        msg={msg} 
                                        isLatest={index === messages.length - 1}
                                        isNewMessage={msg._id === latestMessageId}
                                    />
                                ))}
                                {loading && (
                                    messages.length === 0 || 
                                    messages[messages.length - 1].role !== 'ai' || 
                                    !messages[messages.length - 1].content
                                ) && (
                                    <ThinkingSkeleton />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Move to bottom button */}
                {showScrollButton && (
                    <div className={`absolute bottom-[180px] left-0 right-0 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'} flex justify-center z-40 pointer-events-none transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
                        <button 
                            onClick={scrollToBottom}
                            className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 p-2.5 rounded-full shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 group pointer-events-auto"
                            title="Move to bottom"
                        >
                            <RiArrowDownLine size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                )}

                <FollowUpInput
                    input={input}
                    setInput={setInput}
                    onSubmit={handleSendFollowUp}
                    files={files}
                    removeFile={removeFile}
                    isUploadMenuOpen={isUploadMenuOpen}
                    setIsUploadMenuOpen={setIsUploadMenuOpen}
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    isResponding={isGenerating}
                    queue={messageQueue}
                    onStopGenerating={handleStopGenerating}
                    onEditQueuedMessage={handleEditQueuedMessage}
                    onDeleteQueuedMessage={handleDeleteQueuedMessage}
                    webSearch={webSearch}
                    onToggleWebSearch={handleToggleWebSearch}
                    memoryEnabled={memoryEnabled}
                    onToggleMemory={handleToggleMemory}
                />

                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                    />
                )}
            </div>
        </div>

    );
};

export default ChatPage2;
