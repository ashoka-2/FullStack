/**
 * useVoiceAgent — The Parsu Jarvis brain
 *
 * Responsibilities:
 *  1. STT (Speech Recognition) → transcript
 *  2. Intent resolution — instant browser actions vs AI call
 *  3. Device command dispatch via /api/devices/execute
 *  4. AI call via onSendMessage prop
 *  5. TTS (SpeechSynthesis) response readback
 *  6. Continuous conversation loop
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import { executeDeviceCommandApi } from '../../device/service/device.api';

// ─── Instant browser-only site map ───────────────────────────────────────────
const SITE_MAP = {
    youtube: 'https://youtube.com',
    google: 'https://google.com',
    github: 'https://github.com',
    gmail: 'https://mail.google.com',
    twitter: 'https://x.com',
    x: 'https://x.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    whatsapp: 'https://web.whatsapp.com',
    maps: 'https://maps.google.com',
    'google maps': 'https://maps.google.com',
    netflix: 'https://netflix.com',
    amazon: 'https://amazon.in',
    flipkart: 'https://flipkart.com',
    wikipedia: 'https://wikipedia.org',
    stackoverflow: 'https://stackoverflow.com',
    reddit: 'https://reddit.com',
    chatgpt: 'https://chat.openai.com',
    gemini: 'https://gemini.google.com',
    translate: 'https://translate.google.com',
    news: 'https://news.google.com',
    weather: 'https://weather.com',
};

const APP_ROUTES = {
    settings: '/settings',
    library: '/settings/library',
    devices: '/settings/devices',
    chat: '/chat',
    'new chat': '/chat',
    home: '/',
    admin: '/admin',
    social: '/social',
    billing: '/settings/billing',
    profile: '/settings/profile',
};

// Desktop apps that will be sent to the backend device executor
const DESKTOP_APPS = {
    notepad: 'notepad.exe',
    calculator: 'calc.exe',
    paint: 'mspaint.exe',
    explorer: 'explorer.exe',
    files: 'explorer.exe',
    'file explorer': 'explorer.exe',
    terminal: 'cmd.exe',
    'command prompt': 'cmd.exe',
    powershell: 'powershell.exe',
    chrome: 'chrome',
    firefox: 'firefox',
    edge: 'msedge',
    vlc: 'vlc',
    vscode: 'code',
    'visual studio code': 'code',
    word: 'winword.exe',
    excel: 'excel.exe',
    powerpoint: 'powerpnt.exe',
    teams: 'Teams.exe',
    zoom: 'Zoom.exe',
    discord: 'Discord.exe',
    whatsapp: 'WhatsApp.exe',
    telegram: 'Telegram.exe',
    photoshop: 'photoshop.exe',
    camera: 'microsoft.windows.camera:',
    settings: 'ms-settings:',
    'task manager': 'taskmgr.exe',
    taskmgr: 'taskmgr.exe',
    clock: 'ms-clock:',
};

/**
 * Resolve user transcript or message text to an action descriptor.
 * Returns null → send to AI
 */
