import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    RiWifiOffLine, 
    RiServerLine, 
    RiRefreshLine, 
    RiSparklingFill, 
    RiGamepadLine, 
    RiArrowRightLine,
    RiHeartFill,
    RiCheckLine
} from '@remixicon/react';
import { JellyBlobMascot } from './JellyBlobMascot';
import ParsuLogo from './ParsuLogo';

/**
 * OfflineBlobPlayground
 * Full-screen playful interactive screen displayed whenever the internet is down
 * or the backend server is unreachable. Features mini-games, snack feeding,
 * and automatic session restoration as soon as connection recovers.
 */
export default function OfflineBlobPlayground({ 
    isOffline = false, 
    isServerDown = true, 
    onRetry, 
    isChecking = false,
    lastPath = '/'
}) {
    // Mascot state
    const [mood, setMood] = useState('curious');
    const [gaze, setGaze] = useState({ x: 0, y: 0 });
    const [celebrateCount, setCelebrateCount] = useState(0);
    const [speechText, setSpeechText] = useState("Don't worry, I'm here with you! ✨");
    
    // Mini bounce game state
    const [gameActive, setGameActive] = useState(false);
    const [bounceScore, setBounceScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        try {
            return parseInt(localStorage.getItem('blob_bounce_highscore') || '0', 10);
        } catch {
            return 0;
        }
    });
    const [bounceY, setBounceY] = useState(0);
    const [isFalling, setIsFalling] = useState(false);

    // Floating snacks animation
    const [snacks, setSnacks] = useState([]);
    
    // Countdown timer for automatic re-check
    const [countdown, setCountdown] = useState(5);

    const speechTimeoutRef = useRef(null);

    const triggerSpeech = useCallback((text, duration = 2400) => {
        setSpeechText(text);
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = setTimeout(() => {
            setSpeechText('');
        }, duration);
    }, []);

    // Pointer tracking for gaze
    const handleMouseMove = (e) => {
        const { innerWidth, innerHeight } = window;
        const x = ((e.clientX / innerWidth) - 0.5) * 35;
        const y = ((e.clientY / innerHeight) - 0.5) * 35;
        setGaze({ x, y });
    };

    // Auto-reconnect countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (onRetry) onRetry();
                    return 6;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onRetry]);

    // Click/Poke reactions
    const handlePoke = () => {
        const pokeMoods = ['surprised', 'happy', 'love', 'cool', 'curious'];
        const pokeQuotes = [
            "Boing! 🎾",
            "Hehe that tickles! 🤭",
            "Wheee! Higher! 🚀",
            "Boop! 👉",
            "I'm squishy! 🫧",
            "Still waiting for the server... ⏳",
            "Keep tapping! ✨"
        ];
        
        const nextMood = pokeMoods[Math.floor(Math.random() * pokeMoods.length)];
        const nextQuote = pokeQuotes[Math.floor(Math.random() * pokeQuotes.length)];
        
        setMood(nextMood);
        triggerSpeech(nextQuote);
        setCelebrateCount(c => c + 1);

        if (gameActive) {
            handleGameBounce();
        }
    };

    // Feed treats to Blob
    const handleFeedSnack = (snackType, emoji, message) => {
        const newSnack = {
            id: Date.now(),
            emoji,
            left: Math.random() * 60 + 20
        };
        setSnacks(prev => [...prev, newSnack]);
        
        setTimeout(() => {
            setSnacks(prev => prev.filter(s => s.id !== newSnack.id));
        }, 1500);

        setMood('love');
        triggerSpeech(message, 3000);
        setCelebrateCount(c => c + 1);
    };

    // Mini-game: Blob Bouncer
    const handleGameBounce = () => {
        setBounceScore(prev => {
            const next = prev + 1;
            if (next > highScore) {
                setHighScore(next);
                try {
                    localStorage.setItem('blob_bounce_highscore', next.toString());
                } catch (e) {
                    // Ignore localStorage restrictions
                }
            }
            return next;
        });

        // Bouncing spring effect
        setBounceY(-40);
        setIsFalling(false);
        setTimeout(() => {
            setBounceY(0);
            setIsFalling(true);
        }, 300);
    };

    const toggleGame = () => {
        if (!gameActive) {
            setGameActive(true);
            setBounceScore(0);
            triggerSpeech("Tap me to keep me bouncing in the air! 🪂", 3000);
            setMood('happy');
        } else {
            setGameActive(false);
            setBounceY(0);
            triggerSpeech("Great playing with you! 😊", 2000);
        }
    };

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="fixed inset-0 z-[99999] bg-[#f8f9fa] dark:bg-[#070809] text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-between p-3.5 sm:p-6 lg:p-8 select-none overflow-y-auto overflow-x-hidden min-h-[100dvh] h-[100dvh] custom-scrollbar transition-colors duration-300"
        >
            {/* Background Ambient Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-64 sm:w-80 h-64 sm:h-80 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Brand & Diagnostics */}
            <div className="w-full max-w-3xl flex items-center justify-between gap-2 z-10 shrink-0">
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                        <ParsuLogo size={16} className="text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold tracking-tight">Parsu AI</span>
                </div>

                {/* Connection Status Pill */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/10 shadow-xs backdrop-blur-md shrink-0">
                    {isOffline ? (
                        <>
                            <RiWifiOffLine size={13} className="text-red-500 animate-pulse shrink-0" />
                            <span className="text-[11px] sm:text-xs font-semibold text-red-600 dark:text-red-400">Offline</span>
                        </>
                    ) : (
                        <>
                            <RiServerLine size={13} className="text-amber-500 animate-pulse shrink-0" />
                            <span className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">Reconnecting...</span>
                        </>
                    )}
                </div>
            </div>

            {/* Center Area: Play with Blob Mascot */}
            <div className="relative flex flex-col items-center justify-center flex-1 max-w-md w-full text-center my-auto py-2 sm:py-4 z-10 shrink-0">
                
                {/* Floating Snacks Animation */}
                {snacks.map(s => (
                    <div 
                        key={s.id} 
                        style={{ left: `${s.left}%` }}
                        className="absolute top-6 text-2xl sm:text-3xl pointer-events-none animate-bounce duration-700"
                    >
                        {s.emoji}
                    </div>
                ))}

                {/* Status Heading */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-1.5 sm:mb-2">
                    {isOffline ? "You're Offline" : "Connecting to Server..."}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-3 sm:mb-4 leading-relaxed px-2">
                    {isOffline 
                        ? "Check your network connection. In the meantime, play with our friendly Blob mascot!"
                        : "The backend server is temporarily restarting. We'll automatically bring you back the moment it's online."}
                </p>

                {/* Reactive Speech Bubble */}
                {speechText && (
                    <div className="mb-2 min-h-[32px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-1 rounded-2xl bg-white/95 dark:bg-[#15171a]/95 backdrop-blur-md border border-cyan-500/25 shadow-md shadow-cyan-500/5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 text-center max-w-[260px] sm:max-w-[320px] flex items-center gap-1.5">
                            <RiSparklingFill className="w-3.5 h-3.5 text-[#20b8cd] shrink-0" />
                            <span className="truncate">{speechText}</span>
                        </div>
                    </div>
                )}

                {/* Mascot Canvas with Bouncing Physics */}
                <div 
                    onClick={handlePoke}
                    style={{ transform: `translateY(${bounceY}px)` }}
                    className="relative cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 my-1 sm:my-2 w-32 h-32 xs:w-36 xs:h-36 sm:w-44 sm:h-44 flex items-center justify-center"
                    title="Click or tap to play with Blob!"
                >
                    <JellyBlobMascot 
                        mood={mood} 
                        gaze={gaze} 
                        celebrate={celebrateCount} 
                        className="w-full h-full drop-shadow-xl"
                    />

                    {/* Ripple tap hint */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] sm:text-[11px] font-bold border border-cyan-500/20 shadow-xs whitespace-nowrap">
                        {gameActive ? `Score: ${bounceScore} (Best: ${highScore})` : "✨ Tap me to play!"}
                    </div>
                </div>

                {/* Fun Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5 max-w-sm">
                    <button
                        type="button"
                        onClick={() => handleFeedSnack('cookie', '🍪', 'Mmm, delicious chocolate chip! 🍪😋')}
                        className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#151617] hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                        <span>🍪</span>
                        <span>Cookie</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFeedSnack('coffee', '☕', 'Ah, fresh hot coffee! Energetic! ☕⚡')}
                        className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#151617] hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                        <span>☕</span>
                        <span>Coffee</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFeedSnack('pizza', '🍕', 'Hot cheesy pizza slice! Love it! 🍕❤️')}
                        className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white dark:bg-[#151617] hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                        <span>🍕</span>
                        <span>Pizza</span>
                    </button>

                    <button
                        type="button"
                        onClick={toggleGame}
                        className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer ${
                            gameActive 
                                ? 'bg-cyan-500 text-white border-cyan-400' 
                                : 'bg-white dark:bg-[#151617] text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
                        }`}
                    >
                        <RiGamepadLine size={13} />
                        <span>{gameActive ? 'Stop' : 'Bouncer'}</span>
                    </button>
                </div>
            </div>

            {/* Bottom Bar: Reconnection & Last Path Info */}
            <div className="w-full max-w-sm flex flex-col items-center gap-2 z-10 shrink-0 mt-2">
                <div className="flex items-center justify-between w-full px-3.5 py-2 rounded-2xl bg-white dark:bg-[#141517] border border-zinc-200/80 dark:border-white/10 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                        <span>Reconnecting in <strong className="text-zinc-800 dark:text-white font-bold">{countdown}s</strong></span>
                    </div>

                    <button
                        type="button"
                        onClick={onRetry}
                        disabled={isChecking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <RiRefreshLine size={13} className={isChecking ? "animate-spin" : ""} />
                        <span>{isChecking ? "Checking..." : "Retry"}</span>
                    </button>
                </div>

                {lastPath && lastPath !== '/' && (
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500">
                        Will resume at: <code className="bg-zinc-200/60 dark:bg-white/5 px-1 py-0.5 rounded font-mono">{lastPath}</code>
                    </p>
                )}
            </div>
        </div>
    );
}
