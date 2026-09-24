import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { cn } from '../../lib/utils';

export default function MagneticButton({
  children,
  className,
  strength = 0.38,
  labelStrength = 0.22,
  variant = 'cyan', // 'cyan' | 'macha' | 'orange' | 'glass' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  onClick,
  type = 'button',
  wiggle = false,
  ...props
}) {
  const zoneRef = useRef(null);
  const btnRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    if (!zone || !btn || disabled) return;

    let wiggleTween = null;
    if (wiggle) {
      wiggleTween = gsap.to(btn, {
        rotation: 6,
        duration: 1.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    const handleMouseMove = (e) => {
      const rect = zone.getBoundingClientRect();
      const x = gsap.utils.mapRange(rect.left, rect.right, -rect.width / 2, rect.width / 2, e.clientX);
      const y = gsap.utils.mapRange(rect.top, rect.bottom, -rect.height / 2, rect.height / 2, e.clientY);

      gsap.to(btn, {
        x: x * strength,
        y: y * strength,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (label) {
        gsap.to(label, {
          x: x * labelStrength,
          y: y * labelStrength,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: 'elastic.out(1, 0.45)',
        overwrite: 'auto',
      });

      if (label) {
        gsap.to(label, {
          x: 0,
          y: 0,
          duration: 0.65,
          ease: 'elastic.out(1, 0.45)',
          overwrite: 'auto',
        });
      }
    };

    zone.addEventListener('mousemove', handleMouseMove);
    zone.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      zone.removeEventListener('mousemove', handleMouseMove);
      zone.removeEventListener('mouseleave', handleMouseLeave);
      if (wiggleTween) wiggleTween.kill();
      gsap.killTweensOf(btn);
      if (label) gsap.killTweensOf(label);
    };
  }, [strength, labelStrength, disabled, wiggle]);

  const variantStyles = {
    cyan: 'bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-zinc-950 font-bold shadow-md shadow-cyan-500/25',
    macha: 'bg-gradient-to-r from-[var(--color-success,#0ae448)] to-[#abff84] text-zinc-950 font-bold shadow-md shadow-emerald-500/20',
    orange: 'bg-gradient-to-r from-[var(--color-orange,#ff8709)] to-[#f7bdf8] text-zinc-950 font-bold shadow-md shadow-orange-500/20',
    glass: 'bg-white/10 dark:bg-white/[0.08] hover:bg-white/20 dark:hover:bg-white/[0.14] text-zinc-900 dark:text-white border border-black/10 dark:border-white/15 backdrop-blur-xl',
    danger: 'bg-gradient-to-r from-[var(--color-danger,#ef4444)] to-red-600 text-white font-bold shadow-md shadow-rose-500/20',
    ghost: 'bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs rounded-full',
    md: 'px-5 py-2.5 text-xs sm:text-sm rounded-full',
    lg: 'px-7 py-3.5 text-sm sm:text-base rounded-full',
  };

  return (
    <div
      ref={zoneRef}
      className="inline-flex items-center justify-center p-2 relative select-none cursor-pointer"
      style={{ touchAction: 'manipulation' }}
    >
      <button
        ref={btnRef}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center justify-center font-semibold transition-shadow duration-200 outline-none cursor-pointer will-change-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant] || variantStyles.cyan,
          sizeStyles[size] || sizeStyles.md,
          className
        )}
        {...props}
      >
        <span ref={labelRef} className="relative z-10 flex items-center gap-2 pointer-events-none will-change-transform">
          {children}
        </span>
      </button>
    </div>
  );
}
