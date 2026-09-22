import React, { useState, useRef, useEffect } from 'react';
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
  RiExpandUpDownLine,
  RiContractUpDownLine,
  RiCodeSSlashLine,
  RiCameraLine
} from '@remixicon/react';
import { useChat } from '../hook/useChat';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import Footer from '../../Components/Footer';
import { setError, setMessages } from '../chat.slice';
import { addToast } from '../../../utils/toast.slice';
import PerplexityIcon from '../../Components/PerplexityIcon';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import ModelSelectorDropdown from './ModelSelectorDropdown';
import AttachmentPreviewStrip from './AttachmentPreviewStrip';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Auto-grow textarea with content up to maximum threshold or expanded height
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    const targetMin = isExpanded ? 240 : 56;
    const targetMax = isExpanded ? 520 : 260;
    const scrollH = textareaRef.current.scrollHeight;
    const nextH = Math.min(Math.max(scrollH, targetMin), targetMax);
    textareaRef.current.style.height = `${nextH}px`;
  }, [input, isExpanded]);

  // Speech Recognition (Voice to Text) state
  const [isListening, setIsListening] = useState(false);
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
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        triggerBlobInteraction('curious');
        dispatch(addToast({
          type: 'info',
          message: 'Listening... Speak your prompt 🎙️'
        }));
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
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
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
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
    const saved = localStorage.getItem("perplexity_web_search");
    return saved !== null ? saved === "true" : true; // Default ON
  });

  const handleToggleWebSearch = () => {
    setWebSearch(prev => {
      const next = !prev;
      localStorage.setItem("perplexity_web_search", String(next));
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
    if (file.isLink) return <RiAttachment2 size={13} className="text-[#60A6AF]" />;
    const name = file.name?.toLowerCase() || '';
    if (name.match(/\.(mp4|webm|mov|avi|mkv)$/)) return <RiVideoLine size={13} className="text-purple-400" />;
    if (name.match(/\.(pdf)$/)) return <RiFilePdfLine size={13} className="text-red-400" />;
    if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return <RiImageLine size={13} className="text-emerald-400" />;
    return <RiFileTextLine size={13} className="text-[#60A6AF]" />;
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
      
      // Optimistic Routing: Navigate immediately to new chat screen
      navigate('/chat/new');
      
      // Asynchronously handle message sending with selected model and webSearch flag
      handleSendMessage(messageToSend, null, filesToSend, selectedModel, webSearch).then(response => {
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
    <main data-lenis-prevent className="flex-1 w-full flex flex-col items-center bg-[#f4f5f7] dark:bg-[#050505] relative overflow-x-hidden overflow-y-auto custom-scrollbar pb-80 md:pb-32"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6">
          <div className="bg-white/80 dark:bg-[#121212]/80 border-2 border-dashed border-[#60A6AF] rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 shadow-2xl">
            <RiUploadCloudLine size={64} className="text-[#60A6AF] animate-bounce" />
            <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-wider">Drop to upload</h2>
          </div>
        </div>
      )}

      <div className="w-full max-w-fluid flex flex-col items-center relative z-10 px-4 md:px-0 pt-8 sm:pt-12 md:pt-[15vh]">
        <h1 className="text-3xl sm:text-5xl md:text-[5.5rem] font-extralight text-zinc-900 dark:text-white tracking-tighter mb-6 md:mb-12 text-center opacity-90 transition-opacity hover:opacity-100 flex items-center justify-center gap-2 sm:gap-3">
         <PerplexityIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0" /> <span>Perplexity</span>
        </h1>

        {/* Assistant Suggestions Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 mb-6 md:mb-8 px-2 max-w-[800px] mx-auto w-full overflow-x-auto sm:overflow-visible no-scrollbar pb-1">
          {suggestionsLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-24 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            ))
          ) : (
              (aiSuggestions?.pills || ['For you', 'Study guide', 'Business', 'Health']).map((pillLabel, i) => {
              const Icon = iconMap[aiSuggestions?.topics?.[i]?.iconType] || RiCompass3Line;
              return (
                <button 
                  key={i} 
                  onClick={(e) => {
                    if (!user) {
                      setBlobMood('surprised');
                      navigate('/login');
                      return;
                    }
                    setBlobMood('hmm');
                    onSubmit(e, pillLabel);
                  }}
                  onMouseEnter={() => {
                    setBlobMood('happy');
                    setBlobGaze({ x: (i - 1.5) * 6, y: 12 });
                  }}
                  onMouseLeave={() => {
                    if (!loading) {
                      setBlobMood('neutral');
                      setBlobGaze({ x: 0, y: 0 });
                    }
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-transparent border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-500 text-xs sm:text-[13px] font-medium transition-all group cursor-pointer whitespace-nowrap"
                >
                  <Icon size={14} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300" />
                  <span>{pillLabel}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Search Input Box */}
        <div className="w-full md:relative md:block fixed bottom-0 left-0 right-0 z-50 p-2.5 pb-5 sm:p-4 sm:pb-8 md:p-0 bg-gradient-to-t from-[#f4f5f7] dark:from-[#050505] via-[#f4f5f7]/95 dark:via-[#050505]/95 md:bg-transparent md:dark:bg-transparent to-transparent backdrop-blur-[2px] md:backdrop-blur-0">
          <div className={`w-full max-w-[800px] mx-auto bg-white dark:bg-[#121212] border ${isDragging ? 'border-[#60A6AF]' : 'border-zinc-200/90 dark:border-[#2d2e2e]'} focus-within:border-[#60A6AF]/60 dark:focus-within:border-[#60A6AF]/60 focus-within:ring-2 focus-within:ring-[#60A6AF]/20 rounded-[22px] sm:rounded-[28px] px-3.5 sm:px-6 py-3 sm:py-5 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]`}>

            {/* Rich Attachment Preview Strip */}
            <AttachmentPreviewStrip files={files} onRemove={removeFile} />

            {/* Multi-line or Code Information & Quick Expand Header */}
            {(isCodeContent || (input && input.split('\n').length > 2)) && (
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 select-none animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  {isCodeContent && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#60A6AF]/15 text-[#296f79] dark:text-[#7fd4df] border border-[#60A6AF]/25">
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
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#60A6AF] hover:text-[#418690] dark:hover:text-[#90e2ee] transition-colors cursor-pointer"
                  title={isExpanded ? "Collapse input size" : "Expand input size to see and edit full prompt"}
                >
                  {isExpanded ? (
                    <>
                      <RiContractUpDownLine size={13} />
                      <span>Collapse size</span>
                    </>
                  ) : (
                    <>
                      <RiExpandUpDownLine size={13} />
                      <span>Expand size</span>
                    </>
                  )}
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
              className={`w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 custom-scrollbar transition-all resize-y ${
                isCodeContent 
                  ? 'font-mono text-[14px] md:text-[15px] leading-relaxed' 
                  : 'font-sans font-medium text-[17px] md:text-[18px] leading-snug md:leading-relaxed'
              } ${
                isExpanded ? 'min-h-[240px] md:min-h-[300px] max-h-[75vh]' : 'min-h-[44px] md:min-h-[58px] max-h-[260px]'
              } cursor-text`}
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
                      setIsUploadMenuOpen(!isUploadMenuOpen);
                    }}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer shrink-0"
                    title="Attach files (Photos, Videos, Documents)"
                    aria-label="Attach files"
                  >
                    <RiAddLine size={18} className="shrink-0" />
                  </button>

                  {isUploadMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-56 bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                      {/* Upload Photo */}
                      <button 
                        onClick={() => { fileInputRef.current?.click(); setIsUploadMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold transition-all group cursor-pointer"
                      >
                        <RiImageLine size={18} className="text-emerald-400 group-hover:text-emerald-300" />
                        <span>Upload Photo</span>
                      </button>
                      {/* Upload Video */}
                      <button 
                        onClick={() => { videoInputRef.current?.click(); setIsUploadMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold transition-all group cursor-pointer"
                      >
                        <RiVideoLine size={18} className="text-purple-400 group-hover:text-purple-300" />
                        <span>Upload Video</span>
                      </button>
                      {/* Upload Document */}
                      <button 
                        onClick={() => { docInputRef.current?.click(); setIsUploadMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold transition-all group cursor-pointer"
                      >
                        <RiFilePdfLine size={18} className="text-red-400 group-hover:text-red-300" />
                        <span>Upload Document</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Camera Capture Button */}
                <button 
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    cameraInputRef.current?.click();
                  }}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer shrink-0"
                  title="Take photo using camera"
                  aria-label="Take photo with camera"
                >
                  <RiCameraLine size={17} />
                </button>

                {/* Web Search Toggle Pill Button (Tavily search vs pure AI) */}
                <button
                  type="button"
                  onClick={handleToggleWebSearch}
                  className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                    webSearch 
                      ? 'bg-[#20b8cd]/15 border-[#20b8cd]/40 text-[#148393] dark:text-[#5ce1f2] shadow-[0_0_12px_rgba(32,184,205,0.2)]' 
                      : 'bg-zinc-100/90 dark:bg-white/[0.06] border-zinc-300 dark:border-white/15 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title={webSearch ? "Web Search: ON (Using Tavily for live internet facts)" : "Web Search: OFF (Pure AI model knowledge)"}
                >
                  <RiGlobalLine size={14} className={webSearch ? "text-[#20b8cd]" : "text-zinc-400 dark:text-zinc-500"} />
                  <span className="text-[11px] sm:text-xs">Web</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[#20b8cd] animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
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
                {/* Increase/Decrease Input Size Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(prev => !prev)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isExpanded 
                      ? 'text-[#60A6AF] bg-[#60A6AF]/15 dark:bg-[#60A6AF]/25' 
                      : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  }`}
                  title={isExpanded ? "Collapse input size" : "Expand input size (edit large prompt or code)"}
                >
                  {isExpanded ? <RiContractUpDownLine size={18} /> : <RiExpandUpDownLine size={18} />}
                </button>

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
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                    !user || input.trim() || files.length > 0 
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10 hover:scale-105' 
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50'
                  }`}
                  title="Send message"
                >
                  <RiArrowUpLine size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Guest prompt indicator */}
        {!user && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 text-xs text-zinc-500 animate-in fade-in duration-500">
            <span className="w-2 h-2 rounded-full bg-[#20b8cd] animate-pulse" />
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
                 <div key={i} className={`flex flex-col gap-2 p-4 bg-white dark:bg-[#121212]/50 border border-zinc-200/90 dark:border-white/5 rounded-2xl transition-all cursor-default shadow-2xs ${cap.bgHover}`}>
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
    </main>
  );
};

export default ChatArea;
