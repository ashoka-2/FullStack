import React from 'react';

/**
 * PremiumToggle — Minimal AI-UI native toggle switch.
 * Spec: 52x32 track, radius pill; ON = track --text / --accent, knob --bg; OFF = track --surface-2 + line.
 */
const PremiumToggle = ({ checked, onChange, disabled = false, size = 'md' }) => {
    const sizeMap = {
        sm: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 'translate-x-4' },
        md: { track: 'w-[50px] h-[30px]', thumb: 'w-[22px] h-[22px]', translate: 'translate-x-[20px]' },
        lg: { track: 'w-[56px] h-[34px]', thumb: 'w-[26px] h-[26px]', translate: 'translate-x-[22px]' },
    };
    const s = sizeMap[size] || sizeMap.md;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={[
                'relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-1 border-0',
                'transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                s.track,
                checked
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--surface-2)] shadow-[inset_0_0_0_2px_var(--line-strong)]',
                disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-95',
            ].join(' ')}
        >
            <span
                className={[
                    'pointer-events-none inline-block rounded-full shadow-sm',
                    'transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                    s.thumb,
                    checked
                        ? `${s.translate} bg-[var(--bg)]`
                        : 'translate-x-0 bg-[var(--text-muted)]',
                ].join(' ')}
            />
        </button>
    );
};

export default PremiumToggle;
