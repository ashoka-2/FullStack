import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RiArrowRightLine,
  RiRobot2Line,
  RiAddLine,
  RiArrowDownSLine,
  RiMicLine,
  RiMicFill,
  RiFileList3Line,
  RiBookOpenLine,
  RiBriefcaseLine,
  RiHeart2Line,
  RiUploadCloudLine,
  RiCloseLine,
  RiFileTextLine,
  RiAttachment2,
  RiArrowUpLine,
  RiCompass3Line,
  RiGlobalLine,
  RiMagicLine,
  RiInstagramLine,
  RiMailSendLine,
  RiImageLine,
  RiVideoLine,
  RiFilePdfLine,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiCodeSSlashLine
} from '@remixicon/react';
import { useChat } from '../hook/useChat';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import Footer from '../../Components/Footer';
import { setError, setMessages } from '../chat.slice';
import { addToast } from '../../../utils/toast.slice';
import ParsuLogo from '../../Components/ParsuLogo';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import ModelSelectorDropdown from './ModelSelectorDropdown';
import AttachmentPreviewStrip from './AttachmentPreviewStrip';
import AddToChatSheet from './AddToChatSheet';
import MatrixOrb from '../../Components/rare-ui/MatrixOrb';
import { triggerBlobInteraction, triggerBlobTyping } from '../../../utils/blobReactions';

