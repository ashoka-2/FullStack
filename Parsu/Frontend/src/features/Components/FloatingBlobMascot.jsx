import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import { JellyBlobMascot } from './JellyBlobMascot';

const FloatingBlobMascot = () => {
  const location = useLocation();

  // Hidden on Auth pages and Admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname === '/login' || location.pathname === '/register' || isAdminPage;

  // Visibility state from localStorage (default: true)
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_visible');
    return saved !== null ? saved === 'true' : true;
  });

  // Size state (width & height in px) from localStorage (default: 110)
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_size');
    return saved ? Math.max(60, Math.min(200, parseInt(saved, 10))) : 110;
  });

  // Mood and speech states
  const [mood, setMood] = useState('curious');
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [celebrate, setCelebrate] = useState(0);
  const [speechText, setSpeechText] = useState('');

  // Click & overpoke tally tracking
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const angerTimerRef = useRef(null);
  const speechTimerRef = useRef(null);
  const revertTimerRef = useRef(null);
  const isInteractingRef = useRef(false);

  // Listen for settings changes dispatched from Settings page
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail?.visible !== undefined) {
        setIsVisible(e.detail.visible);
      }
      if (e.detail?.size !== undefined) {
        setSize(e.detail.size);
      }
    };

    window.addEventListener('blob_settings_change', handleSettingsChange);
    return () => window.removeEventListener('blob_settings_change', handleSettingsChange);
  }, []);

  const showSpeech = (text, duration = 2200) => {
    setSpeechText(text);
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    if (duration > 0) {
      speechTimerRef.current = setTimeout(() => {
        setSpeechText('');
      }, duration);
    }
  };

  // Listen for external mood triggers (e.g., hovering over logout)
  useEffect(() => {
    const handleTriggerMood = (e) => {
      const { mood: newMood, speech, duration = 2200, celebrate: shouldCelebrate, revert = true } = e.detail || {};

      if (revertTimerRef.current) {
        clearTimeout(revertTimerRef.current);
        revertTimerRef.current = null;
      }

      if (newMood) {
        setMood(newMood);
        isInteractingRef.current = true;
      }

      if (shouldCelebrate) {
        setCelebrate((prev) => prev + 1);
      }

      if (speech !== undefined) {
        if (speech) {
          showSpeech(speech, duration);
        } else {
          setSpeechText('');
        }
      }

      if (revert && duration > 0) {
        revertTimerRef.current = setTimeout(() => {
          setMood('curious');
          setSpeechText('');
          isInteractingRef.current = false;
        }, duration);
      }
    };

    window.addEventListener('blob_trigger_mood', handleTriggerMood);
    return () => {
      window.removeEventListener('blob_trigger_mood', handleTriggerMood);
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
    };
  }, []);

  // Listen for AI speech synthesis (Text-To-Speech) state to animate mascot speaking
  useEffect(() => {
    let speakInterval = null;

    const handleSpeechState = (e) => {
      const { speaking, text } = e.detail || {};

      if (speaking) {
        isInteractingRef.current = true;
        setSpeechText(text || 'Speaking AI response... 🔊');
        setMood('happy');
        setCelebrate((prev) => prev + 1);

        let toggle = false;
        if (speakInterval) clearInterval(speakInterval);
        speakInterval = setInterval(() => {
          toggle = !toggle;
          setMood(toggle ? 'wave' : 'happy');
          setGaze({
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 6
          });
        }, 500);
      } else {
        if (speakInterval) clearInterval(speakInterval);
        speakInterval = null;
        isInteractingRef.current = false;
        setSpeechText('');
        setMood('curious');
        setGaze({ x: 0, y: 0 });
      }
    };

    window.addEventListener('blob_speech_state', handleSpeechState);
    return () => {
      window.removeEventListener('blob_speech_state', handleSpeechState);
      if (speakInterval) clearInterval(speakInterval);
    };
  }, []);

  // Idle ambient mood cycle
  useEffect(() => {
    if (!isVisible || isAuthPage) return;

    const interval = setInterval(() => {
      // If currently angry, loved, sad, or externally interacting, don't interrupt
      if (mood === 'angry' || mood === 'love' || mood === 'sad' || isInteractingRef.current) return;

      const idleMoods = ['curious', 'neutral', 'sleepy', 'wave'];
      const randomMood = idleMoods[Math.floor(Math.random() * idleMoods.length)];
      setMood(randomMood);

      if (randomMood === 'wave') {
        showSpeech('Hey there! 👋', 3000);
      } else if (randomMood === 'sleepy') {
        showSpeech('Zzz... 😴', 3000);
      } else {
        setSpeechText('');
      }
    }, 14000);

    return () => clearInterval(interval);
  }, [isVisible, isAuthPage, mood]);

  // Click handler with rapid clicking anger detection
  const handleBlobClick = () => {
    clickCountRef.current += 1;

    // Reset click counter after 1.8 seconds of inactivity
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1800);

    // Continuous clicks trigger ANGER
    if (clickCountRef.current >= 4) {
      setMood('angry');
      showSpeech('Hey! Stop poking me! 😡', 2800);
      clickCountRef.current = 0;

      if (angerTimerRef.current) clearTimeout(angerTimerRef.current);
      angerTimerRef.current = setTimeout(() => {
        setMood('neutral');
        setSpeechText('');
      }, 3000);
      return;
    }

    // Normal click/poke
    const reactions = ['shy', 'surprised', 'wave', 'curious'];
    const chosen = reactions[Math.floor(Math.random() * reactions.length)];
    setMood(chosen);

    if (chosen === 'shy') {
      showSpeech('Eep! 🙈', 1800);
    } else if (chosen === 'surprised') {
      showSpeech('Whoa! 😲', 1800);
    } else if (chosen === 'wave') {
      showSpeech('Hello! ✨', 1800);
    }

    setTimeout(() => {
      if (mood !== 'angry') setMood('curious');
    }, 1600);
  };

  // Double click triggers love & celebrate
  const handleDoubleClick = () => {
    setMood('love');
    setCelebrate((prev) => prev + 1);
    showSpeech('Aww, love you! 💖', 3000);
    setTimeout(() => {
      setMood('curious');
    }, 3500);
  };

  // Track screen size for mobile responsive placement
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeSize = isMobile ? Math.min(size, 72) : size;

  if (isAuthPage || !isVisible) {
    return null;
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[10000] flex flex-col items-center select-none cursor-grab active:cursor-grabbing touch-none"
      style={{
        width: `${activeSize}px`,
        height: `${activeSize}px`
      }}
      whileDrag={{ scale: 1.05 }}
    >
      {/* Speech Bubble */}
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.85 }}
          className="absolute -top-5 px-2.5 py-1 rounded-full bg-zinc-900/95 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow-md backdrop-blur-sm whitespace-nowrap pointer-events-none z-10"
        >
          {speechText}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900/95 dark:bg-white" />
        </motion.div>
      )}

      {/* Mascot Container */}
      <div
        className="w-full h-full relative group cursor-pointer flex items-center justify-center"
        onClick={handleBlobClick}
        onDoubleClick={handleDoubleClick}
      >
        <JellyBlobMascot
          mood={mood}
          eyeStyle="v1"
          gaze={gaze}
          celebrate={celebrate}
          className="w-full h-full drop-shadow-xl"
        />
      </div>
    </motion.div>
  );
};

export default FloatingBlobMascot;
