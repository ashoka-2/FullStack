import React, { useState, useEffect, useRef } from 'react';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import { RiSparkling2Line, RiCheckLine, RiPaletteLine, RiFireLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react';

const BLOB_COLORS = [
  {
    id: 'cyan',
    name: 'Blue Cyan',
    gradient: 'from-[#bbf2f8] via-[#4ecde0] to-[#199eb0]',
    badgeBg: '#4ecde0',
    description: 'Classic Aqua Cyan',
  },
  {
    id: 'green',
    name: 'Green',
    gradient: 'from-[#bbf7d0] via-[#34d399] to-[#059669]',
    badgeBg: '#34d399',
    description: 'Emerald Green',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    gradient: 'from-[#fef08a] via-[#fbbf24] to-[#d97706]',
    badgeBg: '#fbbf24',
    description: 'Sunny Amber',
  },
  {
    id: 'purple',
    name: 'Purple',
    gradient: 'from-[#e9d5ff] via-[#a855f7] to-[#7e22ce]',
    badgeBg: '#a855f7',
    description: 'Royal Violet',
  },
  {
    id: 'red',
    name: 'Red',
    gradient: 'from-[#fecdd3] via-[#fb7185] to-[#e11d48]',
    badgeBg: '#fb7185',
    description: 'Crimson Red',
  },
  {
    id: 'light-green',
    name: 'Light Green',
    gradient: 'from-[#d9f99d] via-[#a3e635] to-[#65a30d]',
    badgeBg: '#a3e635',
    description: 'Lime Mint',
  },
  {
    id: 'orange',
    name: 'Orange',
    gradient: 'from-[#fed7aa] via-[#fb923c] to-[#ea580c]',
    badgeBg: '#fb923c',
    description: 'Tangerine Orange',
  },
  {
    id: 'pink',
    name: 'Pink',
    gradient: 'from-[#fbcfe8] via-[#f472b6] to-[#db2777]',
    badgeBg: '#f472b6',
    description: 'Bubblegum Pink',
  },
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    gradient: 'from-[#bfdbfe] via-[#2563eb] to-[#1e3a8a]',
    badgeBg: '#2563eb',
    description: 'Sapphire Midnight',
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    gradient: 'from-[#99f6e4] via-[#14b8a6] to-[#0f766e]',
    badgeBg: '#14b8a6',
    description: 'Deep Aquamarine',
  },
  {
    id: 'coral',
    name: 'Coral',
    gradient: 'from-[#fed7aa] via-[#fb7185] to-[#e11d48]',
    badgeBg: '#fb7185',
    description: 'Sunset Peach',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    gradient: 'from-[#c7d2fe] via-[#6366f1] to-[#3730a3]',
    badgeBg: '#6366f1',
    description: 'Cosmic Violet',
  },
  {
    id: 'fire',
    name: 'Fire 🔥',
    gradient: 'from-[#fef08a] via-[#f97316] to-[#dc2626]',
    badgeBg: '#ea580c',
    description: 'Solar Phoenix',
  },
];

