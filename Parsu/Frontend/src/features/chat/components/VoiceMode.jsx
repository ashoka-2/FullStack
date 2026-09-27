/**
 * VoiceMode — Jarvis-style full-screen voice agent overlay
 * Uses useVoiceAgent hook for all logic.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    RiMicLine, RiMicFill, RiCloseLine, RiVoiceprintLine,
    RiFlashlightLine, RiComputerLine, RiGlobalLine
} from '@remixicon/react';
import { useVoiceAgent } from '../hook/useVoiceAgent';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    idle:      { label: 'Tap mic to speak',    color: 'text-zinc-500',              orb: 'bg-zinc-800' },
    listening: { label: '🎙 Listening…',        color: 'text-rose-400',              orb: 'bg-gradient-to-br from-rose-500/60 to-rose-700/50 shadow-[0_0_70px_20px_rgba(239,68,68,0.4)]' },
    thinking:  { label: '⏳ Thinking…',          color: 'text-violet-400',            orb: 'bg-gradient-to-br from-violet-600/50 to-purple-800/50 shadow-[0_0_40px_10px_rgba(139,92,246,0.3)] animate-pulse' },
    speaking:  { label: '🔊 Parsu is speaking…', color: 'text-[var(--accent-cyan)]',  orb: 'bg-gradient-to-br from-[var(--accent-cyan)]/70 to-blue-600/60 shadow-[0_0_70px_20px_rgba(32,184,205,0.45)]' },
    action:    { label: '⚡ Running action…',    color: 'text-amber-400',             orb: 'bg-gradient-to-br from-amber-500/70 to-orange-600/60 shadow-[0_0_70px_20px_rgba(245,158,11,0.45)]' },
};

// ─── Animated orb ─────────────────────────────────────────────────────────────
function VoiceOrb({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
    const animated = ['listening', 'speaking', 'action'].includes(status);
    const orbColor = animated ? '#20b8cd' : status === 'action' ? '#f59e0b' : status === 'listening' ? '#ef4444' : '#20b8cd';

    return (
        <div className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 select-none">
            {animated && (<>
                <span className="absolute inset-0 rounded-full border animate-ping"
                    style={{ borderColor: `${orbColor}55`, animationDuration: '1.4s' }} />
                <span className="absolute inset-[-10px] rounded-full border animate-ping"
                    style={{ borderColor: `${orbColor}28`, animationDuration: '1.9s', animationDelay: '0.4s' }} />
            </>)}
            <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 scale-${animated ? '105' : '100'} ${cfg.orb}`}>
                <div className="flex items-end gap-[3px] h-10 pb-1">
                    {[...Array(9)].map((_, i) => (
                        <span key={i} className={`w-[3px] rounded-full transition-colors ${animated ? 'bg-white' : 'bg-zinc-600'}`}
                            style={{
                                animation: animated
                                    ? `voiceBar ${0.35 + i * 0.07}s ease-in-out ${(i * 0.05).toFixed(2)}s infinite alternate`
                                    : status === 'thinking'
                                        ? `voiceBar ${0.8 + i * 0.12}s ease-in-out ${(i * 0.08).toFixed(2)}s infinite alternate`
                                        : 'none',
                                height: animated ? undefined : '25%',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Command hint chip ────────────────────────────────────────────────────────
function Chip({ children }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-zinc-500 whitespace-nowrap">
            {children}
        </span>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function VoiceMode({ isOpen, onClose, onSendMessage, lastAiMessage }) {
    const agent = useVoiceAgent({ onSendMessage, onClose, lastAiMessage });
    const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;

    useEffect(() => {
        if (isOpen) {
            agent.speak("J.A.R.V.I.S online. At your service, sir. What can I do for you?", () => agent.startListening());
        } else {
            agent.stopAll();
        }
        return () => agent.stopAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#080a0f]/97 backdrop-blur-lg flex flex-col items-center justify-between px-5 py-8 sm:py-12 animate-in fade-in duration-300">

            {/* ── Header ── */}
            <div className="w-full max-w-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <RiVoiceprintLine size={20} className="text-[var(--accent-cyan)]" />
                    <span className="text-sm font-bold text-white tracking-wide">Parsu Voice</span>
                    <span className="hidden sm:flex text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-semibold items-center gap-1">
                        <RiFlashlightLine size={10} /> Instant Actions
                    </span>
                </div>
                <button
                    onClick={() => { agent.stopAll(); onClose(); }}
                    className="w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                    <RiCloseLine size={18} />
                </button>
            </div>

            {/* ── Orb + Status ── */}
            <div className="flex flex-col items-center gap-5 w-full max-w-sm">
                <VoiceOrb status={agent.status} />

                <p className={`text-sm font-semibold transition-colors duration-300 ${cfg.color}`}>
                    {cfg.label}
                </p>

                {/* Live transcript bubble */}
                {agent.transcript && (
                    <div className="w-full text-center px-4 py-2.5 rounded-2xl bg-zinc-900/70 border border-white/[0.07] text-sm text-zinc-200 italic animate-in fade-in">
                        "{agent.transcript}"
                    </div>
                )}

                {/* Feedback / AI reply / action label */}
                {agent.feedback && !agent.transcript && agent.status !== 'listening' && (
                    <div className={`w-full text-center px-4 py-2.5 rounded-2xl text-sm transition-all animate-in fade-in ${
                        agent.status === 'action'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                            : agent.status === 'speaking' || agent.status === 'thinking'
                                ? 'bg-[var(--accent-cyan)]/[0.07] border border-[var(--accent-cyan)]/20 text-zinc-200'
                                : 'bg-zinc-900/50 border border-white/[0.06] text-zinc-400'
                    }`}>
                        {agent.feedback}
                    </div>
                )}
            </div>

            {/* ── Bottom controls ── */}
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                {/* Mic button */}
                <button
                    onClick={agent.toggleMic}
                    disabled={['thinking', 'speaking', 'action'].includes(agent.status)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed ${
                        agent.status === 'listening'
                            ? 'bg-rose-500 ring-4 ring-rose-500/35 scale-110'
                            : 'bg-white text-black hover:scale-105 active:scale-95'
                    }`}
                    title={agent.status === 'listening' ? 'Tap to stop' : 'Tap to speak'}
                >
                    {agent.status === 'listening'
                        ? <RiMicFill size={26} className="text-white" />
                        : <RiMicLine size={26} />}
                </button>

                {/* Command hints */}
                <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
                    <Chip>"open youtube"</Chip>
                    <Chip>"volume up"</Chip>
                    <Chip>"search weather"</Chip>
                    <Chip>"open notepad"</Chip>
                    <Chip>"go to settings"</Chip>
                    <Chip>"brightness down"</Chip>
                    <Chip>"scroll down"</Chip>
                    <Chip>"stop"</Chip>
                </div>

                {/* Mini conversation history */}
                {agent.history.length > 0 && (
                    <div className="w-full max-h-28 overflow-y-auto space-y-1.5 px-1 custom-scrollbar">
                        {agent.history.slice(-5).map((h, i) => (
                            <div key={i} className={`text-[11px] px-3 py-1.5 rounded-xl max-w-[88%] flex items-start gap-1.5 ${
                                h.role === 'user'
                                    ? 'ml-auto bg-zinc-800/70 text-zinc-300'
                                    : h.role === 'action'
                                        ? 'mr-auto bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                        : 'mr-auto bg-[var(--accent-cyan)]/10 text-zinc-300 border border-[var(--accent-cyan)]/20'
                            }`}>
                                {h.role === 'action' && <RiFlashlightLine size={11} className="text-amber-400 shrink-0 mt-0.5" />}
                                {h.role === 'ai' && <RiVoiceprintLine size={11} className="text-[var(--accent-cyan)] shrink-0 mt-0.5" />}
                                {h.role === 'action' || h.role === 'ai' ? (
                                    <span>{h.content.length > 70 ? h.content.slice(0, 70) + '…' : h.content}</span>
                                ) : (
                                    <span>{h.content.length > 70 ? h.content.slice(0, 70) + '…' : h.content}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                    <span className="flex items-center gap-1"><RiComputerLine size={11} /> Desktop controls</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><RiGlobalLine size={11} /> Web actions</span>
                    <span>·</span>
                    <span>Say "stop" to exit</span>
                </div>
            </div>
        </div>,
        document.body
    );
}
