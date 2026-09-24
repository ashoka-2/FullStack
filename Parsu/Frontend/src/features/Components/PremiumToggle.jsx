import React from 'react';

/**
 * PremiumToggle — Premium native dark UI toggle switch.
 * Design: OLED surface, smooth spring transition, accent-cyan active state.
 */
const PremiumToggle = ({ checked, onChange, disabled = false, size = 'md' }) => {
    const sizeMap = {
        sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'w-4.5 h-4.5', translate: 'translate-x-5' },
        lg: { track: 'w-14 h-7', thumb: 'w-5 h-5', translate: 'translate-x-7' },
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
                'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
                'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]/60',
                s.track,
                checked
                    ? 'bg-[var(--accent-cyan)]'
                    : 'bg-zinc-700 dark:bg-zinc-800',
                disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90',
            ].join(' ')}
        >
            <span
                className={[
                    'pointer-events-none inline-block rounded-full bg-white shadow-md',
                    'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                    s.thumb,
                    checked ? s.translate : 'translate-x-0',
                ].join(' ')}
            />
        </button>
    );
};

export default PremiumToggle;
