import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RiFlashlightLine, RiBrainLine, RiFocus2Line, RiArrowDownSLine, RiCheckLine } from '@remixicon/react';

export const THINKING_LEVELS = [
  {
    id: 'low',
    name: 'Fast',
    badge: 'Default',
    icon: RiFlashlightLine,
    description: 'Instant responses with high precision and lowest latency',
    color: 'text-emerald-500 dark:text-emerald-400'
  },
  {
    id: 'medium',
    name: 'Balanced',
    badge: 'Think Medium',
    icon: RiBrainLine,
    description: 'Structured step-by-step logic and balanced reasoning',
    color: 'text-amber-500 dark:text-amber-400'
  },
  {
    id: 'high',
    name: 'Deep Think',
    badge: 'Think High',
    icon: RiFocus2Line,
    description: 'Deep chain-of-thought analysis for complex queries & edge cases',
    color: 'text-[var(--accent-cyan)]'
  }
];

export function getStoredThinkingLevel() {
  return localStorage.getItem('parsu_thinking_level') || 'low';
}

export function setStoredThinkingLevel(level) {
  localStorage.setItem('parsu_thinking_level', level);
  window.dispatchEvent(new CustomEvent('parsu_thinking_change', { detail: level }));
}

export default function ThinkingSelectorDropdown({
  thinkingLevel = 'low',
  onChange,
  placement = 'top'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(thinkingLevel || getStoredThinkingLevel);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpward: true });

  useEffect(() => {
    if (thinkingLevel) {
      setCurrentLevel(thinkingLevel);
    }
  }, [thinkingLevel]);

  // Sync external changes
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail) {
        setCurrentLevel(e.detail);
        if (onChange) onChange(e.detail);
      }
    };
    window.addEventListener('parsu_thinking_change', handleSync);
    return () => window.removeEventListener('parsu_thinking_change', handleSync);
  }, [onChange]);

  // Position calculation
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const padding = 12;

    const openUpward = placement === 'top' || (rect.bottom + dropdownHeight > window.innerHeight - 20);
    const top = openUpward ? rect.top - dropdownHeight - 8 : rect.bottom + 8;
    const left = Math.max(padding, Math.min(rect.left, window.innerWidth - 280 - padding));

    setCoords({ top, left, openUpward });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const activeOption = THINKING_LEVELS.find(lvl => lvl.id === currentLevel) || THINKING_LEVELS[0];
  const ActiveIcon = activeOption.icon;

  const handleSelect = (id) => {
    setCurrentLevel(id);
    setStoredThinkingLevel(id);
    if (onChange) onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 select-none cursor-pointer active:scale-95 shrink-0 ${
          currentLevel === 'high'
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 dark:text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
            : currentLevel === 'medium'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-300'
            : 'bg-zinc-100/90 dark:bg-white/[0.06] border-zinc-300 dark:border-white/15 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-white/25'
        }`}
        title={`Thinking Mode: ${activeOption.name} - ${activeOption.description}`}
      >
        <ActiveIcon size={14} className={activeOption.color} />
        <span className="text-[11px] sm:text-xs font-medium">{activeOption.name}</span>
        <RiArrowDownSLine size={13} className={`text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '270px',
            zIndex: 9999
          }}
          className="rounded-2xl p-1.5 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-2xl shadow-black/30 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-white/5 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              AI Reasoning Mode
            </p>
          </div>

          <div className="space-y-1">
            {THINKING_LEVELS.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === currentLevel;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-zinc-200 dark:bg-white/15' : 'bg-zinc-100 dark:bg-white/5'
                  }`}>
                    <Icon size={14} className={item.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </span>
                      {isSelected ? (
                        <RiCheckLine size={14} className="text-[var(--accent-cyan)] shrink-0" />
                      ) : (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
