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
    'whatsapp web': 'https://web.whatsapp.com',
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
    whatsapp: 'whatsapp',
    spotify: 'spotify',
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

    // ── System shortcuts (media keys, lock, show desktop, etc.) ──
    const SHORTCUTS = [
        [/^(?:pause|resume|play\/pause|play pause)(?:\s+(?:the\s+)?(?:music|song|media|video|track))?$/, 'play_pause', 'Play / pause'],
        [/^(?:next|skip)(?:\s+(?:the\s+)?(?:song|track|music))?$/, 'next_track', 'Next track'],
        [/^(?:previous|prev|go back)\s*(?:song|track)?$/, 'prev_track', 'Previous track'],
        [/^lock(?:\s+(?:the\s+)?(?:screen|pc|computer|laptop|windows))?$/, 'lock', 'Locking screen'],
        [/^(?:show desktop|minimi[sz]e all(?: windows)?)$/, 'show_desktop', 'Showing desktop'],
        [/^(?:task view|show all windows)$/, 'task_view', 'Task view'],
        [/^(?:switch window|alt tab)$/, 'switch_window', 'Switching window'],
        [/^close (?:this |the )?(?:window|tab)$/, 'close_window', 'Closing window'],
        [/^(?:snip|snipping tool)$/, 'snip', 'Snipping tool'],
    ];
    for (const [re, shortcut, label] of SHORTCUTS) {
        if (re.test(t)) {
            return { type: 'device_cmd', targetSelector, action: 'system_shortcut', params: { shortcut, targetSelector }, label };
        }
    }

    // ── Compound: "open <app> and play/search <thing>" or "play <thing> on/in <app>" ──
    // The app is opened normally, then the query is searched INSIDE the app (never typed into Windows search).
    const compoundMatch =
        t.match(/^(?:open|launch|start)\s+(?:the\s+)?([a-z0-9 .]+?)(?:\s+app)?\s+(?:and|then|&)\s+(?:play|search(?:\s+for)?|find|look\s+for)\s+(.+)$/i) ||
        t.match(/^(?:play|search|find)\s+(.+?)\s+(?:on|in|using)\s+([a-z0-9 .]+?)(?:\s+app)?$/i);
    if (compoundMatch) {
        const swapped = !/^(?:open|launch|start)\s/i.test(t);
        const appName = (swapped ? compoundMatch[2] : compoundMatch[1]).trim().toLowerCase();
        let query = (swapped ? compoundMatch[1] : compoundMatch[2]).trim();
        query = query.replace(/\s+(?:song|songs|music|track|video|videos)$/i, '').replace(/^(?:the\s+)?(?:song|songs|music|track)\s+/i, '').trim() || query;
        const q = encodeURIComponent(query);
        if (swapped && !/^(?:spotify|apple music|vlc|youtube|google|amazon|discord|slack|telegram|notepad|word|excel|chrome|edge|firefox)$/.test(appName)) {
            // not a known app → let other rules / the AI handle it (e.g. "find a cafe in bangalore")
        } else if (appName === 'youtube') return { type: 'open_url', url: `https://youtube.com/results?search_query=${q}`, label: `YouTube: "${query}"` };
        if (appName === 'google') return { type: 'open_url', url: `https://google.com/search?q=${q}`, label: `Google: "${query}"` };
        if (appName === 'amazon') return { type: 'open_url', url: `https://amazon.in/s?k=${q}`, label: `Amazon: "${query}"` };
        if (appName !== 'whatsapp') {
            return {
                type: 'device_cmd', targetSelector, action: 'app_search',
                params: { app: appName, query, targetSelector },
                label: `Searching "${query}" in ${appName}`
            };
        }
    }

    // ── Calendar event scheduling & opening ──
    const calMatch = t.match(/^(?:add|schedule|create|put)\s+(?:event|meeting|reminder|task)?\s*(.+?)\s*(?:to|in|on)?\s*calendar$/i) ||
                     t.match(/^(?:add|schedule|create)\s+(?:to|in)?\s*calendar\s*:?\s*(.+)$/i);
    if (calMatch) {
        const title = calMatch[1].trim();
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`;
        return { type: 'open_url', url, label: `Calendar event "${title}"` };
    }
    if (t === 'calendar' || t === 'open calendar' || t === 'view calendar') {
        return { type: 'open_url', url: 'https://calendar.google.com', label: 'Google Calendar' };
    }

    // ── Close desktop app ──
    const closeAppMatch = t.match(/^(?:close|quit|kill|exit)\s+(?:the\s+)?([a-zA-Z0-9_\-\s.]+?)(?:\s+app)?$/i);
    if (closeAppMatch) {
        const target = closeAppMatch[1].trim();
        const exe = DESKTOP_APPS[target.toLowerCase()] || target;
        return { type: 'device_cmd', targetSelector, action: 'close_process', params: { processIdOrName: exe.replace('.exe', ''), targetSelector }, label: `Closing ${target}` };
    }

    // ── WhatsApp messaging commands (desktop app first; multi-word contact names or phone numbers) ──
    const orig = text.trim().replace(/[.,!?]+$/, '');
    const restoreCase = (s) => {
        const i = orig.toLowerCase().indexOf(s.toLowerCase());
        return i >= 0 ? orig.substr(i, s.length) : s;
    };
    const waIntent = (contact, message) => ({
        type: 'device_cmd',
        targetSelector,
        action: 'whatsapp_message',
        params: { contactOrPhone: contact ? contact.trim() : null, message: restoreCase(message.trim()), targetSelector },
        label: contact ? `WhatsApp → ${contact.trim()}` : 'WhatsApp message to the open chat'
    });

    // "[open whatsapp and] send [a] [whatsapp] message to <contact> saying/that/: <message>"
    // "[open whatsapp and] message|text <contact> saying/that/: <message>"
    const waNamed = t.match(/^(?:open\s+whatsapp\s+(?:and\s+)?)?(?:send\s+(?:a\s+)?(?:whatsapp\s+)?(?:message|msg|text)\s+to|message|text|whatsapp)\s+(.+?)\s*(?:\bsaying\b|\bthat\b|\bwith message\b|\bmessage\b|:)\s*:?\s*(.+?)(?:\s+(?:on|in)\s+whatsapp)?$/i);
    if (waNamed && (/whatsapp/.test(t) || /^send\s/.test(t)) && !/^in\s+whatsapp/.test(t)) return waIntent(waNamed[1], waNamed[2]);

    // "send [a] message <message> to <contact> [on whatsapp]"
    const waMsgFirst = t.match(/^(?:open\s+whatsapp\s+(?:and\s+)?)?send\s+(?:a\s+)?(?:whatsapp\s+)?(?:message|msg|text)\s+(?!to\s)(.+?)\s+to\s+(.+?)(?:\s+(?:on|in)\s+whatsapp)?$/i);
    if (waMsgFirst) return waIntent(waMsgFirst[2], waMsgFirst[1]);

    // Single-word contact without delimiter: "open whatsapp and message rahul hi there"
    const waOpenSendMatch = t.match(/^(?:open\s+whatsapp\s+(?:and\s+)?(?:send\s+(?:a\s+)?message\s+(?:to\s+)?|message\s+))([a-zA-Z0-9_+]+)\s+(?:saying\s+|that\s+|message\s+:?\s*)?(.+)$/i);
    if (waOpenSendMatch) return waIntent(waOpenSendMatch[1], waOpenSendMatch[2]);

    // e.g. "send [a] [whatsapp] message [to] <person> [saying/with] <message>"
    const waSendToMatch = t.match(/^(?:send\s+(?:a\s+)?(?:whatsapp\s+)?message\s+(?:to\s+)?([a-zA-Z0-9_+]+)\s+(?:saying\s+|with\s+|message\s+:?\s*)?(.+?)(?:\s+on\s+whatsapp)?)$/i) ||
                          t.match(/^(?:message|tell)\s+([a-zA-Z0-9_+]+)\s+(?:that\s+|saying\s+)?(.+?)\s+on\s+whatsapp$/i);
    if (waSendToMatch) {
        const contactOrPhone = waSendToMatch[1].trim();
        const message = waSendToMatch[2].trim();
        return {
            type: 'device_cmd',
            targetSelector,
            action: 'whatsapp_message',
            params: { contactOrPhone, message, targetSelector },
            label: `Sending WhatsApp to ${contactOrPhone}: "${message}"`
        };
    }

    // e.g. "in whatsapp send message <message>" or "send message <message> in whatsapp" (current active chat)
    const waCurrentChatMatch = t.match(/^(?:in\s+whatsapp\s+send\s+(?:a\s+)?message\s+:?\s*(.+)|send\s+(?:a\s+)?message\s+:?\s*(.+?)\s+in\s+whatsapp)$/i);
    if (waCurrentChatMatch) {
        const message = (waCurrentChatMatch[1] || waCurrentChatMatch[2]).trim();
        return {
            type: 'device_cmd',
            targetSelector,
            action: 'whatsapp_message',
            params: { contactOrPhone: null, message, targetSelector },
            label: `Sending WhatsApp message: "${message}"`
        };
    }

    // ── Type in specific app: "type <text> in <app>" or "write <text> in <app>" ──
    const typeInAppMatch = t.match(/^(?:type|write|insert|put)\s+["']?(.+?)["']?\s+(?:in|into|on)\s+([a-zA-Z0-9_\-\s.]+?)(?:\s+(?:app|window|file))?$/i);
    if (typeInAppMatch) {
        const text = typeInAppMatch[1].trim();
        const app = typeInAppMatch[2].trim();
        const exe = DESKTOP_APPS[app.toLowerCase()] || app;
        return { 
            type: 'device_cmd', 
            targetSelector, 
            action: 'type_text', 
            params: { text, targetApp: exe, pressEnter: false, targetSelector }, 
            label: `Typing "${text}" in ${app}` 
        };
    }

    // ── "in <app> type/write <text>" ──
    const inAppTypeMatch = t.match(/^(?:in|into|on)\s+([a-zA-Z0-9_\-\s.]+?)\s+(?:app\s+)?(?:type|write|insert)\s+["']?(.+?)["']?$/i);
    if (inAppTypeMatch) {
        const app = inAppTypeMatch[1].trim();
        const text = inAppTypeMatch[2].trim();
        const exe = DESKTOP_APPS[app.toLowerCase()] || app;
        return { 
            type: 'device_cmd', 
            targetSelector, 
            action: 'type_text', 
            params: { text, targetApp: exe, pressEnter: false, targetSelector }, 
            label: `Typing "${text}" in ${app}` 
        };
    }

    // ── Generic type into active window: "type <text>" or "write <text>" ──
    const typeGenericMatch = t.match(/^(?:type|write)\s+["']?(.+?)["']?$/i);
    if (typeGenericMatch && !t.startsWith('type of') && !t.startsWith('type in ') && !t.startsWith('type into ')) {
        const text = typeGenericMatch[1].trim();
        return { 
            type: 'device_cmd', 
            targetSelector, 
            action: 'type_text', 
            params: { text, targetApp: null, pressEnter: false, targetSelector }, 
            label: `Typing "${text}"` 
        };
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

    // ── Open known website directly ──
    for (const [name, url] of Object.entries(SITE_MAP)) {
        if (t === name || t === `open ${name}` || t === `go to ${name}` || t === `launch ${name}`) {
            return { type: 'open_url', url, label: name };
        }
    }

    // ── Navigate internal routes ──
    for (const [key, route] of Object.entries(APP_ROUTES)) {
        if (t === key || t === `open ${key}` || t === `go to ${key}` || t === `navigate to ${key}`) {
            return { type: 'navigate', route, label: key };
        }
    }

    // ── Universal App / Website / Route open (including apps searched via Windows Searchbar) ──
    const openGenericMatch = t.match(/^(?:open|launch|start)\s+(?:the\s+)?([a-zA-Z0-9_\-\s.]+?)(?:\s+app)?$/i);
    if (openGenericMatch) {
        const rawName = openGenericMatch[1].trim().toLowerCase();
        // Do not greedily treat multi-clause sentences or actions as single app names
        if (rawName.includes(' and ') || rawName.includes(' then ') || rawName.split(/\s+/).length > 4) {
            return null;
        }
        if (APP_ROUTES[rawName]) {
            return { type: 'navigate', route: APP_ROUTES[rawName], label: rawName };
        }
        if (SITE_MAP[rawName]) {
            return { type: 'open_url', url: SITE_MAP[rawName], label: rawName };
        }
        // Generic app launch
        const exe = DESKTOP_APPS[rawName] || rawName;
        return { type: 'device_cmd', targetSelector, action: 'launch_app', params: { appOrPath: exe, targetSelector }, label: `Opening ${rawName}` };
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
    const startListeningRef = useRef(null);

    // Real-time Streaming Speech Queue Refs
    const speechQueueRef = useRef([]);
    const isSpeakingRef = useRef(false);
    const streamingBufferRef = useRef('');
    const isStreamingRef = useRef(false);

    // Clean markdown code blocks, links, and formatting symbols before speech synthesis
    const cleanForSpeech = (str) => {
        return String(str || '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/[*_#`~>]/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // ─── Active Voice Resolution from Settings ───────────────────────────────
    const getActiveVoiceConfig = useCallback(() => {
        const savedVoiceURI = localStorage.getItem('parsu_tts_voice');
        const savedRate = parseFloat(localStorage.getItem('parsu_tts_rate') || '1');
        const savedPitch = parseFloat(localStorage.getItem('parsu_tts_pitch') || '1');
        const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];

        const isCharon = savedVoiceURI === 'charon_jarvis' || !savedVoiceURI;

        if (isCharon) {
            // Charon Jarvis: Deep, poised, confident British butler / AI assistant
            const jarvisVoice = voices.find(v => (v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural')) && v.lang.startsWith('en'))
                || voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US'))
                || voices[0];
            return {
                voice: jarvisVoice || null,
                rate: savedRate !== 1 ? savedRate : 1.05,
                pitch: savedPitch !== 1 ? savedPitch : 0.92,
            };
        }

        const matchedVoice = voices.find(v => v.voiceURI === savedVoiceURI || v.name === savedVoiceURI);
        return {
            voice: matchedVoice || voices[0] || null,
            rate: savedRate,
            pitch: savedPitch,
        };
    }, []);

    // ─── Speech Queue Worker ─────────────────────────────────────────────────
    const processSpeechQueue = useCallback(() => {
        if (isSpeakingRef.current || stoppedRef.current) return;
        if (speechQueueRef.current.length === 0) {
            if (!isStreamingRef.current) {
                setStatus('idle');
                if (!stoppedRef.current) {
                    startListeningRef.current?.();
                }
            }
            return;
        }

        const nextSentence = speechQueueRef.current.shift();
        if (!nextSentence || !window.speechSynthesis) {
            processSpeechQueue();
            return;
        }

        const { voice, rate, pitch } = getActiveVoiceConfig();
        const utt = new SpeechSynthesisUtterance(nextSentence);
        utt.voice = voice;
        utt.rate = rate;
        utt.pitch = pitch;
        utt.volume = 1;

        utt.onstart = () => {
            isSpeakingRef.current = true;
            setStatus('speaking');
        };

        utt.onend = () => {
            isSpeakingRef.current = false;
            processSpeechQueue();
        };

        utt.onerror = () => {
            isSpeakingRef.current = false;
            processSpeechQueue();
        };

        window.speechSynthesis.speak(utt);
    }, [getActiveVoiceConfig]);

    // ─── Listen for Real-Time Streaming Chunks from Backend ───────────────────
    useEffect(() => {
        const handleChunk = (e) => {
            if (!isStreamingRef.current || stoppedRef.current) return;
            const chunk = e.detail || '';
            streamingBufferRef.current += chunk;

            // Extract completed sentence boundaries (. ! ? or newline)
            const match = streamingBufferRef.current.match(/^([\s\S]*?[.!?\n]+)([\s\S]*)$/);
            if (match) {
                const completeSentence = match[1];
                streamingBufferRef.current = match[2];
                const clean = cleanForSpeech(completeSentence);
                if (clean.length > 2) {
                    speechQueueRef.current.push(clean);
                    processSpeechQueue();
                }
            }
        };

        window.addEventListener('ai_stream_chunk', handleChunk);
        return () => window.removeEventListener('ai_stream_chunk', handleChunk);
    }, [processSpeechQueue]);

    // ─── Direct TTS speak helper (for greetings & actions) ─────────────────────
    const speak = useCallback((text, onDone) => {
        if (!text || !window.speechSynthesis) { onDone?.(); return; }
        window.speechSynthesis.cancel();
        speechQueueRef.current = [];
        isSpeakingRef.current = false;
        isStreamingRef.current = false;

        const clean = cleanForSpeech(text);
        const { voice, rate, pitch } = getActiveVoiceConfig();
        const utt = new SpeechSynthesisUtterance(clean);
        utt.voice = voice;
        utt.rate = rate;
        utt.pitch = pitch;
        utt.volume = 1;

        utt.onstart = () => {
            isSpeakingRef.current = true;
            setStatus('speaking');
        };
        utt.onend = () => {
            isSpeakingRef.current = false;
            setStatus('idle');
            onDone?.();
        };
        utt.onerror = () => {
            isSpeakingRef.current = false;
            setStatus('idle');
            onDone?.();
        };
        window.speechSynthesis.speak(utt);
    }, [getActiveVoiceConfig]);

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
            if (data?.success === false || data?.launched === false) {
                const errMsg = data?.error || data?.message || 'App not found, sir, and could not be opened.';
                dispatch(addToast({ type: 'warning', message: `Device: ${errMsg}` }));
                return { success: false, error: errMsg, message: errMsg };
            }
            return { success: true, ...data };
        } catch (err) {
            const errMsg = err?.response?.data?.message || err.message || 'App not found, sir, and could not be opened.';
            dispatch(addToast({ type: 'warning', message: `Device: ${errMsg}` }));
            return { success: false, error: errMsg, message: errMsg };
        }
    }, [dispatch]);

    // ─── Handle resolved intent ───────────────────────────────────────────────
    const handleIntent = useCallback(async (intent, rawText) => {
        if (!intent) {
            // Send to AI with streaming chunk speech playback
            setStatus('thinking');
            setFeedback('Processing…');
            setHistory(p => [...p, { role: 'user', content: rawText }]);

            // Reset speech queue for incoming streamed response
            window.speechSynthesis?.cancel();
            speechQueueRef.current = [];
            isSpeakingRef.current = false;
            streamingBufferRef.current = '';
            isStreamingRef.current = true;

            try {
                const reply = await onSendMessage(rawText);
                isStreamingRef.current = false;

                if (reply && !stoppedRef.current) {
                    setHistory(p => [...p, { role: 'ai', content: reply }]);
                    setFeedback(reply.length > 80 ? reply.slice(0, 80) + '…' : reply);

                    // Flush any remaining chunk left in streaming buffer
                    if (streamingBufferRef.current.trim()) {
                        const cleanRest = cleanForSpeech(streamingBufferRef.current);
                        if (cleanRest.length > 2) {
                            speechQueueRef.current.push(cleanRest);
                        }
                        streamingBufferRef.current = '';
                    }

                    // Fallback if chunks weren't received (speak full reply)
                    if (speechQueueRef.current.length === 0 && !isSpeakingRef.current) {
                        let spokenReply = cleanForSpeech(reply);
                        if (spokenReply.length > 260) spokenReply = spokenReply.slice(0, 260) + '...';
                        if (!spokenReply) spokenReply = "Here is what I found for you, sir.";
                        speechQueueRef.current.push(spokenReply);
                    }

                    // Append concluding check prompt
                    speechQueueRef.current.push("Yes sir, what's next?");
                    processSpeechQueue();
                } else {
                    isStreamingRef.current = false;
                    setStatus('idle');
                    setFeedback('At your service, sir. Tap mic or speak.');
                    setTimeout(() => { if (!stoppedRef.current) startListeningRef.current?.(); }, 400);
                }
            } catch {
                isStreamingRef.current = false;
                setStatus('idle');
                setFeedback('I encountered an issue, sir. Tap mic to retry.');
            }
            return;
        }

        const { type, label = '' } = intent;

        if (type === 'close') {
            speak('Goodbye, sir. Systems on standby.', () => { stoppedRef.current = true; onClose(); });
            return;
        }

        if (type === 'navigate') {
            setStatus('action'); setFeedback(`Opening ${label}…`);
            setHistory(p => [...p, { role: 'action', content: `→ ${label}` }]);
            const voiceMsg = `Opening ${label}, sir. Yes sir, what's next?`;
            speak(voiceMsg, () => {
                navigate(intent.route);
                setTimeout(() => { if (!stoppedRef.current) startListeningRef.current?.(); }, 800);
            });
            return;
        }

        if (type === 'open_url') {
            setStatus('action'); setFeedback(label);
            setHistory(p => [...p, { role: 'action', content: `🌐 ${label}` }]);
            const voiceMsg = `Opening ${label}, sir. Yes sir, what's next?`;
            speak(voiceMsg, () => {
                window.open(intent.url, '_blank', 'noopener,noreferrer');
                setTimeout(() => { if (!stoppedRef.current) startListeningRef.current?.(); }, 600);
            });
            return;
        }

        if (type === 'scroll') {
            if (intent.to === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
            else if (intent.to === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            else window.scrollBy({ top: intent.by, behavior: 'smooth' });
            speak("Right away, sir. Yes sir, what's next?", () => { if (!stoppedRef.current) startListeningRef.current?.(); });
            return;
        }

        if (type === 'clipboard_last') {
            const text = lastAiMessage || '';
            if (text) {
                navigator.clipboard.writeText(text);
                speak("Copied to clipboard, sir. Yes sir, what's next?", () => { if (!stoppedRef.current) startListeningRef.current?.(); });
            } else {
                speak("No response available to copy, sir. What else can I assist you with?", () => { if (!stoppedRef.current) startListeningRef.current?.(); });
            }
            return;
        }

        if (type === 'device_cmd') {
            setHistory(p => [...p, { role: 'user', content: rawText }, { role: 'action', content: `⚡ ${label}` }]);
            // Send into chat conversation so user sees what was spoken in chat messages
            if (typeof onSendMessage === 'function') {
                onSendMessage(rawText).catch(() => {});
            }
            const result = await executeDeviceCommand(intent.action, intent.params, label, intent.targetSelector);
            if (result && result.success !== false) {
                const voiceMsg = `Done, sir. ${label}. Yes sir, what's next?`;
                setFeedback(voiceMsg);
                speak(voiceMsg, () => { if (!stoppedRef.current) startListeningRef.current?.(); });
            } else {
                const failMsg = result?.message || 'App not found, sir, and could not be opened.';
                setFeedback(failMsg);
                speak(failMsg, () => { if (!stoppedRef.current) startListeningRef.current?.(); });
            }
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

    startListeningRef.current = startListening;

    const stopAll = useCallback(() => {
        stoppedRef.current = true;
        isStreamingRef.current = false;
        speechQueueRef.current = [];
        isSpeakingRef.current = false;
        streamingBufferRef.current = '';
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
            setStatus('idle');
        } else if (status === 'speaking' || status === 'thinking') {
            // User interrupted while AI was speaking/thinking
            window.speechSynthesis?.cancel();
            speechQueueRef.current = [];
            isSpeakingRef.current = false;
            isStreamingRef.current = false;
            stoppedRef.current = false;
            startListening();
        } else if (status === 'idle') {
            stoppedRef.current = false;
            startListening();
        }
    }, [status, startListening]);

    const submitText = useCallback((text) => {
        const raw = String(text || '').trim();
        if (!raw) return;
        try { recognitionRef.current?.stop(); } catch {}
        setTranscript('');
        const intent = resolveIntent(raw);
        handleIntent(intent, raw);
    }, [handleIntent]);

    return {
        status,
        transcript,
        feedback,
        history,
        startListening,
        stopAll,
        toggleMic,
        submitText,
        speak,
        setHistory,
    };
}
