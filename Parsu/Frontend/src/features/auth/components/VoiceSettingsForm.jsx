import React, { useState, useEffect } from 'react';
import { 
  RiVolumeUpLine, 
  RiPlayCircleLine, 
  RiStopCircleLine, 
  RiCheckLine, 
  RiSparklingLine,
  RiVoiceprintLine 
} from '@remixicon/react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';

const VoiceSettingsForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => {
    return localStorage.getItem('parsu_tts_voice') || localStorage.getItem('perplexity_tts_voice') || '';
  });
  const [rate, setRate] = useState(() => {
    return parseFloat(localStorage.getItem('parsu_tts_rate') || localStorage.getItem('perplexity_tts_rate') || '1');
  });
  const [pitch, setPitch] = useState(() => {
    return parseFloat(localStorage.getItem('parsu_tts_pitch') || localStorage.getItem('perplexity_tts_pitch') || '1');
  });
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Populate browser voices (handles both synchronous and async voiceschanged event)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        if (!selectedVoiceURI) {
          // Default to first English voice or first available
          const defaultVoice = availableVoices.find(v => v.lang?.startsWith('en') && (v.default || v.name?.includes('Google') || v.name?.includes('Natural'))) || availableVoices[0];
          if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
            localStorage.setItem('parsu_tts_voice', defaultVoice.voiceURI);
          }
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVoiceURI]);

  // Handle voice change
  const handleVoiceChange = (e) => {
    const newURI = e.target.value;
    setSelectedVoiceURI(newURI);
    localStorage.setItem('parsu_tts_voice', newURI);
    dispatch(addToast({ message: "Voice preference updated!", type: "success" }));
    if (onSuccess) onSuccess();
  };

  // Handle rate change
  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
    localStorage.setItem('parsu_tts_rate', String(newRate));
  };

  // Handle pitch change
  const handlePitchChange = (e) => {
    const newPitch = parseFloat(e.target.value);
    setPitch(newPitch);
    localStorage.setItem('parsu_tts_pitch', String(newPitch));
  };

  // Test current voice with a sample sentence
  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) {
      dispatch(addToast({ message: "Speech synthesis not supported in this browser.", type: "warning" }));
      return;
    }

    if (isPlayingTest) {
      window.speechSynthesis.cancel();
      setIsPlayingTest(false);
      window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
      return;
    }

    window.speechSynthesis.cancel();

    const text = "Hello! This is a preview of my voice. I will use this voice to read AI responses for you.";
    const utterance = new SpeechSynthesisUtterance(text);

    const matchedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlayingTest(true);
      window.dispatchEvent(new CustomEvent('blob_speech_state', {
        detail: { speaking: true, text: "Testing my voice! 🎙️" }
      }));
    };

    utterance.onend = () => {
      setIsPlayingTest(false);
      window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
    };

    utterance.onerror = () => {
      setIsPlayingTest(false);
      window.dispatchEvent(new CustomEvent('blob_speech_state', { detail: { speaking: false } }));
    };

    window.speechSynthesis.speak(utterance);
  };

  const currentVoiceObj = voices.find(v => v.voiceURI === selectedVoiceURI);

  return (
    <div className="bg-white dark:bg-[var(--bg-surface)] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20">
            <RiVoiceprintLine size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">AI Voice & Speech Settings</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Choose the voice and speaking speed used when reading AI messages aloud.</p>
          </div>
        </div>

        {/* Test Voice Play Button */}
        <button
          type="button"
          onClick={handleTestVoice}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
            isPlayingTest
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950'
          }`}
        >
          {isPlayingTest ? (
            <>
              <RiStopCircleLine size={16} />
              <span>Stop Preview</span>
            </>
          ) : (
            <>
              <RiPlayCircleLine size={16} />
              <span>Preview Voice</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Voice Selector */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Selected Voice
          </label>
          <div className="relative">
            <select
              value={selectedVoiceURI}
              onChange={handleVoiceChange}
              className="w-full bg-zinc-50 dark:bg-[#181818] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--accent-cyan)] transition-all cursor-pointer"
            >
              {voices.length === 0 && (
                <option value="">Loading system voices...</option>
              )}
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '— Default' : ''}
                </option>
              ))}
            </select>
          </div>
          {currentVoiceObj && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Active voice: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{currentVoiceObj.name}</span> ({currentVoiceObj.lang})
            </p>
          )}
        </div>

        {/* Speed / Rate Slider & Pitch Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Speaking Rate */}
          <div className="bg-zinc-50 dark:bg-[#161616] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Speaking Speed (Rate)</span>
              <span className="text-xs font-mono font-bold text-[var(--accent-cyan)]">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={handleRateChange}
              className="w-full accent-[#20b8cd] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>Slower (0.75x)</span>
              <span>Normal (1.0x)</span>
              <span>Faster (1.5x)</span>
            </div>
          </div>

          {/* Voice Pitch */}
          <div className="bg-zinc-50 dark:bg-[#161616] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Voice Pitch</span>
              <span className="text-xs font-mono font-bold text-[var(--accent-cyan)]">{pitch}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={pitch}
              onChange={handlePitchChange}
              className="w-full accent-[#20b8cd] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>Lower (0.8)</span>
              <span>Default (1.0)</span>
              <span>Higher (1.3)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsForm;
