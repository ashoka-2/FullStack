import React, { forwardRef } from 'react';
import { Link } from 'react-router';
import { RiLoader4Line } from '@remixicon/react';

/**
 * PrimaryButton
 * Premium Frame-btn styled component button with radial cyan gradient,
 * liquid glass inner reflections, outer glow rim, and multi-layered drop shadows.
 *
 * Can be used anywhere across the app as a standard <button>, <a>, or <Link>.
 * Fully responsive and supports custom width, height, size, icons, and text.
 */
const PrimaryButton = forwardRef(function PrimaryButton(
  {
    children,
    onClick,
    to,
    href,
    as: ComponentProp,
    type = 'button',
    disabled = false,
    loading = false,
    icon: Icon = null,
    iconColor = null,
    iconPosition = 'right',
    className = '',
    innerClassName = '',
    style = {},
    size = 'md',
    variant = 'cyan', // 'cyan' (Frame-btn) | 'dark'
    outerFrame = true, // Whether to show the outer translucent rim ring like Frame-btn
    fullWidth = false,
    ...props
  },
  ref
) {
  const isLink = Boolean(to);
  const isAnchor = Boolean(href) && !to;
  const Component = ComponentProp || (isLink ? Link : isAnchor ? 'a' : 'button');

  const isFull = fullWidth || size === 'full' || className.includes('w-full');

  const sizeClasses = {
    xs: 'px-3 py-1.5 text-[11px] gap-1.5',
    sm: 'px-4 py-2 text-xs gap-2',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-sm sm:text-base gap-2.5',
    xl: 'px-8 sm:px-10 py-4 text-base gap-3',
    hero: 'px-8 sm:px-11 py-3.5 sm:py-4 text-sm sm:text-base tracking-wider uppercase font-black gap-2.5',
    full: 'w-full py-3.5 px-6 text-sm gap-2',
  }[size] || 'px-6 py-2.5 text-sm gap-2';

  // Base inner pill styling mimicking Frame-btn radial gradient + specular inner highlights + multi-drop shadows
  const variantClasses = {
    cyan: `
      relative overflow-hidden text-white font-display
      bg-[image:var(--btn-primary-bg)]
      border border-[var(--btn-primary-border)]/40
      shadow-[var(--btn-primary-shadow)]
      hover:shadow-[var(--btn-primary-shadow-hover)]
      hover:brightness-[1.05]
    `,
    dark: `
      relative overflow-hidden text-white font-display
      bg-zinc-950 dark:bg-white text-white dark:text-zinc-950
      border border-zinc-800 dark:border-zinc-200
      hover:bg-zinc-800 dark:hover:bg-zinc-100
      shadow-md
    `,
  }[variant] || '';

  const buttonInner = (
    <span
      className={`
        relative z-10 inline-flex items-center justify-center font-bold select-none
        rounded-full transition-all duration-300
        active:scale-[0.97]
        ${isFull ? 'w-full' : ''}
        ${variantClasses}
        ${sizeClasses}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${innerClassName}
      `}
    >
      {/* Specular glass reflection bar along top inner curve */}
      {variant === 'cyan' && (
        <span
          className="pointer-events-none absolute inset-x-3 top-0 h-[35%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent opacity-80"
          aria-hidden="true"
        />
      )}

      {/* Loading spinner */}
      {loading ? (
        <RiLoader4Line className="animate-spin shrink-0" size={size === 'hero' || size === 'xl' ? 20 : 17} />
      ) : Icon && iconPosition === 'left' ? (
        <Icon
          size={size === 'hero' || size === 'xl' ? 20 : 17}
          className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
          style={iconColor ? { color: iconColor } : undefined}
        />
      ) : null}

      {/* Text label */}
      {children && <span className="relative z-10 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">{children}</span>}

      {/* Trailing Icon (default for action buttons & hero CTA) */}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon
          size={size === 'hero' || size === 'xl' ? 20 : 17}
          className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
          style={iconColor ? { color: iconColor } : undefined}
        />
      )}
    </span>
  );

  // Outer frame wrapper (like the 6px translucent #20B8CD/0.08 ring in Frame-btn.svg)
  const wrappedButton = outerFrame && variant === 'cyan' ? (
    <span className={`inline-flex ${isFull ? 'w-full' : ''} p-[3px] sm:p-[4px] rounded-full bg-[var(--accent-cyan)]/10 dark:bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/25 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-[var(--accent-cyan)]/20 group-hover:border-[var(--accent-cyan)]/40 shadow-xs`}>
      {buttonInner}
    </span>
  ) : (
    buttonInner
  );

  // Outer container component classes
  const rootClasses = `group relative ${isFull ? 'w-full flex' : 'inline-flex'} items-center justify-center p-0 bg-transparent border-0 outline-hidden focus-visible:ring-4 focus-visible:ring-[var(--accent-cyan)]/40 rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`;

  if (!isLink && !isAnchor) {
    return (
      <Component
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={rootClasses}
        style={style}
        {...props}
      >
        {wrappedButton}
      </Component>
    );
  }

  return (
    <Component
      ref={ref}
      to={to}
      href={href}
      onClick={onClick}
      className={rootClasses}
      style={style}
      {...props}
    >
      {wrappedButton}
    </Component>
  );
});

export default PrimaryButton;
