import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimaryBtn, SecondaryBtn } from './Buttons';

/**
 * Snitch Cinematic Modal
 * ─────────────────────────────────────────
 * A premium, glassmorphism-based modal system.
 * Supports:
 * - Types: 'info' | 'danger' | 'success'
 * - Custom children for complex forms
 * - Backdrop blur fixed with high-Z indexing
 */
const Modal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Are you sure?", 
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info",
    children
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            const timer = setTimeout(() => setIsAnimating(false), 400); // Slower, smoother exit
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    // Premium Color Configs
    const config = {
        info: {
            icon: 'ri-question-mark',
            glow: 'bg-accent/20',
            text: 'text-accent',
            confirmIcon: 'ri-check-line',
            btnClass: '' 
        },
        danger: {
            icon: 'ri-alert-line',
            glow: 'bg-red-500/20',
            text: 'text-red-500',
            confirmIcon: 'ri-delete-bin-line',
            btnClass: '!bg-red-500 hover:shadow-red-500/30'
        },
        success: {
            icon: 'ri-checkbox-circle-line',
            glow: 'bg-emerald-500/20',
            text: 'text-emerald-500',
            confirmIcon: 'ri-check-double-line',
            btnClass: '!bg-emerald-500 hover:shadow-emerald-500/30'
        }
    };

    const current = config[type] || config.info;

    return createPortal(
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 sm:p-10 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Immersive Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-2xl cursor-default transition-all duration-500"
                onClick={onClose}
            ></div>

            {/* Cinematic Modal Card */}
            <div 
                className={`relative w-full max-w-lg bg-surface/80 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-10 md:p-12 shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 transform ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-12 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 ${current.glow} blur-[80px] rounded-full pointer-events-none`}></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Floating Icon Container */}
                    <div className={`w-20 h-20 rounded-[2rem] border border-white/10 flex items-center justify-center mb-8 shadow-2xl bg-surface/40 backdrop-blur-md ${current.text}`}>
                        <i className={`${current.icon} text-4xl`}></i>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground mb-4">
                        {title}
                    </h3>
                    
                    {description && (
                        <p className="text-foreground/50 dark:text-foreground/40 text-lg leading-relaxed italic mb-10 font-serif">
                            "{description}"
                        </p>
                    )}

                    {/* Custom Content Slot */}
                    {children && (
                        <div className="w-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    )}

                    {/* Action Palette */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full mt-4">
                        <SecondaryBtn
                            onClick={onClose}
                            fullWidth
                            size="lg"
                            className="!border-white/10 !text-foreground/60 hover:!bg-white/5"
                        >
                            {cancelText}
                        </SecondaryBtn>
                        <PrimaryBtn
                            onClick={() => {
                                onConfirm();
                                onClose(); 
                            }}
                            fullWidth
                            size="lg"
                            icon={current.confirmIcon}
                            className={current.btnClass}
                        >
                            {confirmText}
                        </PrimaryBtn>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
