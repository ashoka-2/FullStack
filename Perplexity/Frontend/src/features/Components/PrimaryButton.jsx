import React from 'react';
import { RiLoader4Line } from '@remixicon/react';

/**
 * PrimaryButton
 * Standard reusable primary button for the entire application.
 * Accepts onClick, type, loading, disabled, custom icons, and size.
 */
export default function PrimaryButton({
    children,
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    icon: Icon = null,
    iconColor = null,
    className = '',
    size = 'md',
    ...props
}) {
    const sizeClasses = {
        sm: 'px-3.5 py-2 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-sm sm:text-base',
        full: 'w-full py-3.5 px-4 text-sm'
    }[size] || 'px-5 py-2.5 text-sm';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 ${sizeClasses} ${className}`}
            {...props}
        >
            {loading ? (
                <RiLoader4Line className="animate-spin shrink-0" size={18} />
            ) : Icon ? (
                <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" style={iconColor ? { color: iconColor } : undefined} />
            ) : null}
            {children && <span>{children}</span>}
        </button>
    );
}
