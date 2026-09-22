import React, { useState, useEffect } from 'react';
import { 
  RiFileCopyLine, 
  RiRefreshLine, 
  RiThumbUpLine, 
  RiThumbUpFill,
  RiThumbDownLine,
  RiThumbDownFill,
  RiVolumeUpLine,
  RiVolumeUpFill,
  RiVolumeMuteLine,
  RiCheckLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiPinterestLine,
  RiTiktokLine,
  RiYoutubeLine,
  RiImageLine,
  RiVideoLine,
  RiFilePdfLine,
  RiShareLine,
  RiCloseLine,
  RiSparklingLine,
  RiMagicLine
} from '@remixicon/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { publishMedia, generateCaption } from '../../auth/service/social.api';
import { sendFeedback } from '../service/chat.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const CodeBlock = ({ code, language, ...props }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 sm:my-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d0d0d] max-w-full">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{language}</span>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                >
                    {copied ? (
                        <>
                            <span className="text-[10px] font-bold text-emerald-500">Copied!</span>
                            <RiCheckLine size={14} className="text-emerald-500" />
                        </>
                    ) : (
                        <RiFileCopyLine size={14} />
                    )}
                </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar w-full">
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '12.5px',
                        lineHeight: '1.6'
                    }}
                    {...props}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const SOCIAL_PLATFORMS_LIST = [
    { id: 'instagram', name: 'Instagram', icon: RiInstagramLine, color: '#E1306C' },
    { id: 'facebook', name: 'Facebook', icon: RiFacebookCircleLine, color: '#1877F2' },
    { id: 'twitter', name: 'Twitter / X', icon: RiTwitterXLine, color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: RiLinkedinBoxLine, color: '#0077B5' },
    { id: 'pinterest', name: 'Pinterest', icon: RiPinterestLine, color: '#E60023' },
    { id: 'tiktok', name: 'TikTok', icon: RiTiktokLine, color: '#00f2ea' },
    { id: 'youtube', name: 'YouTube', icon: RiYoutubeLine, color: '#FF0000' }
];

