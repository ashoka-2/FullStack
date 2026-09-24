import React, { useState, useEffect } from 'react';
import { JellyBlobMascot } from '../../Components/JellyBlobMascot';
import { RiSparkling2Line } from '@remixicon/react';

const MascotCompanionSettings = ({ previewMood = 'curious', setPreviewMood, celebrateCount = 0 }) => {
  const [blobVisible, setBlobVisible] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_visible');
    return saved !== null ? saved === 'true' : true;
  });

  const [blobSize, setBlobSize] = useState(() => {
    const saved = localStorage.getItem('blob_mascot_size');
    return saved ? Math.max(60, Math.min(320, parseInt(saved, 10))) : 110;
  });

  // Listen for real-time changes from floating blob on screen
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail?.size !== undefined) {
        setBlobSize(e.detail.size);
      }
      if (e.detail?.visible !== undefined) {
        setBlobVisible(e.detail.visible);
      }
    };
    window.addEventListener('blob_settings_change', handleSettingsChange);
    return () => window.removeEventListener('blob_settings_change', handleSettingsChange);
  }, []);

  const handleToggleBlobVisibility = (value) => {
    setBlobVisible(value);
    localStorage.setItem('blob_mascot_visible', value.toString());
    window.dispatchEvent(new CustomEvent('blob_settings_change', {
      detail: { visible: value }
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

  return (
    <div className="bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <RiSparkling2Line size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Floating Mascot Companion</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure the interactive mascot, customize its size, and preview moods</p>
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

      {/* Mascot Live Preview & Size Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Live Interactive Preview Box */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 min-h-[220px] relative overflow-hidden">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider absolute top-3 left-4">
            Live Preview ({blobSize}px)
          </div>

          <div 
            style={{ width: `${Math.min(blobSize, 180)}px`, height: `${Math.min(blobSize, 180)}px` }}
            className="cursor-pointer transition-transform hover:scale-105 select-none"
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
              celebrate={celebrateCount}
              onOverpoke={() => {
                setPreviewMood('angry');
                setTimeout(() => setPreviewMood('neutral'), 2000);
              }}
              className="w-full h-full drop-shadow-lg"
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-3 text-center">
            Current Mood: <strong className="text-[var(--accent-cyan)] capitalize">{previewMood}</strong> • Tap to interact
          </p>
        </div>

        {/* Controls Column */}
        <div className="space-y-6">
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
              <li><strong>Drag Anywhere</strong>: Drag and drop the blob anywhere on your screen.</li>
              <li><strong>Adjust Size</strong>: Use the slider above to change mascot size.</li>
              <li><strong>Rapid Poking (4x clicks)</strong>: Makes the blob angry! 😡</li>
              <li><strong>Double Tap</strong>: Sends love with animated hearts! 💖</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MascotCompanionSettings;
