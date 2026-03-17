import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import {
    RiMenuLine,
    RiShareLine,
    RiArrowDownLine
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
    const { id } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
    const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
    const [linkInput, setLinkInput] = useState('');

    const { handleGetMessages, handleSendMessage, loading } = useChat();
    const messages = useSelector(state => state.chat.messages);
    const error = useSelector(state => state.chat.error);
    const dispatch = useDispatch();
    const [latestMessageId, setLatestMessageId] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        if (id) {
            handleGetMessages(id);
        }
    }, [id]);

    const handleRetry = () => {
        dispatch(setError(null));
        if (id) {
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

    // Auto scroll to bottom when messages load or a new message is added
    useEffect(() => {
        if (messages.length > 0) {
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
                const scroller = scrollerRef.current;
                if (scroller) {
                    scroller.scrollTop = scroller.scrollHeight;
                }
            });
        }
    }, [messages.length, id]); // Scroll on new messages or chat switch

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
        <div className="flex bg-[#050505] min-h-screen text-zinc-100 font-sans selection:bg-[#60A6AF]/30 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <Toast message={error} type="error" onClose={() => dispatch(setError(null))} />

            <div className={`flex-1 flex flex-col h-screen lg:pl-56 overflow-hidden relative transition-all duration-300`}>

                {/* Header Container */}
                <header className={`h-14 bg-[#050505] z-30 shrink-0 transition-all duration-300 ${isScrolled ? 'border-b border-zinc-900 shadow-lg bg-[#050505]/95 backdrop-blur-md' : ''}`}>
                    <div className="max-w-fluid mx-auto h-full flex items-center justify-between px-6">
                        <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-white transition-all"
                            >
                                <RiMenuLine size={20} />
                            </button>
                            <button className="flex items-center gap-2 text-[13px] font-bold text-zinc-100 border-b-2 border-white pb-3 mt-3 shrink-0">
                                Knowledge
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-[11px] font-bold text-zinc-200 shrink-0">
                            <RiShareLine size={12} />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </header>

                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-8 md:py-16 pb-[300px] custom-scrollbar scroll-smooth relative">
                    <div className="max-w-fluid mx-auto space-y-24 mb-32">
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
                                    <ThinkingSkeleton />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Move to bottom button */}
                {showScrollButton && (
                    <div className="absolute bottom-[180px] left-0 right-0 flex justify-center z-40 pointer-events-none">
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
