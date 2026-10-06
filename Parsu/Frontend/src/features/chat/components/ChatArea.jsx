import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion } from 'motion/react';
import {
  RiArrowRightLine, RiRobot2Line, RiAddLine, RiMicLine, RiMicFill, RiFileList3Line,
  RiBookOpenLine, RiHeart2Line, RiUploadCloudLine, RiFileTextLine, RiArrowUpLine,
  RiCompass3Line, RiGlobalLine, RiMagicLine, RiFullscreenLine, RiFullscreenExitLine,
  RiCodeSSlashLine, RiSpyLine, RiVoiceprintLine, RiChat3Line, RiComputerLine,
  RiShareForwardLine, RiMailLine, RiMapPin2Line,
} from '@remixicon/react';
import { useChat } from '../hook/useChat';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { setMessages } from '../chat.slice';
import { addToast } from '../../../utils/toast.slice';
import ParsuLogo from '../../Components/ParsuLogo';
import { getModels } from '../service/model.api';
import ThinkingSelectorDropdown, { getStoredThinkingLevel } from './ThinkingSelectorDropdown';
import { useAiFeatureToggles } from '../../../utils/aiSettingsSync';
import AttachmentPreviewStrip from './AttachmentPreviewStrip';
import AddToChatSheet from './AddToChatSheet';
import { CircleButton } from '../../Components/PillButton';
import MatrixOrb from '../../Components/rare-ui/MatrixOrb';
import { triggerBlobInteraction, triggerBlobTyping } from '../../../utils/blobReactions';
import VoiceMode from './VoiceMode';
import { resolveIntent } from '../hook/useVoiceAgent';
import { executeDeviceCommandApi } from '../../device/service/device.api';

gsap.registerPlugin(useGSAP);

// Minimal Brand Header: Logo and Site Name only, no other texts
const MinimalBrandHeader = memo(() => (
  <div className="flex flex-col items-center justify-center pt-6 sm:pt-10 pb-3 select-none">
    <div className="relative flex items-center justify-center mb-3">
      <div className="absolute inset-0 rounded-full bg-[var(--accent-cyan)]/25 blur-2xl pointer-events-none scale-150 animate-pulse" />
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/80 dark:border-white/10 shadow-[0_10px_25px_rgba(32,184,205,0.2)] flex items-center justify-center">
        <ParsuLogo className="w-9 h-9 sm:w-10 sm:h-10 text-zinc-900 dark:text-white" />
      </div>
    </div>
    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-display">
      PARSU AI
    </h1>
  </div>
));

// Clean, informative shortcuts so users immediately know what the site can do
const DASHBOARD_SHORTCUTS = [
  { icon: RiChat3Line, label: 'Explain quantum computing simply', color: 'text-cyan-500 dark:text-cyan-400' },
  { icon: RiComputerLine, label: 'Open Spotify & search lofi', color: 'text-purple-500 dark:text-purple-400' },
  { icon: RiShareForwardLine, label: 'Draft an Instagram caption', color: 'text-pink-500 dark:text-pink-400' },
  { icon: RiMailLine, label: 'Summarize unread Gmail', color: 'text-amber-500 dark:text-amber-400' },
  { icon: RiMapPin2Line, label: 'Plan a 3-day trip to Munnar', color: 'text-rose-500 dark:text-rose-400' },
  { icon: RiGlobalLine, label: 'Latest tech news & insights', color: 'text-emerald-500 dark:text-emerald-400' },
  { icon: RiCodeSSlashLine, label: 'Write Python automation script', color: 'text-blue-500 dark:text-blue-400' },
  { icon: RiVoiceprintLine, label: 'Live hands-free voice talk', color: 'text-sky-500 dark:text-sky-400', isVoice: true },
];

const MinimalShortcuts = memo(({ onTry, onTalk }) => (
  <div className="w-full max-w-[800px] mx-auto mt-3 px-2 sm:px-0">
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      {DASHBOARD_SHORTCUTS.map((s, idx) => {
        const Icon = s.icon;
        return (
          <motion.button
            key={idx}
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => s.isVoice ? onTalk() : onTry(s.label)}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200/90 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] hover:border-[var(--accent-cyan)] dark:hover:border-[var(--accent-cyan)] hover:bg-white dark:hover:bg-white/[0.08] hover:text-zinc-950 dark:hover:text-white transition-all shadow-xs cursor-pointer backdrop-blur-sm"
          >
            <Icon size={15} className={`shrink-0 ${s.color}`} />
            <span>{s.label}</span>
          </motion.button>
        );
      })}
    </div>
  </div>
));