export function resolveIntent(text) {
    if (!text || typeof text !== 'string') return null;
    let t = text.toLowerCase().trim().replace(/[.,!?]+$/, '');

    // ── Target device selector (mobile / desktop / tablet) ──
    let targetSelector = null;
    if (/\b(?:on|in)\s+(?:mobile|phone|android|iphone|companion)\b/i.test(t)) {
        targetSelector = 'mobile';
        t = t.replace(/\b(?:on|in)\s+(?:mobile|phone|android|iphone|companion)\b/i, '').trim();
    } else if (/\b(?:on|in)\s+(?:desktop|pc|computer|laptop|windows)\b/i.test(t)) {
        targetSelector = 'desktop';
        t = t.replace(/\b(?:on|in)\s+(?:desktop|pc|computer|laptop|windows)\b/i, '').trim();
    } else if (/\b(?:on|in)\s+(?:tablet|ipad)\b/i.test(t)) {
        targetSelector = 'tablet';
        t = t.replace(/\b(?:on|in)\s+(?:tablet|ipad)\b/i, '').trim();
    }

    // ── Stop/close ──
    if (/^(stop|exit|close voice|cancel|dismiss|goodbye|bye)$/i.test(t)) {
        return { type: 'close' };
    }

    // ── Volume (desktop + mobile + browser) ──
    if (t === 'mute') return { type: 'device_cmd', targetSelector, action: 'set_volume', params: { level: 0, targetSelector }, label: 'Muting audio' };
    if (t === 'unmute') return { type: 'device_cmd', targetSelector, action: 'set_volume', params: { level: 50, targetSelector }, label: 'Unmuting audio' };
    if (/(?:increase|raise|turn up|boost)\s+volume|volume\s*up/i.test(t)) {
        return { type: 'device_cmd', targetSelector, action: 'set_volume', params: { delta: +15, targetSelector }, label: 'Volume up (+15%)' };
    }
    if (/(?:decrease|lower|reduce|turn down)\s+volume|volume\s*down/i.test(t)) {
        return { type: 'device_cmd', targetSelector, action: 'set_volume', params: { delta: -15, targetSelector }, label: 'Volume down (-15%)' };
    }
    const volMatch = t.match(/(?:set |change )?volume\s*(?:to\s*)?(\d+)%?/i);
    if (volMatch) {
        const level = parseInt(volMatch[1], 10);
        return { type: 'device_cmd', targetSelector, action: 'set_volume', params: { level, targetSelector }, label: `Volume ${level}%` };
    }

    // ── Brightness (desktop + mobile) ──
    if (/(?:increase|raise|turn up|boost)\s+brightness|brightness\s*up/i.test(t)) {
        return { type: 'device_cmd', targetSelector, action: 'set_brightness', params: { delta: +15, targetSelector }, label: 'Brightness up (+15%)' };
    }
    if (/(?:decrease|lower|reduce|dim|turn down)\s+brightness|brightness\s*down/i.test(t)) {
        return { type: 'device_cmd', targetSelector, action: 'set_brightness', params: { delta: -15, targetSelector }, label: 'Brightness down (-15%)' };
    }
    const briMatch = t.match(/(?:set |change )?brightness\s*(?:to\s*)?(\d+)%?/i);
    if (briMatch) {
        const level = parseInt(briMatch[1], 10);
        return { type: 'device_cmd', targetSelector, action: 'set_brightness', params: { level, targetSelector }, label: `Brightness ${level}%` };
    }

    // ── Screenshot ──
    if (/take\s*(?:a\s*)?screenshot|screenshot/i.test(t)) {
        return { type: 'device_cmd', targetSelector, action: 'capture_screenshot', params: { targetSelector }, label: 'Taking screenshot' };
    }

    // ── Close desktop app ──
    const closeAppMatch = t.match(/^close\s+(.+)/i);
    if (closeAppMatch) {
        const target = closeAppMatch[1].trim();
        for (const [name, exe] of Object.entries(DESKTOP_APPS)) {
            if (target === name || target.includes(name)) {
                return { type: 'device_cmd', targetSelector, action: 'close_process', params: { processIdOrName: exe.replace('.exe', ''), targetSelector }, label: `Closing ${name}` };
            }
        }
    }

    // ── Open desktop/mobile app ──
    for (const [name, exe] of Object.entries(DESKTOP_APPS)) {
        if (t.includes(`open ${name}`) || t.includes(`launch ${name}`) || t.includes(`start ${name}`) || t === `open ${name}`) {
            return { type: 'device_cmd', targetSelector, action: 'launch_app', params: { appOrPath: exe, targetSelector }, label: `Opening ${name}` };
        }
    }

    // ── Navigate internal routes ──
    for (const [key, route] of Object.entries(APP_ROUTES)) {
        if (t === key || t === `open ${key}` || t === `go to ${key}` || t === `navigate to ${key}`) {
            return { type: 'navigate', route, label: key };
        }
    }

    // ── Search inside specific website (e.g. "search cats on youtube", "search shoes on amazon") ──
    const siteSearchMatch = t.match(/^(?:search|find|look up)\s+(.+?)\s+(?:on|in)\s+([a-zA-Z0-9_-]+)$/i);
    if (siteSearchMatch) {
        const query = siteSearchMatch[1].trim();
        const siteKey = siteSearchMatch[2].toLowerCase().trim();
        const qEnc = encodeURIComponent(query);
        if (siteKey === 'youtube') return { type: 'open_url', url: `https://youtube.com/search?q=${qEnc}`, label: `YouTube: "${query}"` };
        if (siteKey === 'google') return { type: 'open_url', url: `https://google.com/search?q=${qEnc}`, label: `Google: "${query}"` };
        if (siteKey === 'github') return { type: 'open_url', url: `https://github.com/search?q=${qEnc}`, label: `GitHub: "${query}"` };
        if (siteKey === 'amazon') return { type: 'open_url', url: `https://amazon.in/s?k=${qEnc}`, label: `Amazon: "${query}"` };
        if (siteKey === 'wikipedia') return { type: 'open_url', url: `https://wikipedia.org/wiki/Special:Search?search=${qEnc}`, label: `Wikipedia: "${query}"` };
        if (siteKey === 'netflix') return { type: 'open_url', url: `https://netflix.com/search?q=${qEnc}`, label: `Netflix: "${query}"` };
        if (siteKey === 'twitter' || siteKey === 'x') return { type: 'open_url', url: `https://x.com/search?q=${qEnc}`, label: `X: "${query}"` };
        if (siteKey === 'reddit') return { type: 'open_url', url: `https://reddit.com/search/?q=${qEnc}`, label: `Reddit: "${query}"` };
    }

    // ── Open known website ──
    for (const [name, url] of Object.entries(SITE_MAP)) {
        if (t === name || t === `open ${name}` || t === `go to ${name}` || t === `launch ${name}`) {
            return { type: 'open_url', url, label: name };
        }
    }

    // ── Open any explicit URL ──
    const openUrlMatch = t.match(/^(?:open|go to|navigate to)\s+(https?:\/\/\S+|[\w-]+\.\w{2,6}\S*)/i);
    if (openUrlMatch) {
        const raw = openUrlMatch[1];
        const url = raw.startsWith('http') ? raw : `https://${raw}`;
        return { type: 'open_url', url, label: raw };
    }

    // ── Web search ──
    const searchMatch = t.match(/^(?:search|find|google|look up|search for)\s+(.+)/i);
    if (searchMatch) {
        const q = encodeURIComponent(searchMatch[1]);
        return { type: 'open_url', url: `https://google.com/search?q=${q}`, label: `Searching "${searchMatch[1]}"` };
    }

    // ── YouTube search ──
    const ytMatch = t.match(/^(?:play|search youtube|youtube search|search on youtube)\s+(.+)/i);
    if (ytMatch) {
        const q = encodeURIComponent(ytMatch[1]);
        return { type: 'open_url', url: `https://youtube.com/search?q=${q}`, label: `YouTube: "${ytMatch[1]}"` };
    }

    // ── Scroll ──
    if (t.includes('scroll down') || t === 'down' || t === 'scroll down more') return { type: 'scroll', by: 500 };
    if (t.includes('scroll up') || t === 'up') return { type: 'scroll', by: -500 };
    if (t.includes('scroll to top') || t === 'top' || t === 'scroll top') return { type: 'scroll', to: 'top' };
    if (t.includes('scroll to bottom') || t === 'bottom' || t === 'scroll bottom') return { type: 'scroll', to: 'bottom' };

    // ── Clipboard ──
    if (t.includes('copy') && (t.includes('last response') || t.includes('response'))) return { type: 'clipboard_last' };

    // ── New chat ──
    if (t === 'new chat' || t === 'start new chat') return { type: 'navigate', route: '/chat', label: 'New Chat' };

    return null; // → AI
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useVoiceAgent({ onSendMessage, onClose, lastAiMessage }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [status, setStatus] = useState('idle');
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('');
    const [history, setHistory] = useState([]);

    const recognitionRef = useRef(null);
    const stoppedRef = useRef(false);
    const latestTranscript = useRef('');

    // ─── TTS ─────────────────────────────────────────────────────────────────
    const speak = useCallback((text, onDone) => {
        if (!text || !window.speechSynthesis) { onDone?.(); return; }
        window.speechSynthesis.cancel();

        // Chunk long text for better TTS naturalness
        const MAX_CHUNK = 200;
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks = [];
        let cur = '';
        for (const s of sentences) {
            if ((cur + s).length > MAX_CHUNK && cur) { chunks.push(cur.trim()); cur = s; }
            else cur += s;
        }
        if (cur.trim()) chunks.push(cur.trim());

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v =>
            (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('neural')) && v.lang.startsWith('en')
        ) || voices.find(v => v.lang === 'en-US') || voices[0];

        let idx = 0;
        const next = () => {
            if (idx >= chunks.length || stoppedRef.current) { setStatus('idle'); onDone?.(); return; }
            const utt = new SpeechSynthesisUtterance(chunks[idx++]);
            utt.voice = voice || null;
            utt.rate = 1.08;
            utt.pitch = 1;
            utt.volume = 1;
            if (idx === 1) { utt.onstart = () => setStatus('speaking'); }
            utt.onend = next;
            utt.onerror = () => { setStatus('idle'); onDone?.(); };
            window.speechSynthesis.speak(utt);
        };
        next();
    }, []);

    // ─── Execute device command via backend ───────────────────────────────────
    const executeDeviceCommand = useCallback(async (action, params, label, targetSelector = null) => {
        try {
            setStatus('action');
            setFeedback(label + '…');
            const data = await executeDeviceCommandApi({
                targetSelector: targetSelector || params?.targetSelector || null,
                action,
                params,
                confirmed: true, // auto-confirm for voice commands
            });
            return data;
        } catch (err) {
            dispatch(addToast({ type: 'warning', message: `Device: ${err?.response?.data?.message || err.message}` }));
            return null;
        }
    }, [dispatch]);

    // ─── Handle resolved intent ───────────────────────────────────────────────
    const handleIntent = useCallback(async (intent, rawText) => {
        if (!intent) {
            // Send to AI
            setStatus('thinking');
            setFeedback('Thinking…');
            setHistory(p => [...p, { role: 'user', content: rawText }]);
            try {
                const reply = await onSendMessage(rawText);
                if (reply && !stoppedRef.current) {
                    setHistory(p => [...p, { role: 'ai', content: reply }]);
                    setFeedback(reply.length > 80 ? reply.slice(0, 80) + '…' : reply);
                    speak(reply, () => { if (!stoppedRef.current) startListening(); });
                } else {
                    setStatus('idle');
                    setFeedback('Tap mic to speak');
                    setTimeout(() => { if (!stoppedRef.current) startListening(); }, 400);
                }
            } catch {
                setStatus('idle');
                setFeedback('Error — tap mic to retry');
            }
            return;
        }

        const { type, label = '' } = intent;

        if (type === 'close') {
            speak('Closing.', () => { stoppedRef.current = true; onClose(); });
            return;
        }

        if (type === 'navigate') {
            setStatus('action'); setFeedback(`Opening ${label}…`);
            setHistory(p => [...p, { role: 'action', content: `→ ${label}` }]);
            speak(`Opening ${label}.`, () => {
                navigate(intent.route);
                setTimeout(() => { if (!stoppedRef.current) startListening(); }, 800);
            });
            return;
        }

        if (type === 'open_url') {
            setStatus('action'); setFeedback(label);
            setHistory(p => [...p, { role: 'action', content: `🌐 ${label}` }]);
            speak(`Opening ${label}.`, () => {
                window.open(intent.url, '_blank', 'noopener,noreferrer');
                setTimeout(() => { if (!stoppedRef.current) startListening(); }, 600);
            });
            return;
        }

        if (type === 'scroll') {
            if (intent.to === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
            else if (intent.to === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            else window.scrollBy({ top: intent.by, behavior: 'smooth' });
            speak('Done.', () => { if (!stoppedRef.current) startListening(); });
            return;
        }

        if (type === 'clipboard_last') {
            const text = lastAiMessage || '';
            if (text) { navigator.clipboard.writeText(text); speak('Copied the last response.', () => { if (!stoppedRef.current) startListening(); }); }
            else speak('No response to copy.', () => { if (!stoppedRef.current) startListening(); });
            return;
        }

        if (type === 'device_cmd') {
            setHistory(p => [...p, { role: 'action', content: `⚡ ${label}` }]);
            const result = await executeDeviceCommand(intent.action, intent.params, label, intent.targetSelector);
            const msg = result?.success !== false ? `Done. ${label}.` : `Could not complete: ${label}.`;
            speak(msg, () => { if (!stoppedRef.current) startListening(); });
            return;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onSendMessage, speak, navigate, onClose, executeDeviceCommand, lastAiMessage]);

    // ─── STT ─────────────────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR || stoppedRef.current) return;

        try {
            const rec = new SR();
            rec.continuous = false;
            rec.interimResults = true;
            rec.lang = navigator.language || 'en-IN';
            latestTranscript.current = '';

            rec.onstart = () => { setStatus('listening'); setFeedback('Listening…'); setTranscript(''); };

            rec.onresult = (e) => {
                let final = '', interim = '';
                for (let i = 0; i < e.results.length; i++) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                    else interim += e.results[i][0].transcript;
                }
                const spoken = final || interim;
                latestTranscript.current = spoken;
                setTranscript(spoken);
            };

            rec.onend = () => {
                if (stoppedRef.current) return;
                const spoken = latestTranscript.current.trim();
                setTranscript('');
                if (spoken) {
                    const intent = resolveIntent(spoken);
                    handleIntent(intent, spoken);
                } else {
                    // No speech — auto-retry after brief pause
                    setTimeout(() => { if (!stoppedRef.current) startListening(); }, 500);
                }
            };

            rec.onerror = (e) => {
                if (e.error === 'no-speech') {
                    setTimeout(() => { if (!stoppedRef.current) startListening(); }, 400);
                } else {
                    if (e.error !== 'aborted') dispatch(addToast({ type: 'error', message: `Mic: ${e.error}` }));
                    setStatus('idle');
                }
            };

            recognitionRef.current = rec;
            rec.start();
        } catch (err) {
            console.error('STT error:', err);
            setStatus('idle');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleIntent, dispatch]);

    const stopAll = useCallback(() => {
        stoppedRef.current = true;
        try { recognitionRef.current?.stop(); } catch {}
        recognitionRef.current = null;
        window.speechSynthesis?.cancel();
        setStatus('idle');
        setTranscript('');
        setFeedback('');
    }, []);

    const toggleMic = useCallback(() => {
        if (status === 'listening') {
            recognitionRef.current?.stop();
        } else if (status === 'idle') {
            stoppedRef.current = false;
            startListening();
        }
    }, [status, startListening]);

    return {
        status,
        transcript,
        feedback,
        history,
        startListening,
        stopAll,
        toggleMic,
        speak,
        setHistory,
    };
}