const detectCodeLanguage = (str) => {
    if (typeof str !== 'string') return 'code';
    if (/^\s*(import|const|let|var|function|export|document\.|window\.|console\.)/m.test(str)) return 'javascript';
    if (/^\s*(def |class .*:\s*$|import .*|from .* import |print\()/m.test(str)) return 'python';
    if (/^\s*(<(!DOCTYPE|html|div|span|p|a|script|style)|<\/[a-z]+>)/im.test(str)) return 'html';
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE)\b/im.test(str)) return 'sql';
    if (/^\s*(#include|int main|std::|void )/m.test(str)) return 'cpp';
    if (/^\s*(\{[\s\S]*\}|\[[\s\S]*\])$/.test(str.trim()) && (str.includes('":') || str.includes('",'))) return 'json';
    return 'code';
};

const isRawCodeBlock = (text) => {
    if (typeof text !== 'string') return false;
    if (text.includes('```')) return false;
    return (
        text.includes('\n') && (
            /^(import|export|const|let|var|function|class|def|public|private|protected|interface|type|return|<[a-zA-Z]+|\/\/|\/\*|#include|package|func|select|from|where)\b/im.test(text) ||
            /[{}();=>\[\]]/.test(text)
        )
    );
};

const ChatMessage = ({ msg, isLatest, isNewMessage }) => {
    const isUser = msg.role === 'user';
    const dispatch = useDispatch();
    const [displayedContent, setDisplayedContent] = useState(msg.content);
    const [isTyping, setIsTyping] = useState(false);
    const [copied, setCopied] = useState(false);

    // Feedback State ('like' | 'dislike' | null)
    const [feedback, setFeedback] = useState(msg.feedback || null);

    // Text-to-speech Speaking State
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Social Sharing Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
    const [postMode, setPostMode] = useState('together'); // 'together' | 'separately'
    const [captionText, setCaptionText] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [publishFeedback, setPublishFeedback] = useState(null);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    // Extract all attached media items
    const allMediaItems = [];
    if (msg.files && Array.isArray(msg.files) && msg.files.length > 0) {
        allMediaItems.push(...msg.files.filter(f => f?.url));
    } else if (msg.file?.url) {
        allMediaItems.push(msg.file);
    }

    const hasMedia = allMediaItems.length > 0;
    const isMultipleMedia = allMediaItems.length > 1;

    useEffect(() => {
        setDisplayedContent(msg.content);
        if (msg.content && msg.content !== 'Sent an image' && msg.content !== 'Sent a video' && !msg.content.startsWith('Sent ')) {
            setCaptionText(msg.content);
        }
    }, [msg.content]);

    useEffect(() => {
        if (msg.feedback !== undefined) {
            setFeedback(msg.feedback);
        }
    }, [msg.feedback]);

    // Cancel speech if another message starts speaking
    useEffect(() => {
        const handleCancelSpeech = (e) => {
            if (e.detail?.activeId !== msg._id && isSpeaking) {
                setIsSpeaking(false);
            }
        };
        window.addEventListener('cancel_all_message_speech', handleCancelSpeech);
        return () => window.removeEventListener('cancel_all_message_speech', handleCancelSpeech);
    }, [isSpeaking, msg._id]);

    // Handle like / dislike response rating
    const handleFeedback = async (type) => {
        const nextFeedback = feedback === type ? null : type;
        setFeedback(nextFeedback);

        if (nextFeedback === 'like') {
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'love', speech: "Glad you liked this answer! ❤️✨", duration: 2500, revert: true }
                })
            );
            dispatch(addToast({ message: "Marked as good response! AI will prioritize this quality.", type: "success" }));
        } else if (nextFeedback === 'dislike') {
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'sad', speech: "Noted! I'll improve the next response. 🥺", duration: 2500, revert: true }
                })
            );
            dispatch(addToast({ message: "Marked as bad response. AI will refine its answers next time.", type: "info" }));
        }

        if (msg._id && !String(msg._id).startsWith('temp-') && !String(msg._id).startsWith('streaming-')) {
            try {
                await sendFeedback(msg._id, nextFeedback);
            } catch (err) {
                console.warn("Feedback sync failed:", err);
            }
        }
    };

    // Handle Text-to-Speech playback & mascot speech sync
    const handleToggleSpeech = () => {
        if (!('speechSynthesis' in window)) {
            dispatch(addToast({ message: "Speech Synthesis is not supported in this browser.", type: "warning" }));
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
            return;
        }

        window.speechSynthesis.cancel();
        window.dispatchEvent(new CustomEvent('cancel_all_message_speech', { detail: { activeId: msg._id } }));

        // Strip markdown syntax for natural reading
        const rawText = msg.content || "";
        const cleanText = rawText
            .replace(/```[\s\S]*?```/g, "Code block omitted.")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/https?:\/\/\S+/g, "link")
            .replace(/[*_~#\[\]()]/g, "")
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);

        const savedVoiceURI = localStorage.getItem("perplexity_tts_voice");
        const savedRate = parseFloat(localStorage.getItem("perplexity_tts_rate") || "1");
        const savedPitch = parseFloat(localStorage.getItem("perplexity_tts_pitch") || "1");

        const voices = window.speechSynthesis.getVoices();
        if (savedVoiceURI && voices.length > 0) {
            const matchedVoice = voices.find(v => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
            if (matchedVoice) utterance.voice = matchedVoice;
        }

        utterance.rate = isNaN(savedRate) ? 1 : savedRate;
        utterance.pitch = isNaN(savedPitch) ? 1 : savedPitch;

        utterance.onstart = () => {
            setIsSpeaking(true);
            window.dispatchEvent(new CustomEvent('blob_speech_state', {
                detail: { speaking: true, text: "Speaking AI response... 🔊" }
            }));
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleCopy = () => {
        if (msg.content) {
            navigator.clipboard.writeText(msg.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const togglePlatform = (pId) => {
        if (selectedPlatforms.includes(pId)) {
            if (selectedPlatforms.length > 1) {
                setSelectedPlatforms(selectedPlatforms.filter(p => p !== pId));
            }
        } else {
            setSelectedPlatforms([...selectedPlatforms, pId]);
        }
    };

    const handleGenerateAiCaption = async () => {
        try {
            setIsGeneratingCaption(true);
            const mediaUrls = allMediaItems.map(m => m.url);
            const res = await generateCaption({
                mediaUrls,
                context: msg.content || captionText,
                platform: selectedPlatforms.join(', ')
            });
            if (res.success && res.caption) {
                setCaptionText(res.caption);
                window.dispatchEvent(
                    new CustomEvent('blob_trigger_mood', {
                        detail: { 
                            mood: 'love', 
                            speech: 'Crafted a viral caption with hashtags for you! 🪄✨', 
                            duration: 3500, 
                            revert: true 
                        }
                    })
                );
            }
        } catch (err) {
            console.error("Failed to generate AI caption:", err);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleUniversalPublish = async () => {
        if (selectedPlatforms.length === 0 || allMediaItems.length === 0) return;

        try {
            setIsPosting(true);
            setPublishFeedback(null);

            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { 
                        mood: 'hmm', 
                        speech: `Publishing to ${selectedPlatforms.map(p => p.toUpperCase()).join(', ')}... ⏳`, 
                        duration: 3500, 
                        revert: true 
                    }
                })
            );

            const mediaUrls = allMediaItems.map(m => m.url);
            const res = await publishMedia({
                platforms: selectedPlatforms,
                mediaUrls,
                caption: captionText || (isMultipleMedia ? "Album posted via Perplexity AI" : "Posted via Perplexity AI"),
                postMode,
                messageId: msg._id
            });

            setPublishFeedback(res);

            if (res.results?.successful?.length > 0) {
                const names = res.results.successful.map(s => s.platform).join(', ');
                window.dispatchEvent(
                    new CustomEvent('blob_trigger_mood', {
                        detail: { 
                            mood: 'happy', 
                            speech: `Live on ${names}! 🎉🚀`, 
                            duration: 4000, 
                            celebrate: true, 
                            revert: true 
                        }
                    })
                );
            } else if (res.results?.notConnected?.length > 0) {
                window.dispatchEvent(
                    new CustomEvent('blob_trigger_mood', {
                        detail: { 
                            mood: 'surprised', 
                            speech: `Account not connected yet! Connect in Social Hub ⚡`, 
                            duration: 3500, 
                            revert: true 
                        }
                    })
                );
            }
        } catch (err) {
            console.error("Publish error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to post";
            setPublishFeedback({
                error: errorMsg
            });
            window.dispatchEvent(
                new CustomEvent('blob_trigger_mood', {
                    detail: { mood: 'surprised', speech: `Publish failed! ${errorMsg.slice(0, 30)}`, duration: 3500, revert: true }
                })
            );
        } finally {
            setIsPosting(false);
        }
    };

    const contentToRender = isTyping ? displayedContent : msg.content;

    // Successful posted platforms from DB or recent action
    const existingPosts = msg.socialPosts || [];

    return (
        <div id={`msg-${msg._id}`} className="flex flex-col gap-6 animate-in fade-in duration-500">
            {isUser ? (
                <div className="flex flex-col items-end gap-3 pr-1">
                    {/* Media Display Section */}
                    {hasMedia && (
                        <div className="max-w-[340px] md:max-w-[440px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in duration-300 bg-zinc-950">
                            
                            {/* MULTI-MEDIA ALBUM / GRID */}
                            {isMultipleMedia ? (
                                <div className="relative">
                                    <div className={`grid gap-1 bg-zinc-900 ${allMediaItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                        {allMediaItems.slice(0, 4).map((item, idx) => {
                                            const isVideo = item.fileType === 'video' || item.mimetype?.startsWith('video/') || /\.(mp4|mov|webm)(\?|$)/i.test(item.url);
                                            return (
                                                <div key={idx} className="relative aspect-square overflow-hidden bg-black flex items-center justify-center">
                                                    {isVideo ? (
                                                        <video src={item.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                                                    )}
                                                    {idx === 3 && allMediaItems.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-lg font-bold">
                                                            +{allMediaItems.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="px-3 py-1.5 bg-zinc-900/90 text-zinc-300 text-[11px] font-semibold flex items-center justify-between border-t border-zinc-800">
                                        <span>📁 Album ({allMediaItems.length} items)</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Ready to publish</span>
                                    </div>
                                </div>
                            ) : (
                                /* SINGLE MEDIA ITEM */
                                (() => {
                                    const single = allMediaItems[0];
                                    const isVideo = single.fileType === 'video' || single.mimetype?.startsWith('video/') || /\.(mp4|mov|webm)(\?|$)/i.test(single.url);
                                    const isDoc = single.fileType === 'document' || single.mimetype === 'application/pdf' || /\.(pdf|txt|md|doc|docx)(\?|$)/i.test(single.url);

                                    if (isVideo) {
                                        return (
                                            <div>
                                                <video src={single.url} controls playsInline className="w-full h-auto max-h-[360px] bg-black" />
                                                <div className="px-3.5 py-1.5 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center gap-1.5">
                                                    <RiVideoLine size={15} className="text-purple-400" />
                                                    <span className="truncate">{single.name || "Video"}</span>
                                                </div>
                                            </div>
                                        );
                                    } else if (isDoc) {
                                        return (
                                            <a href={single.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                                    <RiFilePdfLine size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{single.name || "Document"}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Click to view</p>
                                                </div>
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <div>
                                                <img src={single.url} alt="Attached" className="w-full h-auto object-cover max-h-[380px]" />
                                                <div className="px-3.5 py-1.5 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center gap-1.5">
                                                    <RiImageLine size={15} className="text-emerald-400" />
                                                    <span className="truncate">{single.name || "Photo"}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                })()
                            )}

                            {/* Share to Socials Action Bar */}
                            <div className="p-3 bg-[#f8f9fa] dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {existingPosts.map((p, idx) => (
                                        <span key={idx} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 dark:border-emerald-800/40">
                                            <RiCheckLine size={11} /> {p.platform}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setIsShareModalOpen(!isShareModalOpen)}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-95 text-white text-[11px] font-bold transition-all shadow cursor-pointer ml-auto"
                                    title="Publish to connected social media platforms"
                                >
                                    <RiShareLine size={13} />
                                    <span>Share to Socials</span>
                                </button>
                            </div>

                            {/* Interactive Share to Socials Dropdown / Drawer */}
                            {isShareModalOpen && (
                                <div className="p-3.5 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 text-left">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                            <RiSparklingLine size={14} className="text-amber-500" />
                                            Target Platforms:
                                        </span>
                                        <button 
                                            onClick={() => setIsShareModalOpen(false)}
                                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                                        >
                                            <RiCloseLine size={16} />
                                        </button>
                                    </div>

                                    {/* Platform Selection Badges */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {SOCIAL_PLATFORMS_LIST.map((platform) => {
                                            const isSelected = selectedPlatforms.includes(platform.id);
                                            const Icon = platform.icon;
                                            return (
                                                <button
                                                    key={platform.id}
                                                    onClick={() => togglePlatform(platform.id)}
                                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-[#20b8cd]/15 border-[#20b8cd] text-zinc-900 dark:text-white shadow-xs' 
                                                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    <Icon size={13} style={{ color: isSelected ? platform.color : undefined }} />
                                                    <span>{platform.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Carousel vs Separately Option (if multiple files) */}
                                    {isMultipleMedia && (
                                        <div className="flex items-center justify-between mb-3 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px]">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Upload Mode:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setPostMode('together')}
                                                    className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                                        postMode === 'together' 
                                                            ? 'bg-[#20b8cd] text-zinc-950 shadow' 
                                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    Carousel (Together)
                                                </button>
                                                <button
                                                    onClick={() => setPostMode('separately')}
                                                    className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                                        postMode === 'separately' 
                                                            ? 'bg-[#20b8cd] text-zinc-950 shadow' 
                                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                                    }`}
                                                >
                                                    Separately
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Caption Input with AI Generation Button */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                                Caption & Hashtags
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleGenerateAiCaption}
                                                disabled={isGeneratingCaption}
                                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                                                title="Generate viral caption using AI"
                                            >
                                                <RiMagicLine size={12} className={isGeneratingCaption ? "animate-spin text-pink-500" : "text-pink-500"} />
                                                <span>{isGeneratingCaption ? 'Generating...' : 'AI Generate Caption'}</span>
                                            </button>
                                        </div>
                                        <textarea
                                            value={captionText}
                                            onChange={(e) => setCaptionText(e.target.value)}
                                            placeholder="Write or refine caption with hashtags..."
                                            rows={2}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#20b8cd] resize-none font-sans"
                                        />
                                    </div>

                                    {/* Feedback message display */}
                                    {publishFeedback && (
                                        <div className="mb-2 text-[11px] p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            {publishFeedback.results?.successful?.map((s, i) => (
                                                <p key={i} className="text-emerald-500 font-semibold">✓ Posted to {s.platform} (ID: {s.mediaId})</p>
                                            ))}
                                            {publishFeedback.results?.notConnected?.map((nc, i) => (
                                                <p key={i} className="text-amber-500 font-medium">⚠️ {nc.message}</p>
                                            ))}
                                            {publishFeedback.results?.failed?.map((f, i) => (
                                                <p key={i} className="text-red-500 font-medium">❌ {f.platform}: {f.error}</p>
                                            ))}
                                            {publishFeedback.error && (
                                                <p className="text-red-500 font-medium">❌ {publishFeedback.error}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleUniversalPublish}
                                        disabled={isPosting}
                                        className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        <RiShareLine size={14} />
                                        <span>{isPosting ? 'Publishing to Socials...' : `Publish to ${selectedPlatforms.length} Platform(s)`}</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    )}

                    <div className="bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 px-4 md:px-5 py-2.5 md:py-3 rounded-[20px] md:rounded-[22px] text-[14px] md:text-[15px] border border-zinc-200 dark:border-white/5 shadow-sm transition-all hover:bg-zinc-200/70 dark:hover:bg-[#222] max-w-full text-left">
                        {typeof contentToRender === 'string' && contentToRender.includes('```') ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-100">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({node, inline, className, children, ...props}) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const codeString = String(children).replace(/\n$/, '');
                                            return !inline && match ? (
                                                <CodeBlock 
                                                    code={codeString} 
                                                    language={match[1]} 
                                                    {...props} 
                                                />
                                            ) : !inline ? (
                                                <CodeBlock 
                                                    code={codeString} 
                                                    language="code" 
                                                    {...props} 
                                                />
                                            ) : (
                                                <code className={`${className} bg-zinc-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono`} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        p: ({children}) => <p className="whitespace-pre-wrap break-words leading-relaxed mb-2 last:mb-0 font-medium">{children}</p>
                                    }}
                                >
                                    {contentToRender}
                                </ReactMarkdown>
                            </div>
                        ) : typeof contentToRender === 'string' && isRawCodeBlock(contentToRender) ? (
                            <div className="w-full max-w-full overflow-hidden">
                                <CodeBlock code={contentToRender} language={detectCodeLanguage(contentToRender)} />
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap break-words leading-relaxed font-medium">
                                {contentToRender}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {typeof contentToRender === 'string' && /experiencing high traffic right now|at capacity right now/i.test(contentToRender) ? (
                        <div className="p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/25 dark:border-amber-400/20 backdrop-blur-md space-y-3">
                            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                                <RiSparklingLine size={18} className="text-amber-500 animate-pulse" />
                                <span>Gemini High Traffic Notice</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">High Load</span>
                            </div>
                            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                {contentToRender}
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>💡 <strong>Tip:</strong> You can select another AI model from the bottom selector to continue immediately.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-emerald dark:prose-invert max-w-none text-zinc-950 dark:text-zinc-200 leading-[1.7] md:leading-[1.8] text-[15px] md:text-[17px] font-medium tracking-tight">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({node, inline, className, children, ...props}) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const codeString = String(children).replace(/\n$/, '');
                                        
                                        return !inline && match ? (
                                            <CodeBlock 
                                                code={codeString} 
                                                language={match[1]} 
                                                {...props} 
                                            />
                                        ) : (
                                            <code className={`${className} bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded text-sm text-zinc-600 dark:text-zinc-300 font-mono`} {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    p: ({children}) => <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed mb-6 last:mb-0">{children}</p>,
                                    ul: ({children}) => <ul className="list-disc pl-5 space-y-3 mb-6 last:mb-0">{children}</ul>,
                                    li: ({children}) => <li className="text-zinc-800 dark:text-zinc-300 leading-relaxed pl-1">{children}</li>,
                                    h1: ({children}) => <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mt-10 mb-6 tracking-tight">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mt-8 mb-4 tracking-tight">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white mt-6 mb-3 tracking-tight">{children}</h3>,
                                    table: ({children}) => (
                                        <div className="w-full overflow-x-auto my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 custom-scrollbar">
                                            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[360px]">
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    th: ({children}) => (
                                        <th className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 font-bold text-xs text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700">
                                            {children}
                                        </th>
                                    ),
                                    td: ({children}) => (
                                        <td className="px-3.5 py-2 text-xs border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-300">
                                            {children}
                                        </td>
                                    ),
                                }}
                            >
                                {contentToRender}
                            </ReactMarkdown>
                        </div>
                    )}
                    {msg.content && (
                        <div className="flex items-center gap-3.5 sm:gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-900/50 opacity-60 hover:opacity-100 transition-opacity">
                            {/* Copy Message */}
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                                title="Copy response text"
                            >
                                {copied ? (
                                    <>
                                        <span className="text-[11px] font-bold text-emerald-500">Copied!</span>
                                        <RiCheckLine size={16} className="text-emerald-500" />
                                    </>
                                ) : (
                                    <RiFileCopyLine size={16} />
                                )}
                            </button>

                            {/* Speaker / Read Aloud Button */}
                            <button
                                onClick={handleToggleSpeech}
                                className={`flex items-center gap-1 p-1 rounded-md transition-all cursor-pointer ${
                                    isSpeaking 
                                        ? 'text-[#20b8cd] bg-[#20b8cd]/15 ring-1 ring-[#20b8cd]/30 scale-105' 
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                                }`}
                                title={isSpeaking ? "Stop Speaking" : "Read Aloud (Voice Output)"}
                            >
                                {isSpeaking ? (
                                    <>
                                        <RiVolumeUpFill size={16} className="text-[#20b8cd] animate-pulse" />
                                        <span className="text-[11px] font-bold text-[#20b8cd] hidden xs:inline">Speaking</span>
                                    </>
                                ) : (
                                    <RiVolumeUpLine size={16} />
                                )}
                            </button>

                            <div className="flex-1" />

                            {/* Like / Good Response Button */}
                            <button 
                                onClick={() => handleFeedback('like')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    feedback === 'like'
                                        ? 'text-[#20b8cd] bg-[#20b8cd]/15 ring-1 ring-[#20b8cd]/40 scale-110 shadow-xs'
                                        : 'text-zinc-400 dark:text-zinc-500 hover:text-[#20b8cd] hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                                title={feedback === 'like' ? "Remove Like" : "Good response (AI will learn your preference)"}
                            >
                                {feedback === 'like' ? (
                                    <RiThumbUpFill size={16} className="text-[#20b8cd]" />
                                ) : (
                                    <RiThumbUpLine size={16} />
                                )}
                            </button>

                            {/* Dislike / Bad Response Button */}
                            <button 
                                onClick={() => handleFeedback('dislike')}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    feedback === 'dislike'
                                        ? 'text-rose-500 bg-rose-500/15 ring-1 ring-rose-500/40 scale-110 shadow-xs'
                                        : 'text-zinc-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                }`}
                                title={feedback === 'dislike' ? "Remove Dislike" : "Bad response (AI will improve next time)"}
                            >
                                {feedback === 'dislike' ? (
                                    <RiThumbDownFill size={16} className="text-rose-500" />
                                ) : (
                                    <RiThumbDownLine size={16} />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