// Live speech caption bar (used in the main input and the full-screen editor)
const LiveCaption = ({ caption, onStop, className = '' }) => (
  <div className={`flex items-center gap-3 px-3.5 py-2 rounded-xl bg-zinc-900/95 dark:bg-[var(--bg-surface)]/95 border border-[var(--accent-cyan)]/40 text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 ${className}`}>
    <div className="flex items-center gap-1 shrink-0">
      {[['h-3', 0], ['h-5', 150], ['h-2', 300], ['h-4', 450]].map(([h, d]) => (
        <span key={d} className={`w-1 ${h} rounded-full bg-[var(--accent-cyan)] animate-bounce`} style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
        <span className="text-[10px] font-bold text-[var(--color-sky-haze)] uppercase tracking-wider">Live Speech Caption</span>
      </div>
      <p className="text-[13px] text-zinc-100 font-medium truncate italic mt-0.5">{caption || 'Listening to your voice... Speak now'}</p>
    </div>
    <button type="button" onClick={onStop} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer shrink-0">Done</button>
  </div>
);

const ICON_MAP = { global: RiGlobalLine, robot: RiRobot2Line, file: RiFileList3Line, magic: RiMagicLine, compass: RiCompass3Line, book: RiBookOpenLine, heart: RiHeart2Line };

/* ==========================================================================
   CHAT AREA
   ========================================================================== */
const ChatArea = () => {
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      const saved = localStorage.getItem('parsu_selected_model');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [thinkingLevel, setThinkingLevel] = useState(getStoredThinkingLevel);

  const { handleSendMessage, handleGetSuggestions, loading } = useChat();

  const user = useSelector(state => state.auth.user);
  const isSidebarCollapsed = useSelector(state => state.chat.isSidebarCollapsed);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const textareaRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [isFullScreenEditor, setIsFullScreenEditor] = useState(false);

  const isCodeContent = Boolean(
    input && (
      input.includes('```') ||
      (input.includes('\n') && (
        /^(import|export|const|let|var|function|class|def|public|private|protected|interface|type|return|<[a-zA-Z]+|\/\/|\/\*|#include|package|func|select|from|where)\b/im.test(input) ||
        /[{}();=>\[\]]/.test(input)
      ))
    )
  );

  // Auto-grow textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 54), 280)}px`;
  }, [input]);

  // Sync active model when the server auto-switches (vision, faster model, or failover)
  useEffect(() => {
    const handleAutoSwitch = (e) => {
      if (!e.detail?.modelId) return;
      const updated = {
        id: e.detail.modelId, modelId: e.detail.modelId,
        name: e.detail.name || e.detail.modelName || e.detail.modelId,
        modelName: e.detail.name || e.detail.modelName || e.detail.modelId,
        provider: e.detail.provider || 'gemini', badge: e.detail.badge || 'Fast', isCustom: Boolean(e.detail.isCustom),
      };
      setSelectedModel(updated);
      try {
        localStorage.setItem('parsu_selected_model', JSON.stringify(updated));
      } catch (err) {}
    };
    window.addEventListener('model_auto_switched', handleAutoSwitch);
    return () => window.removeEventListener('model_auto_switched', handleAutoSwitch);
  }, []);

  // Initial model from backend or the user's custom key if not already cached
  useEffect(() => {
    let mounted = true;
    getModels().then(data => {
      if (mounted && data?.success) {
        let currentSaved = null;
        try {
          currentSaved = JSON.parse(localStorage.getItem('parsu_selected_model') || 'null');
        } catch (e) {}

        if (!currentSaved) {
          const activeCustom = data.customModels?.[0];
          const initial = (user?.customApiKeys?.some(k => k.isActive !== false && k.apiKey) && activeCustom)
            ? activeCustom : (data.selectedModel || data.defaultModels?.[0]);
          if (initial) {
            setSelectedModel(initial);
            try {
              localStorage.setItem('parsu_selected_model', JSON.stringify(initial));
            } catch (err) {}
          }
        }
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  /* ---- Speech to text ---- */
  const [isListening, setIsListening] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');
  const recognitionRef = useRef(null);
  const baseInputRef = useRef('');

  const handleToggleVoiceInput = () => {
    if (!user) { navigate('/auth'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatch(addToast({ type: 'warning', message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.' }));
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      setLiveCaption('');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      const savedVoiceURI = (localStorage.getItem('parsu_tts_voice') || localStorage.getItem('perplexity_tts_voice') || '').toLowerCase();
      const isHindiPreferred = savedVoiceURI.includes('hindi') || savedVoiceURI.includes('hi-in') || (navigator.language && navigator.language.startsWith('hi'));
      recognition.lang = isHindiPreferred ? 'hi-IN' : (navigator.language || 'en-US');
      baseInputRef.current = input ? input.trim() : '';

      recognition.onstart = () => {
        setIsListening(true);
        setLiveCaption('Listening to your speech... Speak now');
        triggerBlobInteraction('curious');
      };
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        // Walk all results from 0 to avoid Chrome's non-monotonic resultIndex duplication bug
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript + ' ';
          else interimTranscript += transcript;
        }
        finalTranscript = finalTranscript.trim();
        interimTranscript = interimTranscript.trim();
        const spoken = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
        if (!spoken) return;
        setLiveCaption(spoken);
        const base = baseInputRef.current;
        setInput(base ? `${base} ${spoken}` : spoken);
        if (finalTranscript) { triggerBlobTyping(); }
      };
      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          dispatch(addToast({ type: 'error', message: `Mic error: ${event.error || 'Check microphone permissions'}` }));
        }
        setIsListening(false);
        setLiveCaption('');
      };
      recognition.onend = () => { setIsListening(false); setLiveCaption(''); };
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setLiveCaption('');
    }
  };
  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  /* ---- Suggestions from backend (queries + topics) ---- */
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setSuggestionsLoading(true);
      const data = await handleGetSuggestions();
      if (data) setAiSuggestions(data);
      setSuggestionsLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Files ---- */
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenSheet = () => setIsUploadMenuOpen(true);
    window.addEventListener('open_add_to_chat_sheet', handleOpenSheet);
    return () => window.removeEventListener('open_add_to_chat_sheet', handleOpenSheet);
  }, []);

  const { webSearch, handleToggleWebSearch, memoryEnabled, handleToggleMemory } = useAiFeatureToggles();

  const [incognito, setIncognito] = useState(() => localStorage.getItem('parsu_incognito') === '1');
  useEffect(() => {
    const handler = (e) => setIncognito(Boolean(e.detail));
    window.addEventListener('parsu_incognito_change', handler);
    return () => window.removeEventListener('parsu_incognito_change', handler);
  }, []);

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files);
    setFiles(prev => [...prev, ...uploaded.map(f => ({ name: f.name, isLink: false, fileObject: f }))]);
    setIsUploadMenuOpen(false);
    e.target.value = ''; // allow re-picking the same file
  };
  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  /* ---- Send ---- */
  const offlineToast = () => dispatch(addToast({ type: 'warning', message: 'No internet connection. Please check your network.' }));

  const onSubmit = async (e, text = null) => {
    if (e?.preventDefault) e.preventDefault();

    if (typeof navigator !== 'undefined' && !navigator.onLine) { offlineToast(); return; }
    if (!user) { navigate('/auth'); return; }

    const messageToSend = text || input;
    const fileObjects = files.map(f => f.fileObject).filter(Boolean);
    const filesToSend = fileObjects.length > 1 ? fileObjects : (fileObjects[0] || null);
    if ((!messageToSend.trim() && !filesToSend) || loading || isSubmittingRef.current) return null;

    // Instant device / URL / scroll actions
    const intent = resolveIntent(messageToSend);
    if (intent) {
      if (intent.type === 'device_cmd') {
        executeDeviceCommandApi({
          targetSelector: intent.targetSelector || intent.params?.targetSelector,
          action: intent.action, params: intent.params, confirmed: true,
        }).then((res) => {
          if (res?.success === false || res?.launched === false) {
            dispatch(addToast({ type: 'warning', message: res?.error || res?.message || 'App not found, sir, and could not be opened.' }));
          } else {
            dispatch(addToast({ type: 'success', message: `⚡ ${intent.label}` }));
          }
        }).catch(err => {
          dispatch(addToast({ type: 'warning', message: `Device: ${err?.response?.data?.message || err.message}` }));
        });
        setInput('');
        return null;
      } else if (intent.type === 'open_url') {
        window.open(intent.url, '_blank', 'noopener,noreferrer');
        dispatch(addToast({ type: 'info', message: `🌐 Opening ${intent.label}` }));
        setInput('');
        return null;
      } else if (intent.type === 'scroll') {
        if (intent.to === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (intent.to === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        else window.scrollBy({ top: intent.by, behavior: 'smooth' });
        dispatch(addToast({ type: 'info', message: `Scrolling ${intent.by > 0 ? 'down' : 'up'}` }));
        setInput('');
        return null;
      }
    }

    try {
      isSubmittingRef.current = true;
      setInput('');
      setFiles([]);
      setIsFullScreenEditor(false);
      dispatch(setMessages([]));
      navigate('/chat/new');

      // Auto-switch to the user's custom key model if they have one and are on a built-in model
      let effectiveSendModel = selectedModel;
      const activeCustomKey = user?.customApiKeys?.find(k => k.isActive !== false && k.apiKey);
      if (activeCustomKey && !selectedModel?.isCustom) {
        const customModelId = activeCustomKey.models?.[0]?.id || (activeCustomKey.provider === 'gemini' ? 'gemini-3.6-flash' : activeCustomKey.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o');
        const customModelName = activeCustomKey.models?.[0]?.name || `${activeCustomKey.provider?.toUpperCase()} (${customModelId})`;
        const optimistic = {
          id: customModelId, modelId: customModelId, name: customModelName, modelName: customModelName,
          provider: activeCustomKey.provider, badge: 'Custom Key', isCustom: true, keyId: activeCustomKey._id,
        };
        setSelectedModel(optimistic);
        effectiveSendModel = optimistic;
        window.dispatchEvent(new CustomEvent('model_auto_switched', { detail: optimistic }));
      }

      const sendPromise = handleSendMessage(messageToSend, null, filesToSend, effectiveSendModel, webSearch, memoryEnabled, incognito, thinkingLevel);
      sendPromise.then(response => {
        if (response && response.chat) navigate(`/chat/${response.chat._id}`, { replace: true });
      }).catch(err => console.error('Message send failed:', err));
      return await sendPromise;
    } catch (error) {
      console.error('Message send failed:', error);
      return null;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Stable handlers for the memoised home sections (so typing doesn't re-render them)
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const userRef = useRef(user);
  userRef.current = user;
  const handleTry = useCallback((text) => {
    if (!userRef.current) { navigate('/auth'); return; }
    onSubmitRef.current(null, text);
  }, [navigate]);
  const handleTalk = useCallback(() => {
    if (!userRef.current) { navigate('/auth'); return; }
    setIsVoiceModeOpen(true);
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: start, selectionEnd: end, value } = e.target;
      setInput(value.substring(0, start) + '  ' + value.substring(end));
      requestAnimationFrame(() => {
        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
      });
      return;
    }
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; // newline
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!user) { navigate('/auth'); return; }
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles(prev => [...prev, ...dropped.map(f => ({ name: f.name, isLink: false, fileObject: f }))]);
  };

  const requireAuth = (fn) => (...args) => { if (!user) { navigate('/auth'); return; } fn(...args); };
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const hasContent = input.trim() || files.length > 0;
  const lineCount = input.split('\n').length;

  return (
    <main data-lenis-prevent
      className="isolate flex-1 w-full flex flex-col items-center bg-[var(--bg-primary)] relative overflow-x-hidden overflow-y-auto custom-scrollbar pt-14 sm:pt-16"
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-6">
          <div className="bg-white/80 dark:bg-[var(--bg-surface)]/80 border-2 border-dashed border-[var(--color-clear-hanada)] rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 shadow-2xl">
            <RiUploadCloudLine size={64} className="text-[var(--color-clear-hanada)] animate-bounce" />
            <h2 className="text-xl font-bold text-black dark:text-white uppercase tracking-wider">Drop to upload</h2>
          </div>
        </div>
      )}

      <div className="w-full max-w-fluid flex flex-col items-center px-4 md:px-0 pt-2 sm:pt-4 md:pt-6">

        {/* Minimal header: logo and site name only, plus quick shortcuts */}
        <MinimalBrandHeader />
        <MinimalShortcuts onTry={handleTry} onTalk={handleTalk} />

        {loading && (
          <div className="w-full max-w-[800px] flex flex-col items-center justify-center gap-3 py-6 my-4 bg-zinc-100/60 dark:bg-white/[0.03] border border-cyan-500/20 rounded-3xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <MatrixOrb size={100} state="thinking" color="var(--accent-cyan)" dots={12} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">Parsu AI is thinking & reasoning...</span>
              <span className="text-[11px] text-zinc-500 font-medium animate-pulse">Querying models, searching web, and formulating optimal response</span>
            </div>
          </div>
        )}

        {/* Input bar: fixed at bottom, sidebar-aware on desktop */}
        <div className={`fixed bottom-0 right-0 z-[60] p-2.5 pb-5 sm:p-4 sm:pb-8 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent backdrop-blur-[2px] transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'left-0 lg:left-16' : 'left-0 lg:left-56'}`}>
          <div className={`w-full ${isVoiceModeOpen ? 'max-w-[500px]' : 'max-w-[800px]'} mx-auto bg-white dark:bg-[var(--bg-surface)] border ${isDragging ? 'border-[var(--color-clear-hanada)]' : 'border-zinc-200/90 dark:border-[var(--border-secondary)]'} focus-within:border-[var(--color-clear-hanada)]/60 focus-within:ring-2 focus-within:ring-[var(--accent-cyan)]/20 rounded-[22px] sm:rounded-[28px] px-3.5 sm:px-6 py-3 sm:py-5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]`}>

            <AttachmentPreviewStrip files={files} onRemove={removeFile} />

            {isListening && <LiveCaption caption={liveCaption} onStop={handleToggleVoiceInput} className="mb-2" />}

            {(isCodeContent || (input && lineCount > 2)) && (
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 select-none animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  {isCodeContent && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-clear-hanada)]/15 text-[var(--color-deep-hanada)] dark:text-[var(--color-sky-haze)] border border-[var(--color-clear-hanada)]/25">
                      <RiCodeSSlashLine size={12} /> Code format preserved
                    </span>
                  )}
                  <span className="text-[11px] font-medium">{lineCount} lines • {input.length} characters</span>
                </div>
                <button type="button" onClick={requireAuth(() => setIsFullScreenEditor(true))} title="Open full-screen prompt and code editor"
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-clear-hanada)] hover:text-[var(--color-deep-hanada)] dark:hover:text-[var(--color-sky-haze)] transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
                  <RiFullscreenLine size={13} /><span>Full screen</span>
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              data-guide="chat-main-input"
              rows="1"
              value={input}
              onChange={(e) => {
                if (!user) { navigate('/auth'); return; }
                setInput(e.target.value);
                triggerBlobTyping();
              }}
              onMouseEnter={() => triggerBlobInteraction('hover')}
              onFocus={() => {
                if (!user) { navigate('/auth'); return; }
                triggerBlobInteraction('focus');
              }}
              onClick={() => {
                if (!user) { navigate('/auth'); return; }
                triggerBlobInteraction('click');
              }}
              onKeyDown={handleKeyDown}
              spellCheck={!isCodeContent}
              style={{ whiteSpace: 'pre-wrap', tabSize: 2, MozTabSize: 2 }}
              placeholder={user ? 'Ask anything or paste code...' : 'Click or sign in to start a new chat...'}
              className={`w-full bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 custom-scrollbar transition-all resize-none ${
                isCodeContent ? 'font-mono text-[14px] md:text-[15px] leading-relaxed' : 'font-sans font-medium text-[17px] md:text-[18px] leading-snug md:leading-relaxed'
              } min-h-[50px] max-h-[280px] cursor-text`}
            />

            <div className="flex items-center justify-between mt-3 sm:mt-4 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                <div className="relative shrink-0" data-guide="chat-attach-btn">
                  <CircleButton onClick={requireAuth(() => setIsUploadMenuOpen(true))} title="Add to chat (Photos, Videos, Files, Memory)" ariaLabel="Add to chat">
                    <RiAddLine size={18} className="shrink-0" />
                  </CircleButton>
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
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </div>

                {/* Web Search Button (Hidden smoothly in Voice Mode) */}
                <div className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
                  isVoiceModeOpen 
                    ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none scale-90' 
                    : 'max-w-[120px] opacity-100 translate-x-0 scale-100'
                }`}>
                  <button type="button" onClick={requireAuth((e) => handleToggleWebSearch(e))}
                    data-guide="chat-web-search-btn"
                    className={`hidden sm:flex h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-full border items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                      webSearch ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)]/40 text-[var(--color-deep-hanada)] dark:text-[var(--color-sky-haze)] shadow-[0_0_12px_rgba(32,184,205,0.2)]'
                        : 'bg-zinc-100/90 dark:bg-white/[0.06] border-zinc-300 dark:border-white/15 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                    title={webSearch ? 'Web Search: ON (Using Tavily for live internet facts)' : 'Web Search: OFF (Pure AI model knowledge)'}>
                    <RiGlobalLine size={14} className={webSearch ? 'text-[var(--accent-cyan)]' : 'text-zinc-400 dark:text-zinc-500'} />
                    <span className="text-[11px] sm:text-xs">Web</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[var(--accent-cyan)] animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                  </button>
                </div>

                {/* Thinking Mode Dropdown (Hidden smoothly in Voice Mode) */}
                <div 
                  data-guide="thinking-level-selector"
                  className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
                    isVoiceModeOpen 
                      ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none scale-90' 
                      : 'max-w-[160px] opacity-100 translate-x-0 scale-100'
                  }`}
                >
                  <ThinkingSelectorDropdown thinkingLevel={thinkingLevel} onChange={setThinkingLevel} placement="top" />
                </div>

                {incognito && !isVoiceModeOpen && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-[11px] text-purple-400 font-semibold shrink-0 cursor-help"
                    title="Incognito Mode is ON: This chat will not be saved to your history or library.">
                    <RiSpyLine size={13} /><span className="hidden sm:inline">Incognito</span>
                  </span>
                )}

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
                <input type="file" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" capture="environment" />
                <input type="file" ref={videoInputRef} onChange={handleFileUpload} className="hidden" accept="video/*" multiple />
                <input type="file" ref={docInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md,.doc,.docx" multiple />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {(input.length > 50 || input.includes('\n')) && (
                  <button type="button" onClick={requireAuth(() => setIsFullScreenEditor(true))} title="Open full-screen prompt and code studio"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer">
                    <RiFullscreenLine size={18} />
                  </button>
                )}

                {/* MIC button (Hidden smoothly in Voice Mode) */}
                <div className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
                  isVoiceModeOpen 
                    ? 'max-w-0 opacity-0 scale-75 pointer-events-none' 
                    : 'max-w-9 opacity-100 scale-100'
                }`}>
                  <button type="button" onClick={handleToggleVoiceInput}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${isListening ? 'text-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/30' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                    title={isListening ? 'Listening... Click to stop' : 'Voice input (Speech to text)'}>
                    {isListening ? <RiMicFill size={18} className="text-rose-500" /> : <RiMicLine size={18} />}
                  </button>
                </div>

                {isVoiceModeOpen ? (
                  /* SQUARE SHAPED RESPONDING / STOP BUTTON */
                  <button 
                    type="button" 
                    onClick={() => setIsVoiceModeOpen(false)} 
                    title="Stop AI responding and close voice mode"
                    aria-label="Stop responding"
                    className="w-8.5 h-8.5 flex items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-lg group relative"
                  >
                    <span className="w-3.5 h-3.5 rounded-[3px] bg-current transition-transform group-hover:scale-110 shadow-sm" />
                    <span className="absolute inset-0 rounded-xl border border-current opacity-30 animate-ping pointer-events-none" />
                  </button>
                ) : !hasContent ? (
                  <button type="button" onClick={handleTalk} title="Start live voice talk (Jarvis Agent)"
                    className="w-8.5 h-8.5 flex items-center justify-center rounded-full bg-[var(--accent-cyan)] hover:brightness-110 text-zinc-950 shadow-md shadow-[var(--accent-cyan)]/25 active:scale-95 transition-all duration-300 cursor-pointer">
                    <RiVoiceprintLine size={18} />
                  </button>
                ) : (
                  <button
                    disabled={offline}
                    onClick={(e) => {
                      if (!user) { navigate('/auth'); return; }
                      onSubmit(e);
                    }}
                    className={`w-8.5 h-8.5 flex items-center justify-center rounded-full transition-all bg-[var(--accent-cyan)] text-zinc-950 shadow-md shadow-[var(--accent-cyan)]/25 ${offline ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--accent-cyan-hover)] hover:scale-105 active:scale-95 cursor-pointer'}`}
                    title={offline ? 'You are offline. Reconnect to send messages.' : 'Send message'}>
                    <RiArrowUpLine size={19} className="stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">Parsu AI can make mistakes. Check important info.</p>
          </div>
        </div>

        {/* Suggested queries from backend */}
        <div className="w-full max-w-[800px] mt-10 space-y-3">
          {suggestionsLoading ? (
            [1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-8 bg-zinc-900/50 rounded-lg animate-pulse" />)
          ) : (
            (aiSuggestions?.queries || [
              'Show me latest Flipkart deals', 'Find online courses to master digital art',
              'Recommend Bollywood movies for a long flight', 'Show me best practices for CSS Grid and Flexbox',
              'Compare CSS flexbox vs grid layouts',
            ]).map((query, i) => (
              <button key={i} type="button" onClick={() => handleTry(query)}
                className="w-full text-left px-4 py-2.5 text-[14px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border-b border-zinc-100 dark:border-zinc-900/50 block font-medium break-words whitespace-normal cursor-pointer">
                {query}
              </button>
            ))
          )}
        </div>

        {/* Trending topics from backend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 w-full max-w-[800px] px-1">
          {suggestionsLoading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-[120px] bg-zinc-900/30 border border-white/5 rounded-2xl animate-pulse" />)
          ) : (
            (aiSuggestions?.topics || [
              { label: 'Advancements in Fusion Energy', desc: 'Science · 4h ago', iconType: 'global' },
              { label: 'Build AI agents with Node.js', desc: 'Tutorial · Today', iconType: 'robot' },
              { label: 'Deep dive into tech layoffs', desc: 'Business · 1d ago', iconType: 'file' },
              { label: 'The 3-body problem explained', desc: 'Physics · 6h ago', iconType: 'magic' },
            ]).map((topic, i) => {
              const Icon = ICON_MAP[topic.iconType] || RiMagicLine;
              return (
                <button key={i} type="button" onClick={() => handleTry(topic.label)}
                  className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-all text-left group shadow-sm dark:shadow-none cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 transition-colors">
                      <Icon className="text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-400" size={18} />
                    </div>
                    <RiArrowRightLine size={14} className="text-zinc-300 dark:text-zinc-800 group-hover:text-zinc-600 dark:group-hover:text-zinc-500 mr-1 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors leading-[1.4] break-words line-clamp-2">{topic.label}</h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 font-bold uppercase tracking-tight">{topic.desc}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Spacer so content isn't hidden behind the fixed input bar */}
        <div className="h-36 sm:h-40 shrink-0" />
      </div>

      {/* Full-screen prompt & code editor */}
      {isFullScreenEditor && typeof document !== 'undefined' && createPortal(
        <div data-lenis-prevent="true" onWheel={(e) => e.stopPropagation()}
          className={`fixed inset-0 ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-56'} z-[9980] bg-[var(--bg-primary)] text-zinc-100 flex flex-col pointer-events-auto select-auto animate-in fade-in zoom-in-95 duration-200 border-l border-zinc-800/80 shadow-2xl transition-[left] ease-[cubic-bezier(0.4,0,0.2,1)]`}>
          <div className="h-14 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[var(--bg-secondary)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                {isCodeContent ? <RiCodeSSlashLine size={18} /> : <RiFileTextLine size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Full-Screen Prompt Studio</h3>
                <p className="text-[11px] text-zinc-400 font-mono">{lineCount} lines • {input.length} characters {isCodeContent ? '• Code format preserved' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {input && (
                <button type="button" onClick={() => { setInput(''); dispatch(addToast({ message: 'Prompt cleared', type: 'info' })); }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">Clear</button>
              )}
              <button type="button" onClick={() => { navigator.clipboard.writeText(input); dispatch(addToast({ message: 'Prompt copied to clipboard!', type: 'info' })); }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer">Copy</button>
              <button type="button" onClick={() => setIsFullScreenEditor(false)} title="Exit full-screen mode"
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer">
                <RiFullscreenExitLine size={16} /><span>Done</span>
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col min-h-0 bg-[var(--bg-primary)]">
            <textarea autoFocus value={input}
              onChange={(e) => { setInput(e.target.value); triggerBlobTyping(); }}
              onKeyDown={handleKeyDown}
              spellCheck={!isCodeContent}
              style={{ whiteSpace: 'pre-wrap', tabSize: 2, MozTabSize: 2 }}
              placeholder="Type or paste your prompt, code or instructions..."
              className="w-full flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm sm:text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 custom-scrollbar p-2" />
          </div>

          {isListening && <LiveCaption caption={liveCaption} onStop={handleToggleVoiceInput} className="mx-4 sm:mx-6 mb-2" />}

          <div className="border-t border-zinc-800/80 bg-[var(--bg-secondary)] px-4 sm:px-6 py-3 shrink-0 flex flex-col gap-2.5">
            <AttachmentPreviewStrip files={files} onRemove={removeFile} />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                <CircleButton onClick={() => setIsUploadMenuOpen(true)} title="Add to chat (Photos, Videos, Files, Memory)" ariaLabel="Add to chat">
                  <RiAddLine size={18} className="shrink-0" />
                </CircleButton>
                <button type="button" onClick={handleToggleWebSearch}
                  className={`h-8.5 px-3 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
                    webSearch ? 'bg-[var(--accent-cyan)]/15 border-[var(--accent-cyan)]/40 text-[var(--color-sky-haze)] shadow-[0_0_12px_rgba(32,184,205,0.2)]' : 'bg-white/[0.06] border-white/15 text-zinc-400 hover:text-zinc-200'}`}
                  title={webSearch ? 'Web Search: ON (Using Tavily for live internet facts)' : 'Web Search: OFF (Pure AI model knowledge)'}>
                  <RiGlobalLine size={14} className={webSearch ? 'text-[var(--accent-cyan)]' : 'text-zinc-400'} />
                  <span className="text-xs">Web</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${webSearch ? 'bg-[var(--accent-cyan)] animate-pulse' : 'bg-zinc-600'}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={handleToggleVoiceInput}
                  className={`p-2 rounded-full transition-all cursor-pointer ${isListening ? 'text-rose-500 bg-rose-500/15 animate-pulse ring-2 ring-rose-500/30' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'}`}
                  title={isListening ? 'Listening... Click to stop' : 'Voice input (Speech to text)'}>
                  {isListening ? <RiMicFill size={19} className="text-rose-500" /> : <RiMicLine size={19} />}
                </button>
                {!hasContent ? (
                  <button type="button" onClick={() => { setIsFullScreenEditor(false); handleTalk(); }} title="Start live voice talk (Jarvis Agent)"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-cyan)] hover:brightness-110 text-zinc-950 shadow-md shadow-[var(--accent-cyan)]/25 active:scale-95 transition-all cursor-pointer">
                    <RiVoiceprintLine size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={(e) => onSubmit(e)} title="Send prompt"
                    className="px-4 py-2 h-9 flex items-center justify-center rounded-full transition-all gap-1.5 text-xs font-bold bg-white text-black hover:bg-zinc-200 shadow-lg hover:scale-105 cursor-pointer">
                    <span>Send</span><RiArrowUpLine size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Jarvis voice agent overlay */}
      <VoiceMode
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onSendMessage={async (text) => {
          try {
            const res = await onSubmit(null, text);
            return res?.aiMessage?.content || null;
          } catch (err) {
            console.error('VoiceMode send failed:', err);
            return null;
          }
        }}
      />
    </main>
  );
};

export default ChatArea;