const MascotCompanionSettings = ({ previewMood = 'curious', setPreviewMood, celebrateCount = 0 }) => {
  const [blobVisible, setBlobVisible] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_visible');
    return saved !== null ? saved === 'true' : true;
  });

  const [blobSize, setBlobSize] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_size');
    return saved ? Math.max(60, Math.min(320, parseInt(saved, 10))) : 110;
  });

  const [blobColor, setBlobColor] = useState(() => {
    return localStorage.getItem('blob_mascot_color') || 'cyan';
  });

  const [hasFlame, setHasFlame] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_flame');
    return saved !== null ? saved === 'true' : false;
  });

  const [eyeTracking, setEyeTracking] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_eye_track');
    return saved !== null ? saved === 'true' : true;
  });

  const previewBoxRef = useRef(null);
  const [previewGaze, setPreviewGaze] = useState({ x: 0, y: 0 });

  // Listen for real-time changes from floating blob on screen
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail?.size !== undefined) {
        setBlobSize(e.detail.size);
      }
      if (e.detail?.visible !== undefined) {
        setBlobVisible(e.detail.visible);
      }
      if (e.detail?.color !== undefined) {
        setBlobColor(e.detail.color);
      }
      if (e.detail?.flame !== undefined) {
        setHasFlame(e.detail.flame);
      }
      if (e.detail?.eyeTrack !== undefined) {
        setEyeTracking(e.detail.eyeTrack);
      }
    };
    window.addEventListener('blob_settings_change', handleSettingsChange);
    return () => window.removeEventListener('blob_settings_change', handleSettingsChange);
  }, []);

  // Live preview cursor gaze tracking when eye tracking is enabled
  useEffect(() => {
    if (!eyeTracking) {
      setPreviewGaze({ x: 0, y: 0 });
      return;
    }

    let frameId;
    const handleMove = (e) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!previewBoxRef.current) return;
        const rect = previewBoxRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const dist = Math.hypot(deltaX, deltaY);

        if (dist < 6) {
          setPreviewGaze({ x: 0, y: 0 });
          return;
        }

        const dirX = deltaX / dist;
        const dirY = deltaY / dist;
        const intensity = Math.min(1, dist / 220);

        setPreviewGaze({
          x: dirX * intensity * 28,
          y: dirY * intensity * 20
        });
      });
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(frameId);
    };
  }, [eyeTracking]);

  const handleToggleBlobVisibility = (value) => {
    setBlobVisible(value);
    localStorage.setItem('blob_mascot_visible', value.toString());
    window.dispatchEvent(new CustomEvent('blob_settings_change', {
      detail: { visible: value }
    }));
  };

  const handleToggleEyeTracking = (val) => {
    setEyeTracking(val);
    localStorage.setItem('blob_mascot_eye_track', val.toString());
    window.dispatchEvent(new CustomEvent('blob_settings_change', {
      detail: { eyeTrack: val }
    }));
  };

  const handleSizeChange = (newSize) => {
    const clamped = Math.max(60, Math.min(320, parseInt(newSize, 10)));
    setBlobSize(clamped);
    localStorage.setItem('blob_mascot_size', clamped.toString());
    window.dispatchEvent(new CustomEvent('blob_settings_change', {
      detail: { size: clamped }
    }));
  };

  const handleColorChange = (newColor) => {
    setBlobColor(newColor);
    localStorage.setItem('blob_mascot_color', newColor);
    if (newColor === 'fire' && !hasFlame) {
      setHasFlame(true);
      localStorage.setItem('blob_mascot_flame', 'true');
      window.dispatchEvent(new CustomEvent('blob_settings_change', {
        detail: { color: newColor, flame: true }
      }));
      return;
    }
    window.dispatchEvent(new CustomEvent('blob_settings_change', {
      detail: { color: newColor }
    }));
  };

  const handleToggleFlame = (val) => {
    setHasFlame(val);
    localStorage.setItem('blob_mascot_flame', val.toString());
    window.dispatchEvent(new CustomEvent('blob_settings_change', {
      detail: { flame: val }
    }));
  };

  return (
    <div className="bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <RiSparkling2Line size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Floating Mascot Companion</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure the interactive mascot, customize its size, colors, eye cursor tracking, and fire flame effect</p>
          </div>
        </div>

        {/* Visibility Switch Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hidden sm:inline">
            {blobVisible ? 'Visible' : 'Hidden'}
          </span>
          <button
            type="button"
            onClick={() => handleToggleBlobVisibility(!blobVisible)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              blobVisible ? 'bg-[var(--accent-cyan)]' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
            title={blobVisible ? "Click to hide mascot" : "Click to show mascot"}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                blobVisible ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mascot Live Preview & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Live Interactive Preview Box */}
        <div
          ref={previewBoxRef}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 min-h-[270px] relative overflow-hidden sticky top-6"
        >
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider absolute top-3 left-4">
            Live Preview ({blobSize}px)
          </div>

          <div 
            style={{ width: `${Math.min(blobSize, 180)}px`, height: `${Math.min(blobSize, 180)}px` }}
            className="cursor-pointer transition-transform hover:scale-105 select-none my-2"
            onClick={() => {
              const moods = ['shy', 'surprised', 'love', 'angry', 'wave'];
              const next = moods[Math.floor(Math.random() * moods.length)];
              setPreviewMood(next);
            }}
            title="Click to interact!"
          >
            <JellyBlobMascot
              mood={previewMood}
              eyeStyle="v1"
              gaze={eyeTracking ? previewGaze : { x: 0, y: 0 }}
              celebrate={celebrateCount}
              color={blobColor}
              flame={hasFlame}
              onOverpoke={() => {
                setPreviewMood('angry');
                setTimeout(() => setPreviewMood('neutral'), 2000);
              }}
              className="w-full h-full drop-shadow-lg"
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-2 text-center">
            Mood: <strong className="text-[var(--accent-cyan)] capitalize">{previewMood}</strong> • Color: <strong className="text-[var(--accent-cyan)] capitalize">{BLOB_COLORS.find(c => c.id === blobColor)?.name || blobColor}</strong>{hasFlame && <span className="ml-1 text-orange-500 font-semibold">• Fire Head 🔥</span>}{eyeTracking && <span className="ml-1 text-sky-500 font-semibold">• Tracking Eyes 👀</span>}
          </p>
        </div>

        {/* Controls Column */}
        <div className="space-y-6">
          {/* Eye Tracking (Cursor Follow) Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent dark:border-cyan-400/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-[var(--accent-cyan)] flex items-center justify-center font-bold">
                {eyeTracking ? <RiEyeLine size={20} className="text-[var(--accent-cyan)]" /> : <RiEyeOffLine size={20} className="text-zinc-400" />}
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  Eye Tracking
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-[var(--accent-cyan)] font-semibold">Cursor Follow</span>
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Eyes track your mouse pointer across the entire screen from any angle</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleEyeTracking(!eyeTracking)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                eyeTracking ? 'bg-[var(--accent-cyan)]' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
              title={eyeTracking ? "Disable cursor eye tracking" : "Enable cursor eye tracking"}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  eyeTracking ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Fiery Head Flame Effect Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:border-amber-400/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center font-bold">
                <RiFireLine size={20} className={hasFlame ? "animate-pulse text-orange-500" : "text-zinc-400"} />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  Fiery Head Flame
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold">Fire Effect</span>
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Animated dancing flame with floating ember sparks on head</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleFlame(!hasFlame)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                hasFlame ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
              title={hasFlame ? "Disable fire effect" : "Enable fire effect"}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  hasFlame ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mascot Color Palette Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <RiPaletteLine size={14} className="text-[var(--accent-cyan)]" />
                <span>Blob Color Palette</span>
              </span>
              <span className="text-[11px] font-bold text-[var(--accent-cyan)] capitalize">
                {BLOB_COLORS.find(c => c.id === blobColor)?.name || blobColor}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {BLOB_COLORS.map((item) => {
                const isSelected = blobColor === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleColorChange(item.id)}
                    className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 ring-2 ring-[var(--accent-cyan)]/30 shadow-xs'
                        : 'border-zinc-200 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                    title={`${item.name} - ${item.description}`}
                  >
                    {/* Color circular gradient swatch with distinct shades */}
                    <div 
                      className="relative w-7 h-7 rounded-full p-0.5 shadow-xs flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: item.badgeBg }}
                    >
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-inner`}>
                        {isSelected && (
                          <RiCheckLine size={13} className="text-zinc-950 font-black drop-shadow-xs" />
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 mt-1 truncate max-w-full">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">Mascot Size</span>
              <span className="text-[var(--accent-cyan)] font-mono font-bold">{blobSize}px</span>
            </div>
            <input
              type="range"
              min="60"
              max="300"
              step="5"
              value={blobSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-full accent-[#20b8cd] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Small (60px)</span>
              <span>Default (110px)</span>
              <span>Large (300px)</span>
            </div>
          </div>

          {/* Test Mood Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Test Moods:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['curious', 'happy', 'shy', 'angry', 'surprised', 'love', 'sleepy', 'wave'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPreviewMood(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                    previewMood === m
                      ? 'bg-[var(--accent-cyan)] text-zinc-950 font-bold shadow-xs'
                      : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Mascot Features Guide Card */}
          <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 space-y-1">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <RiSparkling2Line size={13} className="text-[var(--accent-cyan)]" />
              <span>How to interact anywhere on screen:</span>
            </span>
            <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 list-disc list-inside space-y-0.5">
              <li><strong>Right Click Mascot</strong>: Quick menu with Eye Tracking toggle & direct shortcut to Mascot Settings! ⚡</li>
              <li><strong>Eye Tracking (Cursor Follow)</strong>: Eyes track your mouse pointer across 360° wherever the mascot sits! 👀</li>
              <li><strong>Drag Anywhere</strong>: Drag and drop the blob freely anywhere on your screen.</li>
              <li><strong>Color & Fire Effect</strong>: Pick from 13 shades and toggle the Fiery Head Flame.</li>
              <li><strong>Rapid Poking (4x clicks)</strong>: Makes the blob angry! 😡</li>
              <li><strong>Double Tap</strong>: Sends love with animated floating hearts! 💖</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MascotCompanionSettings;
