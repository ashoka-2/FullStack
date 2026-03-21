import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import {
    RiMenuLine,
    RiShareLine,
    RiArrowDownLine,
    RiCheckLine
} from '@remixicon/react';
import Sidebar from '../../Components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import FollowUpInput from '../components/FollowUpInput';
import { useChat } from '../hook/useChat';
import { useSelector } from 'react-redux';
import { MessagesSkeleton, ThinkingSkeleton } from '../components/Skeletons';
import Toast from '../../Components/Toast';
import { setError } from '../chat.slice';
import { useDispatch } from 'react-redux';

const ChatPage2 = () => {
    // URL params se chat id nikal rahe hain (eg: /chat/123 -> id: 123)
    const { id } = useParams();
    
    // UI states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile pe sidebar open/close
    const [input, setInput] = useState(''); // Chat box input
    const [isScrolled, setIsScrolled] = useState(false); // Header pe shadow lagan ke liye jab page scroll ho
    
    // References & Elements
    const scrollerRef = useRef(null); // Chat history overflow scroll control
    const fileInputRef = useRef(null); // Hidden file input selector
    
    // Attachment & Upload Menu States
    const [files, setFiles] = useState([]); // Jo file hum user se local upload lenge
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false); // Attachment dropdown on/off
    const [isLinkInputOpen, setIsLinkInputOpen] = useState(false); // Link add karne wala popup
    const [linkInput, setLinkInput] = useState(''); // Link ki value
    
    // Chat custom hook functions
    const { handleGetMessages, handleSendMessage, loading } = useChat();

    // Redux se messages aur global error fetch kar rahe hain
    const messages = useSelector(state => state.chat.messages);
    const error = useSelector(state => state.chat.error);
    const dispatch = useDispatch();
    const [latestMessageId, setLatestMessageId] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Share link button state
    const [isCopied, setIsCopied] = useState(false);

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
        // Jab user naya message send karta hai ChatArea se, hum turant '/chat/new' pe navigate kar dete hain (Optimistic Routing)
        // Isliye 'new' wale route pe backend call na lage (kyunki ye valid ObjectId nahi hai), 
        // hum check laga rhe hain ki id 'new' na ho
        if (id && id !== 'new') {
            handleGetMessages(id);
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

    // Auto scroll logic: either to bottom or to a specifically searched message
    useEffect(() => {
        if (messages.length > 0) {
            // requestAnimationFrame DOM paint hone ka wait karta hai taaki sab render ho chuka ho
            requestAnimationFrame(() => {
                const scroller = scrollerRef.current;
                const hash = window.location.hash;
                
                // Agar URL mein hash hai (Matlab Library page ke message search se redirect hua hai)
                if (hash && hash.startsWith('#msg-')) {
                    const targetElement = document.querySelector(hash);
                    if (targetElement && scroller) {
                        // Screen ko us highlighted message par scroll kar do
                        scroller.scrollTo({
                            top: targetElement.offsetTop - 40, // Header ke liye thodi space chhodne ke liye
                            behavior: 'smooth'
                        });
                        
                        // Ek subtle glow (highlight) dekar 2 seconds baad nikal dete hain, jisse premium feel aaye
                        targetElement.style.transition = 'background-color 1s ease';
                        targetElement.style.backgroundColor = 'rgba(96, 166, 175, 0.1)';
                        setTimeout(() => {
                            targetElement.style.backgroundColor = 'transparent';
                            // Ek baar dhundh liya toh aage disturb na hone ke liye hash path hata dete hain (optional)
                            window.history.replaceState(null, null, ' ');
                        }, 2500);
                        
                        return; // Yahan return kar diye taaki neeche wali "scroll to bottom" trigger na ho
                    }
                }
                
                // Normal Behavior: Agar kisi khas message ka search nahi hai, toh seedha chat ke end (bottom) par pahuche
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

    const handleSendFollowUp = async (e) => {
        if (e) e.preventDefault();
        const file = files.find(f => !f.isLink)?.fileObject; // Find the first actual file
        if ((!input.trim() && !file) || loading) return;

        const currentInput = input;
        setInput(''); // Immediately clear input
        setFiles([]);

        try {
            const response = await handleSendMessage(currentInput, id, file);
            if (response && response.aiMessage) {
                setLatestMessageId(response.aiMessage._id);
                // Force scroll to bottom when AI starts responding
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Failed to send follow-up:", error);
            setInput(currentInput); // Restore on error
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e) => {
        const uploadedFiles = Array.from(e.target.files);
        setFiles([...files, ...uploadedFiles.map(f => ({ name: f.name, isLink: false, fileObject: f }))]);
        setIsUploadMenuOpen(false);
    };

    const handleAddLink = (e) => {
        e.preventDefault();
        if (linkInput.trim()) {
            setFiles([...files, { name: linkInput, isLink: true }]);
            setLinkInput('');
            setIsLinkInputOpen(false);
        }
    };

    return (
        <div className="flex bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#60A6AF]/30 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <Toast message={error} type="error" onClose={() => dispatch(setError(null))} />

            <div className={`flex-1 flex flex-col h-screen lg:pl-56 overflow-hidden relative transition-all duration-300`}>

                {/* Header Container */}
                <header className={`h-14 bg-white dark:bg-[#050505] z-30 shrink-0 transition-all duration-300 ${isScrolled ? 'border-b border-zinc-200 dark:border-zinc-900 shadow-lg bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md' : ''}`}>
                    <div className="max-w-[800px] mx-auto h-full flex items-center justify-between px-6">
                        <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-all"
                            >
                                <RiMenuLine size={20} />
                            </button>
                            <button className="flex items-center gap-2 text-[13px] font-bold text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-white pb-3 mt-3 shrink-0">
                                Knowledge
                            </button>
                        </div>
                        <button 
                            onClick={handleShare}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold shrink-0 border
                                ${isCopied 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                                }`}
                        >
                            {isCopied ? <RiCheckLine size={12} /> : <RiShareLine size={12} />}
                            <span className="hidden sm:inline">{isCopied ? "Copied" : "Share"}</span>
                        </button>
                    </div>
                </header>

                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-8 md:py-16 pb-[300px] custom-scrollbar scroll-smooth relative">
                    <div className="max-w-[800px] mx-auto space-y-8 mb-32">
                        {loading && messages.length === 0 ? (
                            <MessagesSkeleton />
                        ) : (
                            <>
                                {messages.map((msg, index) => (
                                    <ChatMessage 
                                        key={msg._id} 
                                        msg={{ ...msg, content: msg.content, role: msg.role === 'ai' ? 'assistant' : 'user' }} 
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
                    <div className="absolute bottom-[180px] left-0 right-0 lg:pl-56 flex justify-center z-40 pointer-events-none">
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
                    isLinkInputOpen={isLinkInputOpen}
                    setIsLinkInputOpen={setIsLinkInputOpen}
                    linkInput={linkInput}
                    setLinkInput={setLinkInput}
                    handleAddLink={handleAddLink}
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
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
