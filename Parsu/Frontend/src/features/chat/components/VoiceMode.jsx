/**
 * VoiceMode — ChatGPT-Style Floating Fluid Voice Orb
 *
 * Designed to overlay seamlessly on top of existing chat messages without blocking:
 *  1. Completely transparent — your existing chat messages and input field stay fully visible and usable.
 *  2. Floating 3D fluid nebula orb positioned gracefully above your chat input.
 *  3. Central 3-dot badge (...) with real-time breathing/speaking animation.
 *  4. Quick close (✕) and mute controls directly alongside the orb.
 *  5. Real-time streaming voice: speaks AI responses sentence-by-sentence in chunks as tokens arrive.
 *  6. Uses whichever voice is selected in Settings (including Charon - Jarvis AI).
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
    RiMicLine,
    RiMicOffLine,
    RiCloseLine,
    RiSparklingLine
} from '@remixicon/react';
import { useVoiceAgent } from '../hook/useVoiceAgent';

// ─── Fluid Voice Orb Component ───────────────────────────────────────────────
function FluidVoiceOrb({ status, onClick }) {
    const isSpeaking = status === 'speaking';
    const isListening = status === 'listening';
    const isThinking = status === 'thinking';
    const isAction = status === 'action';

    return (
        <div 
            onClick={onClick}
            role="button"
            tabIndex={0}
            title={isListening ? "Listening... click to pause" : "Click to speak"}
            className="group relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 hover:scale-105 active:scale-95"
            style={{ width: '130px', height: '130px' }}
        >
            {/* Ambient Outer Halo / Glow */}
            <div 
                className={`absolute inset-[-14px] rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
                    isSpeaking 
                        ? 'bg-white/35 scale-110 opacity-80' 
                        : isListening 
                        ? 'bg-white/20 scale-100 opacity-60' 
                        : isThinking 
                        ? 'bg-violet-400/25 scale-105 opacity-60'
                        : isAction
                        ? 'bg-amber-400/25 scale-105 opacity-60'
                        : 'bg-white/10 scale-95 opacity-30 group-hover:opacity-50'
                }`}
            />

            {/* Main Spherical Orb Container */}
            <div 
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-2xl transition-all duration-500 border border-white/20 ${
                    isSpeaking 
                        ? 'shadow-[0_0_55px_rgba(255,255,255,0.45)]' 
                        : isListening 
                        ? 'shadow-[0_0_35px_rgba(255,255,255,0.25)]' 
                        : 'shadow-[0_15px_35px_rgba(0,0,0,0.6)]'
                }`}
                style={{
                    background: 'radial-gradient(circle at 35% 30%, #3a3b40 0%, #1c1d22 55%, #0d0e12 100%)',
                    animation: isSpeaking 
                        ? 'fluidOrbSpeaking 1.4s ease-in-out infinite' 
                        : isListening 
                        ? 'fluidOrbBreathe 2.6s ease-in-out infinite' 
                        : 'none'
                }}
            >
                {/* Layer 1: Swirling white/mist nebula cloud blob (clockwise) */}
                <div 
                    className="absolute inset-[-15%] opacity-85 mix-blend-screen filter blur-[9px]"
                    style={{
                        background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.95) 0%, rgba(200,210,225,0.7) 35%, rgba(120,135,160,0.3) 65%, transparent 80%)',
                        animation: 'fluidOrbRotate 11s linear infinite, fluidOrbMorph 8s ease-in-out infinite alternate',
                    }}
                />

                {/* Layer 2: Counter-rotating secondary fluid mist cloud */}
                <div 
                    className="absolute inset-[-10%] opacity-70 mix-blend-screen filter blur-[12px]"
                    style={{
                        background: 'conic-gradient(from 180deg at 55% 55%, rgba(255,255,255,0.85), rgba(180,195,210,0.4), rgba(70,80,95,0.1), rgba(255,255,255,0.85))',
                        animation: 'fluidOrbRotateReverse 14s linear infinite, fluidOrbMorph 10s ease-in-out infinite alternate',
                    }}
                />

                {/* Layer 3: Dynamic reaction core color */}
                {isAction && (
                    <div 
                        className="absolute inset-2 rounded-full mix-blend-overlay opacity-60 filter blur-[8px] bg-amber-400 animate-pulse"
                    />
                )}
                {isThinking && (
                    <div 
                        className="absolute inset-2 rounded-full mix-blend-overlay opacity-60 filter blur-[8px] bg-violet-400 animate-pulse"
                    />
                )}

                {/* Layer 4: Glass specular spherical reflection highlight */}
                <div 
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 32% 25%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%, transparent 65%)',
                        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -6px 14px rgba(0,0,0,0.7)'
                    }}
                />

                {/* Center 3-Dot Badge (...) - Exactly like the ChatGPT voice orb */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-black/75 backdrop-blur-md border border-white/15 flex items-center justify-center gap-[3px] shadow-lg">
                        <span 
                            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#fff]"
                            style={{ animation: 'dotPulse 1.2s infinite 0s' }}
                        />
                        <span 
                            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#fff]"
                            style={{ animation: 'dotPulse 1.2s infinite 0.2s' }}
                        />
                        <span 
                            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#fff]"
                            style={{ animation: 'dotPulse 1.2s infinite 0.4s' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Export: Floating Voice Orb Overlay (Non-Blocking) ───────────────────
export default function VoiceMode({ isOpen, onClose, onSendMessage, lastAiMessage, onStopGenerating }) {
    const agent = useVoiceAgent({ onSendMessage, onClose, lastAiMessage });
    const isSidebarCollapsed = useSelector(state => state.chat?.isSidebarCollapsed);

    useEffect(() => {
        if (isOpen) {
            agent.start();
        } else {
            agent.stopAll();
        }
        return () => agent.stopAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    const isListening = agent.status === 'listening';

    const handleClose = () => {
        agent.stopAll();
        if (typeof onStopGenerating === 'function') {
            onStopGenerating();
        }
        if (typeof window !== 'undefined') {
            window.speechSynthesis?.cancel();
            window.dispatchEvent(new CustomEvent("ai_stream_stop"));
        }
        onClose();
    };

    return createPortal(
        <div className={`fixed top-0 bottom-0 right-0 ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-56'} left-0 z-[990] pointer-events-none flex flex-col justify-center items-center select-none transition-[left] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
            {/* FLOATING VOICE ORB + MINIMAL CONTROLS (Centered directly in chat page area excluding sidebar) */}
            <div className="pointer-events-auto flex flex-col items-center transition-all duration-300">
                {/* Live Real-Time Spoken Transcript / Status Pill */}
                {agent.transcript ? (
                    <div className="max-w-md px-4 py-2 mb-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/15 text-xs sm:text-sm text-zinc-100 shadow-2xl text-center italic animate-in fade-in zoom-in-95">
                        “{agent.transcript}”
                    </div>
                ) : agent.feedback && agent.status !== 'idle' ? (
                    <div className="px-3.5 py-1 mb-3.5 rounded-full bg-zinc-900/85 backdrop-blur-md border border-white/10 text-[11px] sm:text-xs font-medium text-zinc-300 shadow-xl text-center flex items-center gap-1.5 animate-in fade-in">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>{agent.feedback}</span>
                    </div>
                ) : null}

                {/* The Floating Fluid Nebula Orb with action buttons */}
                <div className="relative flex items-center justify-center">
                    <FluidVoiceOrb 
                        status={agent.status} 
                        onClick={agent.toggleMic} 
                    />

                    {/* Minimal Floating Control Badges attached to the Orb */}
                    <div className="absolute -bottom-4 flex items-center gap-2.5">
                        {/* Mic Mute / Unmute Button */}
                        <button
                            type="button"
                            onClick={agent.toggleMic}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl border border-white/15 ${
                                isListening 
                                    ? 'bg-zinc-900/90 text-white hover:bg-zinc-800' 
                                    : 'bg-rose-500/90 text-white hover:bg-rose-600'
                            }`}
                            title={isListening ? "Mute microphone" : "Unmute microphone"}
                        >
                            {isListening ? (
                                <RiMicLine size={17} />
                            ) : (
                                <RiMicOffLine size={17} />
                            )}
                        </button>

                        {/* Circular Close Button (White circle with dark X) */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 active:scale-90 transition-all cursor-pointer shadow-xl"
                            title="Close voice mode"
                        >
                            <RiCloseLine size={19} className="stroke-[2.5]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
