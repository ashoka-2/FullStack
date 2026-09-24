import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../../utils/toast.slice';
import {
  RiErrorWarningLine,
  RiCheckboxCircleLine,
  RiInformationLine,
  RiAlertLine,
  RiCloseLine,
  RiHardDrive2Line,
  RiUserSharedLine,
  RiArrowRightSLine
} from '@remixicon/react';

/**
 * HeroUI Pro Style Toast Component
 * Features title, rich multi-line description, contextual indicator icon,
 * soft variant styling (default, accent/info, success, warning, danger),
 * and interactive action buttons at bottom-right.
 */
const ToastItem = ({ id, message, description, title, type = 'default', action, duration = 4500 }) => {
  const dispatch = useDispatch();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(1000, duration - 300));

    const removeTimer = setTimeout(() => {
      dispatch(removeToast(id));
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [dispatch, id, duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      dispatch(removeToast(id));
    }, 250);
  };

  const getVariantStyles = () => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-white/95 dark:bg-[var(--bg-surface)]/95 border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_12px_32px_rgba(16,185,129,0.12)]',
          indicator: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 border-emerald-500/20',
          title: 'text-emerald-700 dark:text-emerald-400',
          actionBtn: 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500/90 dark:hover:bg-emerald-500 text-white shadow-xs',
          icon: <RiCheckboxCircleLine size={16} />
        };
      case 'warning':
        return {
          card: 'bg-white/95 dark:bg-[var(--bg-surface)]/95 border-amber-500/30 dark:border-amber-500/20 shadow-[0_12px_32px_rgba(245,158,11,0.12)]',
          indicator: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 border-amber-500/20',
          title: 'text-amber-700 dark:text-amber-400',
          actionBtn: 'bg-amber-500 text-black hover:bg-amber-600 font-bold shadow-xs',
          icon: <RiAlertLine size={16} />
        };
      case 'danger':
      case 'error':
        return {
          card: 'bg-white/95 dark:bg-[var(--bg-surface)]/95 border-rose-500/30 dark:border-rose-500/20 shadow-[0_12px_32px_rgba(244,63,94,0.12)]',
          indicator: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 border-rose-500/20',
          title: 'text-rose-700 dark:text-rose-400',
          actionBtn: 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs',
          icon: <RiHardDrive2Line size={16} />
        };
      case 'info':
      case 'accent':
      default:
        return {
          card: 'bg-[#171717] border-[var(--accent-cyan)]/30 text-white shadow-xl',
          indicator: 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/20',
          title: 'text-[var(--accent-cyan)]',
          actionBtn: 'bg-[var(--accent-cyan)] text-zinc-950 hover:bg-[var(--accent-cyan-hover)] font-bold shadow-xs',
          icon: <RiInformationLine size={16} />
        };
    }
  };

  const v = getVariantStyles();
  const displayTitle = title || (type === 'error' ? 'Alert' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Notification');
  const mainText = message || description || 'Operation completed';
  const subText = description && message !== description ? description : null;

  return (
    <div
      role="alert"
      className={`relative pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border backdrop-blur-2xl transition-all duration-300 w-full sm:w-auto min-w-0 sm:min-w-[320px] max-w-[94vw] sm:max-w-[400px] ${
        isExiting
          ? 'opacity-0 translate-x-4 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-in fade-in slide-in-from-bottom-2'
      } ${v.card}`}
    >
      {/* Leading Indicator Icon */}
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${v.indicator}`}>
        {v.icon}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-xs font-bold tracking-tight ${v.title}`}>
            {displayTitle}
          </span>
        </div>
        <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed break-words">
          {mainText}
        </p>
        {subText && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal break-words">
            {subText}
          </p>
        )}

        {/* Action Button (e.g., "Upgrade", "Billing", "Dismiss") */}
        {action && (
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                action.onPress?.();
                handleDismiss();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${v.actionBtn}`}
            >
              <span>{action.label || 'Action'}</span>
              <RiArrowRightSLine size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2.5 top-2.5 w-6 h-6 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <RiCloseLine size={15} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useSelector((state) => state.toast.toasts);

  return (
    <div 
      aria-live="polite" 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none flex flex-col items-end gap-2.5 max-h-[85vh] overflow-hidden"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
};

export default ToastItem;
