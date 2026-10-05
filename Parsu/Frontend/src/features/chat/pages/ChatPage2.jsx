import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router';
import {
    RiArrowDownLine,
    RiSpyLine
} from '@remixicon/react';
import Sidebar from '../../Components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import FollowUpInput from '../components/FollowUpInput';
import { useChat } from '../hook/useChat';
import { useSelector, useDispatch } from 'react-redux';
import { MessagesSkeleton, ThinkingSkeleton } from '../components/Skeletons';
import { setError, setLoading } from '../chat.slice';
import { addToast } from '../../../utils/toast.slice';
import ChatNavbar from '../components/ChatNavbar';
import { getModels } from '../service/model.api';
import { getStoredThinkingLevel } from '../components/ThinkingSelectorDropdown';
import { saveQueueItem, getQueueItems, removeQueueItem } from '../../../utils/queueDb';
import { useAiFeatureToggles } from '../../../utils/aiSettingsSync';
import VoiceMode from '../components/VoiceMode';
import { resolveIntent } from '../hook/useVoiceAgent';
import { executeDeviceCommandApi } from '../../device/service/device.api';

const ChatPage2 = () => {
    // Extract chat id from URL parameters (e.g., /chat/123 -> id: 123)
    const { id } = useParams();
    
    // UI states
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar drawer state
    const [input, setInput] = useState(''); // Chat input field
    const [isScrolled, setIsScrolled] = useState(false); // Header shadow state on scroll
    const [selectedModel, setSelectedModel] = useState(null); // Active AI model for chat
    const [thinkingLevel, setThinkingLevel] = useState(getStoredThinkingLevel); // AI Thinking Mode
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
    const chats = useSelector(state => state.chat.chats);
    const error = useSelector(state => state.chat.error);
    const hasMoreMessages = useSelector(state => state.chat.hasMoreMessages);
    const messagesPage = useSelector(state => state.chat.messagesPage);
    const isLoadingMore = useSelector(state => state.chat.isLoadingMore);
    const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
    const user = useSelector(state => state.auth?.user);
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

    // Sync active model state when auto-switched by server
    useEffect(() => {
        const handleAutoSwitch = (e) => {
            if (e.detail?.modelId) {
                setSelectedModel({
                    id: e.detail.modelId,
                    modelId: e.detail.modelId,
                    name: e.detail.name || e.detail.modelName || e.detail.modelId,
                    modelName: e.detail.name || e.detail.modelName || e.detail.modelId,
                    provider: e.detail.provider || 'gemini',
                    badge: e.detail.badge || 'Fast',
                    isCustom: Boolean(e.detail.isCustom)
                });
            }
        };
        window.addEventListener('model_auto_switched', handleAutoSwitch);
        return () => window.removeEventListener('model_auto_switched', handleAutoSwitch);
    }, []);

    // Initialize model preference from backend or user custom key on mount
    useEffect(() => {
        let mounted = true;
        getModels().then(data => {
            if (mounted && data?.success) {
                const activeCustom = data.customModels?.[0];
                const initial = (user?.customApiKeys?.some(k => k.isActive !== false && k.apiKey) && activeCustom)
                    ? activeCustom
                    : (data.selectedModel || data.defaultModels?.[0]);
                if (initial) setSelectedModel(initial);
            }
        }).catch(() => {});
        return () => { mounted = false; };
    }, [user]);

    // Share link button state
    const [isCopied, setIsCopied] = useState(false);
    const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

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

    const handleSendFollowUp = async (e, textOverride = null) => {
        if (e) e.preventDefault();

        // If network gone, user cannot send a message
        if (!navigator.onLine) {
            dispatch(addToast({
                type: 'warning',
                message: 'No internet connection. Please check your network.'
            }));
            return null;
        }

        const fileObjects = files.map(f => f.fileObject).filter(Boolean);
        const filesToSend = fileObjects.length > 1 ? fileObjects : (fileObjects[0] || null);
        const currentInput = textOverride !== null ? textOverride : input;
        if (!currentInput.trim() && !filesToSend) return null;

        // Check if message is an instant device, URL, or navigation action
        const intent = resolveIntent(currentInput);
        if (intent) {
            if (intent.type === 'device_cmd') {
                executeDeviceCommandApi({
                    targetSelector: intent.targetSelector || intent.params?.targetSelector,
                    action: intent.action,
                    params: intent.params,
                    confirmed: true
                }).then((res) => {
                    if (res?.success === false || res?.launched === false) {
                        dispatch(addToast({ type: 'warning', message: res?.error || res?.message || 'App not found, sir, and could not be opened.' }));
                    } else {
                        dispatch(addToast({ type: 'success', message: `⚡ ${intent.label}` }));
                    }
                }).catch(err => {
                    dispatch(addToast({ type: 'warning', message: `Device: ${err?.response?.data?.message || err.message}` }));
                });
            } else if (intent.type === 'open_url') {
                window.open(intent.url, '_blank', 'noopener,noreferrer');
                dispatch(addToast({ type: 'info', message: `🌐 Opening ${intent.label}` }));
            } else if (intent.type === 'scroll') {
                if (intent.to === 'top') scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                else if (intent.to === 'bottom') scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
                else scrollerRef.current?.scrollBy({ top: intent.by, behavior: 'smooth' });
                dispatch(addToast({ type: 'info', message: `Scrolling ${intent.by > 0 ? 'down' : 'up'}` }));
            }
        }

        // Optimistically auto-switch to custom model if user added custom key and is currently on built-in model
        let effectiveSendModel = selectedModel;
        const activeCustomKey = user?.customApiKeys?.find(k => k.isActive !== false && k.apiKey);
        if (activeCustomKey && !selectedModel?.isCustom) {
            const customModelId = activeCustomKey.models?.[0]?.id || (activeCustomKey.provider === "gemini" ? "gemini-3.6-flash" : activeCustomKey.provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gpt-4o");
            const customModelName = activeCustomKey.models?.[0]?.name || `${activeCustomKey.provider?.toUpperCase()} (${customModelId})`;
            const optimisticCustomModel = {
                id: customModelId,
                modelId: customModelId,
                name: customModelName,
                modelName: customModelName,
                provider: activeCustomKey.provider,
                badge: "Custom Key",
                isCustom: true,
                keyId: activeCustomKey._id
            };
            setSelectedModel(optimisticCustomModel);
            effectiveSendModel = optimisticCustomModel;
            window.dispatchEvent(new CustomEvent('model_auto_switched', { detail: optimisticCustomModel }));
        }

        // If AI is currently generating response, add message to queue!
        if (isGenerating) {
            const queueItem = {
                id: Date.now().toString(),
                chatId: id,
                createdAt: Date.now(),
                text: currentInput,
                files: [...files],
                fileObjects: filesToSend,
                model: effectiveSendModel,
                webSearch: webSearch
            };
            setMessageQueue(prev => [...prev, queueItem]);
            saveQueueItem(queueItem);
            setInput('');
            setFiles([]);
            dispatch(addToast({ message: "Message added to queue! Saved offline & will automatically send when AI finishes.", type: "info" }));
            return null;
        }

        setInput(''); // Immediately clear input
        setFiles([]);

        try {
            const response = await handleSendMessage(currentInput, id, filesToSend, effectiveSendModel, webSearch, memoryEnabled, incognito, thinkingLevel);
            if (response && response.aiMessage) {
                setLatestMessageId(response.aiMessage._id);
                setTimeout(scrollToBottom, 100);
            }
            return response;
        } catch (error) {
            console.error("Failed to send follow-up:", error);
            if (textOverride === null) setInput(currentInput); // Restore on error
            return null;
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
                        incognito,
                        nextItem.thinkingLevel || thinkingLevel
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

                {/* Main AI Chatbot Navbar (ChatGPT-style) */}
                <ChatNavbar
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    title={chats.find(c => c._id === id)?.title}
                    chatId={id}
                    onOpenVoice={() => setIsVoiceModeOpen(true)}
                />

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

                        {((loading || error || (typeof navigator !== 'undefined' && !navigator.onLine)) && messages.length === 0) ? (
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
                    thinkingLevel={thinkingLevel}
                    onThinkingChange={setThinkingLevel}
                    isResponding={isGenerating}
                    queue={messageQueue}
                    onStopGenerating={handleStopGenerating}
                    onEditQueuedMessage={handleEditQueuedMessage}
                    onDeleteQueuedMessage={handleDeleteQueuedMessage}
                    webSearch={webSearch}
                    onToggleWebSearch={handleToggleWebSearch}
                    memoryEnabled={memoryEnabled}
                    onToggleMemory={handleToggleMemory}
                    onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
                />



                {/* Parsu Voice Agent — Jarvis mode */}
                <VoiceMode
                    isOpen={isVoiceModeOpen}
                    onClose={() => setIsVoiceModeOpen(false)}
                    lastAiMessage={messages.filter(m => m.role === 'ai').at(-1)?.content || ''}
                    onSendMessage={async (text) => {
                        try {
                            const res = await handleSendFollowUp(null, text);
                            return res?.aiMessage?.content || null;
                        } catch (err) {
                            console.error("VoiceMode send failed:", err);
                            return null;
                        }
                    }}
                />
            </div>
        </div>

    );
};

export default ChatPage2;
