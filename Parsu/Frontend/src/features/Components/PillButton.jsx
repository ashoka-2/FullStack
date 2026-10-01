import React from 'react';
import { Link } from 'react-router';

/**
 * CircleButton:
 * Standalone circular action button matching Parsu AI's signature input plus button aesthetic.
 */
export const CircleButton = ({
  children,
  onClick,
  to,
  className = '',
  size = 'md', // 'sm', 'md', 'lg'
  title,
  ariaLabel,
  disabled = false,
  type = 'button',
  inGroup = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 sm:w-8.5 sm:h-8.5 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size] || 'w-8 h-8 sm:w-8.5 sm:h-8.5 text-sm';

  const baseClasses = inGroup
    ? `${sizeClasses} rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.14] active:scale-95 transition-all duration-200 cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none ${className}`
    : `${sizeClasses} rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        className={baseClasses}
        title={title}
        aria-label={ariaLabel || title}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      title={title}
      aria-label={ariaLabel || title}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * PillGroup:
 * Capsule/pill container holding two or more grouped buttons.
 */
export const PillGroup = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] shadow-xs shrink-0 ${className}`}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <div className="w-[1px] h-3.5 bg-zinc-300/80 dark:bg-white/15 mx-0.5 shrink-0" />
            )}
            {React.cloneElement(child, { inGroup: true })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * PillBadge:
 * Rounded pill badge for titles, status, temporary chat, and metadata tags.
 */
export const PillBadge = ({
  children,
  className = '',
  variant = 'default', // 'default', 'accent', 'purple', 'emerald', 'amber'
  onClick,
  to,
  title,
  ...props
}) => {
  const variantClasses = {
    default: 'border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200',
    accent: 'border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 text-zinc-900 dark:text-white',
    purple: 'border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400',
  }[variant] || 'border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200';

  const baseClasses = `inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border ${variantClasses} text-xs font-medium shadow-xs ${className}`;

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} hover:bg-zinc-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer`} title={title} {...props}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClasses} hover:bg-zinc-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer`} title={title} {...props}>
        {children}
      </button>
    );
  }

  return (
    <div className={baseClasses} title={title} {...props}>
      {children}
    </div>
  );
};

export default {
  CircleButton,
  PillGroup,
  PillBadge,
};