const ChatArea = () => {
  // Input message state
  const [input, setInput] = useState('');
  
  // Attached files and media items
  const [files, setFiles] = useState([]);
  
  // Drag and drop UI state
  const [isDragging, setIsDragging] = useState(false);

  // Selected AI Model
  const [selectedModel, setSelectedModel] = useState(null);
  
  // Chat custom hook functions
  const { handleSendMessage, handleGetSuggestions, loading } = useChat();
  
  // Global error state from Redux
  const error = useSelector(state => state.chat.error);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // JellyBlob mascot reactive states
  const [blobMood, setBlobMood] = useState('curious');
  const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const typingTimerRef = useRef(null);

  // Textarea resizing & code formatting state
  const textareaRef = useRef(null);
  const [isFullScreenEditor, setIsFullScreenEditor] = useState(false);

  // Detect whether pasted or typed content is code
  const isCodeContent = Boolean(
    input && (
      input.includes('```') ||
      (input.includes('\n') && (
        /^(import|export|const|let|var|function|class|def|public|private|protected|interface|type|return|<[a-zA-Z]+|\/\/|\/\*|#include|package|func|select|from|where)\b/im.test(input) ||
        /[{}();=>\[\]]/.test(input)
      ))
    )
  );

  // Auto-grow textarea naturally based on input text content
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    const scrollH = textareaRef.current.scrollHeight;
    const nextH = Math.min(Math.max(scrollH, 54), 280);
    textareaRef.current.style.height = `${nextH}px`;
  }, [input]);

  // Speech Recognition (Voice to Text) state & Live Caption
  const [isListening, setIsListening] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');
  const recognitionRef = useRef(null);

  const handleToggleVoiceInput = () => {
    if (!user) {
      setBlobMood('surprised');
      navigate('/login');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatch(addToast({
        type: 'warning',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.'
      }));
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setLiveCaption('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setLiveCaption('Listening to your speech... Speak now 🎙️');
        triggerBlobInteraction('curious');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }
        const fullLive = (finalTranscript + currentInterim).trim();
        if (fullLive) {
          setLiveCaption(fullLive);
        }
        if (finalTranscript.trim()) {
          setInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
          triggerTyping();
          triggerBlobTyping();
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          dispatch(addToast({
            type: 'error',
            message: `Mic error: ${event.error || 'Check microphone permissions'}`
          }));
        }
        setIsListening(false);
        setLiveCaption('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setLiveCaption('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setLiveCaption('');
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const triggerTyping = () => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);
  };
  
  // Naye AI suggestions (pills, queries, topics) store karne ke liye
  const [aiSuggestions, setAiSuggestions] = useState(null);
  
  // Initial suggestions laate waqt skeleton dikhane ke liye loading flag
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // File input refs for photo, video, camera and documents
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  // Web Search toggle (Tavily search vs pure AI)
  const [webSearch, setWebSearch] = useState(() => {
    const saved = localStorage.getItem("parsu_web_search") ?? localStorage.getItem("perplexity_web_search");
    return saved !== null ? saved === "true" : true; // Default ON
  });

  const handleToggleWebSearch = () => {
    setWebSearch(prev => {
      const next = !prev;
      localStorage.setItem("parsu_web_search", String(next));
      return next;
    });
  };

  // Cross-Chat Memory toggle (read & recall across other chats)
  const [memoryEnabled, setMemoryEnabled] = useState(() => {
    const saved = localStorage.getItem("parsu_memory_enabled") ?? localStorage.getItem("perplexity_memory_enabled");
    return saved !== null ? saved === "true" : true; // Default ON
  });

  const handleToggleMemory = () => {
    setMemoryEnabled(prev => {
      const next = !prev;
      localStorage.setItem("parsu_memory_enabled", String(next));
      return next;
    });
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...uploadedFiles.map(f => ({ name: f.name, isLink: false, fileObject: f }))]);
    setIsUploadMenuOpen(false);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.isLink) return <RiAttachment2 size={13} className="text-[var(--color-clear-hanada)]" />;
    const name = file.name?.toLowerCase() || '';
    if (name.match(/\.(mp4|webm|mov|avi|mkv)$/)) return <RiVideoLine size={13} className="text-purple-400" />;
    if (name.match(/\.(pdf)$/)) return <RiFilePdfLine size={13} className="text-red-400" />;
    if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return <RiImageLine size={13} className="text-emerald-400" />;
    return <RiFileTextLine size={13} className="text-[var(--color-clear-hanada)]" />;
  };

  // Fetch default suggestions from backend when component mounts
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      const data = await handleGetSuggestions();
      if (data) setAiSuggestions(data); // Update state if data is received
      setSuggestionsLoading(false);
    };
    fetchSuggestions();
  }, []);

  // Icon dictionary to map backend string to proper icon component
  const iconMap = {
    global: RiGlobalLine,
    robot: RiRobot2Line,
    file: RiFileList3Line,
    magic: RiMagicLine,
    compass: RiCompass3Line,
    book: RiBookOpenLine,
    heart: RiHeart2Line
  };

  // Dynamic array of extra AI capabilities
  // For future extensibility without changing UI code
  const capabilities = [
    {
       title: "Post to Instagram",
       description: "Instantly create and publish image posts directly to your Instagram account.",
       icon: RiInstagramLine,
       colorClass: "text-[#E1306C]",
       bgHover: "hover:bg-[#E1306C]/10 hover:border-[#E1306C]/30"
    },
    {
       title: "Send Emails",
       description: "Draft and send professional emails straight from the chat interface.",
       icon: RiMailSendLine,
       colorClass: "text-[#EA4335]",
       bgHover: "hover:bg-[#EA4335]/10 hover:border-[#EA4335]/30"
    }
  ];

  // Global auth state
  const user = useSelector(state => state.auth.user);

  // Handle message submission on Enter, send button, or suggestion click
  const onSubmit = async (e, text = null) => {
    if (e) e.preventDefault();

    // Guest protection: Redirect unauthenticated users to login immediately
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Use passed text (suggestion click) or input box text
    const messageToSend = text || input;
    
    // Extract all attached file objects (supports up to 10 files)
    const fileObjects = files.map(f => f.fileObject).filter(Boolean);
    const filesToSend = fileObjects.length > 1 ? fileObjects : (fileObjects[0] || null); 
    
    // Do not send if neither text nor file is present, or if already loading
    if ((!messageToSend.trim() && !filesToSend) || loading) return;

    try {
      // Clear input box immediately
      setInput('');
      setFiles([]);
      
      // Clear previous stored messages
      dispatch(setMessages([]));
      
      // Dispatch Blake Bowen organic SVG liquid page transition
      window.dispatchEvent(new CustomEvent('trigger_liquid_transition', {
        detail: {
          onNavigate: () => {
            // Optimistic Routing: Navigate when screen is enveloped by the organic wave
            navigate('/chat/new');
          }
        }
      }));
      
      // Asynchronously handle message sending with selected model, webSearch, and cross-chat memory
      handleSendMessage(messageToSend, null, filesToSend, selectedModel, webSearch, memoryEnabled).then(response => {
        // Silently update URL once real chat ID is received
        if (response && response.chat) {
          navigate(`/chat/${response.chat._id}`, { replace: true });
        }
      }).catch(err => {
          console.error("Message send failed:", err);
      });
      
    } catch (error) {
      console.error("Message send failed:", error); // Dev logging
    }
  };

  // Function to handle keyboard events (Enter to send, Tab to indent code)
  const handleKeyDown = (e) => {
    // Indent code or text with Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setInput(newValue);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      });
      return;
    }

    if (e.key === 'Enter') {
      // Treat shift/ctrl/meta + enter as newline
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }
      e.preventDefault(); // Prevent default line skip

      if (!user) {
        navigate('/login');
        return;
      }

      onSubmit(e); // Message bhejna start
    }
  };

  // Drag start (jab screen par file laaye)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true); // Overlay UI dikhaye
  };

  // Jab file screen se hata di bina drop kare
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // File chhorne par drop handle karna
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false); // Drop ho gaya UI wapas normal kardo
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Drop ki gyi files state me save kar lo
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles.map(f => ({ name: f.name, isLink: false, fileObject: f }))]);
    }
  };

  return (
    <main data-lenis-prevent className="flex-1 w-full flex flex-col items-center bg-[var(--bg-primary)] relative overflow-x-hidden overflow-y-auto custom-scrollbar pb-80 md:pb-32"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6">
          <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 border-2 border-dashed border-[var(--color-clear-hanada)] rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 shadow-2xl">
            <RiUploadCloudLine size={64} className="text-[var(--color-clear-hanada)] animate-bounce" />
            <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-wider">Drop to upload</h2>
          </div>
        </div>
      )}

      <div className="w-full max-w-fluid flex flex-col items-center relative z-10 px-4 md:px-0 pt-6 sm:pt-10 md:pt-12">
        
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-4 opacity-90 hover:opacity-100 transition-opacity">
          <ParsuLogo className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--accent-cyan)] shrink-0" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Parsu <span className="text-[var(--accent-cyan)]">AI</span>
          </span>
        </div>

        {/* HeroUI Pro AI Showcase Header & Suggestions Grid */}
        <div className="w-full max-w-[800px] mx-auto text-left mb-6 px-1 sm:px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
            What do you want to work on?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-normal">
            Ask a question or start from one of the suggestions below. Powered by Parsu AI autonomous intelligence.
          </p>

          {/* 6 Suggestion Cards (2 cols x 3 rows) matching HeroUI Pro showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              "Summarize this week's product and design updates into a team-ready status note.",
              "Turn a rough product brief into a launch checklist with owners and deadlines.",
              "Rewrite this paragraph for a skeptical executive who cares about ROI.",
              "Brainstorm onboarding flow names for a data-heavy analytics product.",
              "Draft a weekly 1:1 agenda that surfaces blockers and growth goals.",
              "Compare three pricing models and recommend one for a usage-based SaaS."
            ].map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  if (!user) {
                    setBlobMood('surprised');
                    navigate('/login');
                    return;
                  }
                  setInput(promptText);
                  onSubmit(e, promptText);
                }}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[var(--bg-surface)]/90 border border-zinc-200/90 dark:border-white/10 hover:border-[var(--accent-cyan)]/60 hover:bg-zinc-50/80 dark:hover:bg-white/[0.04] text-left text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed transition-all shadow-xs cursor-pointer group active:scale-[0.99]"
              >
                <p className="group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                  {promptText}
                </p>
              </button>
            ))}
          </div>

          {/* Rare UI MatrixOrb when AI is thinking & formulating response */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-6 my-2 bg-zinc-100/60 dark:bg-white/[0.03] border border-cyan-500/20 rounded-3xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
              <MatrixOrb size={100} state="thinking" color="#20b8cd" dots={12} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">
                  Parsu AI is thinking & reasoning...
                </span>
                <span className="text-[11px] text-zinc-500 font-medium animate-pulse">
                  Querying models, searching web, and formulating optimal response
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search Input Box */}
        <div className="w-full md:relative md:block fixed bottom-0 left-0 right-0 z-50 p-2.5 pb-5 sm:p-4 sm:pb-8 md:p-0 bg-gradient-to-t from-[#f4f5f7] dark:from-[#050505] via-[#f4f5f7]/95 dark:via-[#050505]/95 md:bg-transparent md:dark:bg-transparent to-transparent backdrop-blur-[2px] md:backdrop-blur-0">
          <div className={`w-full max-w-[800px] mx-auto bg-white dark:bg-[var(--bg-surface)] border ${isDragging ? 'border-[var(--color-clear-hanada)]' : 'border-zinc-200/90 dark:border-[#2d2e2e]'} focus-within:border-[var(--color-clear-hanada)]/60 dark:focus-within:border-[var(--color-clear-hanada)]/60 focus-within:ring-2 focus-within:ring-[#60A6AF]/20 rounded-[22px] sm:rounded-[28px] px-3.5 sm:px-6 py-3 sm:py-5 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]`}>

            {/* Rich Attachment Preview Strip */}
            <AttachmentPreviewStrip files={files} onRemove={removeFile} />

            {/* Live Voice Captioning Stream */}
            {isListening && (
              <div className="flex items-center gap-3 px-3.5 py-2 mb-2 rounded-xl bg-zinc-900/95 dark:bg-[#18181b]/95 border border-[var(--accent-cyan)]/40 text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-1 h-3 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:300ms]" />
                  <span className="w-1 h-4 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:450ms]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="text-[10px] font-bold text-[var(--color-sky-haze)] uppercase tracking-wider">Live Speech Caption</span>
                  </div>
                  <p className="text-[13px] text-zinc-100 font-medium truncate italic mt-0.5">
                    {liveCaption || 'Listening to your voice... Speak now'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer shrink-0"
                >
                  Done
                </button>
              </div>
            )}

            {/* Multi-line or Code Information & Quick Fullscreen Header */}
            {(isCodeContent || (input && input.split('\n').length > 2)) && (
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 select-none animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  {isCodeContent && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-clear-hanada)]/15 text-[var(--color-deep-hanada)] dark:text-[var(--color-sky-haze)] border border-[var(--color-clear-hanada)]/25">
                      <RiCodeSSlashLine size={12} />
                      Code format preserved
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {input.split('\n').length} lines • {input.length} characters
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullScreenEditor(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-clear-hanada)] hover:text-[var(--color-deep-hanada)] dark:hover:text-[var(--color-sky-haze)] transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  title="Open full-screen prompt and code editor"
                >
                  <RiFullscreenLine size={13} />
                  <span>Full screen</span>
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows="1"
              value={input}
              onChange={(e) => {
                if (!user) {
                  setBlobMood('surprised');
                  navigate('/login');
                  return;
                }
                setInput(e.target.value);
                triggerTyping();
                triggerBlobTyping();
              }}
              onMouseEnter={() => {
                triggerBlobInteraction('hover');
              }}
              onFocus={() => {
                if (!user) {
                  setBlobMood('surprised');
                  navigate('/login');
                  return;
                }
                setBlobMood('curious');
                setBlobGaze({ x: 0, y: 16 });
                triggerBlobInteraction('focus');
              }}
              onBlur={() => {
                if (!loading) {
                  setBlobMood('neutral');
                  setBlobGaze({ x: 0, y: 0 });
                }
              }}
              onClick={() => {
                if (!user) {
                  setBlobMood('surprised');
                  navigate('/login');
                  return;
                }
                triggerBlobInteraction('click');
              }}
              onKeyDown={handleKeyDown}
              spellCheck={!isCodeContent}
              style={{
                whiteSpace: 'pre-wrap',
                tabSize: 2,
                MozTabSize: 2
              }}
              placeholder={user ? "Ask anything or paste code..." : "Click or sign in to start a new chat..."}
              className={`w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 custom-scrollbar transition-all resize-none ${
                isCodeContent 
                  ? 'font-mono text-[14px] md:text-[15px] leading-relaxed' 
                  : 'font-sans font-medium text-[17px] md:text-[18px] leading-snug md:leading-relaxed'
              } min-h-[50px] max-h-[280px] cursor-text`}
            />

            <div className="flex items-center justify-between mt-3 sm:mt-4 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                {/* Apple-style Circular Attach Button (+ icon only) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                        return;
                      }
                      setIsUploadMenuOpen(true);
                    }}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer shrink-0"
                    title="Add to chat (Photos, Videos, Files, Memory)"
                    aria-label="Add to chat"
                  >
                    <RiAddLine size={18} className="shrink-0" />
                  </button>

                  {/* Premium 'Add to chat' Mobile Bottom Sheet & Desktop Modal */}
                  <AddToChatSheet
                    isOpen={isUploadMenuOpen}
                    onClose={() => setIsUploadMenuOpen(false)}
                    onPickCamera={() => cameraInputRef.current?.click()}
                    onPickPhotos={() => fileInputRef.current?.click()}
                    onPickVideos={() => videoInputRef.current?.click()}
                    onPickFiles={() => docInputRef.current?.click()}
                    webSearch={webSearch}
                    onToggleWebSearch={handleToggleWebSearch}
                    memoryEnabled={memoryEnabled}
                    onToggleMemory={handleToggleMemory}
                  />
                </div>

                {/* Web Search Toggle Pill Button (Desktop only on input bar; accessible in sheet on mobile) */}
                <button
                  type="button"
                  onClick={handleToggleWebSearch}
                  className={`hidden sm:flex h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-full border items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                    webSearch 
                      ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)]/40 text-[var(--color-deep-hanada)] dark:text-[var(--color-sky-haze)] shadow-[0_0_12px_rgba(32,184,205,0.2)]' 
                      : 'bg-zinc-100/90 dark:bg-white/[0.06] border-zinc-300 dark:border-white/15 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title={webSearch ? "Web Search: ON (Using Tavily for live internet facts)" : "Web Search: OFF (Pure AI model knowledge)"}
                >
                  <RiGlobalLine size={14} className={webSearch ? "text-[var(--accent-cyan)]" : "text-zinc-400 dark:text-zinc-500"} />
                  <span className="text-[11px] sm:text-xs">Web</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[var(--accent-cyan)] animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                </button>

                <ModelSelectorDropdown
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />

                {/* Hidden inputs */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
                <input type="file" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" capture="environment" />
                <input type="file" ref={videoInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" multiple />
                <input type="file" ref={docInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md,.doc,.docx" multiple />
              </div>

              <div className="flex items-center gap-2">
                {/* Full-Screen Prompt Editor Button if text or code is long */}
                {(input.length > 50 || input.includes('\n')) && (
                  <button
                    type="button"
                    onClick={() => setIsFullScreenEditor(true)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                    title="Open full-screen prompt and code studio"
                  >
                    <RiFullscreenLine size={18} />
                  </button>
                )}

                <button 
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    isListening 
                      ? 'text-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/30' 
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Voice input (Speech to text)"}
                >
                  {isListening ? <RiMicFill size={18} className="text-rose-500" /> : <RiMicLine size={18} />}
                </button>

                <button
                  onClick={(e) => {
                    if (!user) {
                      setBlobMood('surprised');
                      navigate('/login');
                      return;
                    }
                    setBlobMood('hmm');
                    onSubmit(e);
                  }}
                  onMouseEnter={() => {
                    if (!user || input.trim() || files.length > 0) {
                      setBlobMood('happy');
                    }
                  }}
                  onMouseLeave={() => {
                    if (!loading) {
                      setBlobMood(input.trim() ? 'curious' : 'neutral');
                    }
                  }}
                  disabled={user && (!input.trim() && files.length === 0)}
                  className={`w-8.5 h-8.5 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                    !user || input.trim() || files.length > 0 
                      ? 'bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 shadow-md shadow-[var(--accent-cyan)]/25 hover:scale-105 active:scale-95' 
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50'
                  }`}
                  title="Send message"
                >
                  <RiArrowUpLine size={19} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
              Parsu AI can make mistakes. Check important info.
            </p>
          </div>
        </div>

        {/* Guest prompt indicator */}
        {!user && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 text-xs text-zinc-500 animate-in fade-in duration-500">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
            <span>Sign in to save chat history, analyze files, and publish to social networks.</span>
          </div>
        )}

        {/* Suggested Queries List */}
        <div className="w-full max-w-[800px] mt-10 space-y-4">
          {suggestionsLoading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-full h-8 bg-zinc-900/50 rounded-lg animate-pulse" />
            ))
          ) : (
            (aiSuggestions?.queries || [
              'Show me latest Flipkart deals',
              'Find online courses to master digital art',
              'Recommend Bollywood movies for a long flight',
              'Show me best practices for CSS Grid and Flexbox',
              'Compare CSS flexbox vs grid layouts'
            ]).map((query, i) => (
              <button 
                key={i} 
                onClick={(e) => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  onSubmit(e, query);
                }}
                className="w-full text-left px-4 py-2.5 text-[14px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border-b border-zinc-100 dark:border-zinc-900/50 block font-medium break-words whitespace-normal cursor-pointer"
              >
                {query}
              </button>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 w-full max-w-[800px] mb-20 px-1">
          {suggestionsLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-[120px] bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />
            ))
          ) : (
            (aiSuggestions?.topics || [
              { label: 'Advancements in Fusion Energy', desc: 'Science · 4h ago', iconType: 'global' },
              { label: 'Build AI agents with Node.js', desc: 'Tutorial · Today', iconType: 'robot' },
              { label: 'Deep dive into tech layoffs', desc: 'Business · 1d ago', iconType: 'file' },
              { label: 'The 3-body problem explained', desc: 'Physics · 6h ago', iconType: 'magic' }
            ]).map((topic, i) => {
              const Icon = iconMap[topic.iconType] || RiMagicLine;
              return (
                <button 
                    key={i} 
                    onClick={(e) => {
                      if (!user) {
                        navigate('/login');
                        return;
                      }
                      onSubmit(e, topic.label);
                    }}
                    className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-all text-left group shadow-sm dark:shadow-none cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 transition-colors">
                      <Icon className="text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-400" size={18} />
                    </div>
                    <RiArrowRightLine size={14} className="text-zinc-300 dark:text-zinc-800 group-hover:text-zinc-600 dark:group-hover:text-zinc-500 mr-1 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors leading-[1.4] break-words line-clamp-2">
                      {topic.label}
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 font-bold uppercase tracking-tight transition-colors">{topic.desc}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
        
        {/* Dynamic AI Capabilities Showcase */}
        {/* Is component block se humne Instagram aur Email jaise specific integrations ko darshaya hai. Ye generic hai. */}
        <div className="w-full max-w-[800px] mt-6 mb-20 px-1">
          <div className="mb-4">
             <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest pl-1">Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capabilities.map((cap, i) => {
               const Icon = cap.icon;
               return (
                 <div key={i} className={`flex flex-col gap-2 p-4 bg-white dark:bg-[var(--bg-surface)]/50 border border-zinc-200/90 dark:border-white/5 rounded-2xl transition-all cursor-default shadow-2xs ${cap.bgHover}`}>
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-xs ${cap.colorClass}`}>
                        <Icon size={16} />
                     </div>
                     <span className="text-[14px] font-extrabold text-zinc-800 dark:text-zinc-200">{cap.title}</span>
                   </div>
                   <p className="text-[12px] text-zinc-500 font-medium leading-[1.5] mt-1 pr-4">
                     {cap.description}
                   </p>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="w-full max-w-[800px] mt-12 mb-8 px-1">
          <Footer />
        </div>

        {/* Mobile Spacer to prevent overlap with fixed search bar */}
        <div className="h-40 md:hidden" />
      </div>

      {/* Full-Screen Prompt & Code Editor Studio via React Portal */}
      {isFullScreenEditor && typeof document !== 'undefined' && createPortal(
        <div 
          data-lenis-prevent="true"
          className="fixed inset-0 lg:left-56 z-[9980] bg-[#0c0d10] text-zinc-100 flex flex-col pointer-events-auto select-auto animate-in fade-in zoom-in-95 duration-200 border-l border-zinc-800/80 shadow-2xl"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Studio Header */}
          <div className="h-14 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#111216] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                {isCodeContent ? <RiCodeSSlashLine size={18} /> : <RiFileTextLine size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Full-Screen Prompt Studio</h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {input.split('\n').length} lines • {input.length} characters {isCodeContent ? '• Code format preserved' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput('');
                    dispatch(addToast({ message: "Prompt cleared", type: "info" }));
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(input);
                  dispatch(addToast({ message: "Prompt copied to clipboard!", type: "info" }));
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setIsFullScreenEditor(false)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                title="Exit full-screen mode"
              >
                <RiFullscreenExitLine size={16} />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Textarea Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col min-h-0 bg-[#0c0d10]">
            <textarea
              autoFocus
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                triggerTyping();
                triggerBlobTyping();
              }}
              onKeyDown={handleKeyDown}
              spellCheck={!isCodeContent}
              style={{ whiteSpace: 'pre-wrap', tabSize: 2, MozTabSize: 2 }}
              placeholder="Type or paste your prompt, code or instructions..."
              className="w-full flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm sm:text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 custom-scrollbar p-2"
            />
          </div>

          {/* Live Voice Captioning Stream in Studio */}
          {isListening && (
            <div className="mx-4 sm:mx-6 mb-2 px-3.5 py-2 rounded-xl bg-zinc-900/95 border border-[var(--accent-cyan)]/40 text-white shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-1 h-3 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:300ms]" />
                <span className="w-1 h-4 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-delay:450ms]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[var(--color-sky-haze)] uppercase tracking-wider block">Live Voice Caption</span>
                <p className="text-[13px] text-zinc-100 font-medium truncate italic mt-0.5">
                  {liveCaption || 'Listening to your voice... Speak now'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer shrink-0"
              >
                Done
              </button>
            </div>
          )}

          {/* Rich Bottom Toolbar Options (Attach, Web Search, Models, Mic, Send) */}
          <div className="border-t border-zinc-800/80 bg-[#111216] px-4 sm:px-6 py-3 shrink-0 flex flex-col gap-2.5">
            {/* Attachments Preview Strip */}
            <AttachmentPreviewStrip files={files} onRemove={removeFile} />

            <div className="flex items-center justify-between gap-2">
              {/* Left Side Actions */}
              <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                {/* Attach Button */}
                <button
                  type="button"
                  onClick={() => setIsUploadMenuOpen(true)}
                  className="w-8.5 h-8.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                  title="Add to chat (Photos, Videos, Files, Memory)"
                  aria-label="Add to chat"
                >
                  <RiAddLine size={18} className="shrink-0" />
                </button>

                {/* Web Search Toggle */}
                <button
                  type="button"
                  onClick={handleToggleWebSearch}
                  className={`h-8.5 px-3 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                    webSearch 
                      ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)]/40 text-[var(--color-sky-haze)] shadow-[0_0_12px_rgba(32,184,205,0.2)]' 
                      : 'bg-white/[0.06] border-white/15 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={webSearch ? "Web Search: ON (Using Tavily for live internet facts)" : "Web Search: OFF (Pure AI model knowledge)"}
                >
                  <RiGlobalLine size={14} className={webSearch ? "text-[var(--accent-cyan)]" : "text-zinc-400"} />
                  <span className="text-xs">Web</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[var(--accent-cyan)] animate-pulse' : 'bg-zinc-600'}`} />
                </button>

                {/* Model Selector */}
                <ModelSelectorDropdown
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  compact={true}
                  placement="top"
                />
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isListening 
                      ? 'text-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/30' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Voice input (Speech to text)"}
                >
                  {isListening ? <RiMicFill size={19} className="text-rose-500" /> : <RiMicLine size={19} />}
                </button>

                {/* Send Prompt Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    setIsFullScreenEditor(false);
                    onSubmit(e);
                  }}
                  disabled={!input.trim() && files.length === 0}
                  className={`px-4 py-2 h-9 flex items-center justify-center rounded-full transition-all gap-1.5 text-xs font-bold ${
                    input.trim() || files.length > 0 
                      ? 'bg-white text-black hover:bg-zinc-200 shadow-lg hover:scale-105 cursor-pointer' 
                      : 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
                  }`}
                  title="Send prompt"
                >
                  <span>Send</span>
                  <RiArrowUpLine size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
};

export default ChatArea;
