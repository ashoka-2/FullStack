import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Are you sure?", 
    description = "This action cannot be undone. Please confirm to proceed.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info" // 'info', 'danger', 'success'
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    const accentColors = {
        info: 'text-accent border-accent/20 bg-accent/5',
        danger: 'text-error border-error/20 bg-error/5',
        success: 'text-success border-success/20 bg-success/5'
    };

    const buttonColors = {
        info: 'bg-accent text-accent-content',
        danger: 'bg-error text-white',
        success: 'bg-success text-white'
    };

    return createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-default"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div 
                className={`relative w-full max-w-md bg-surface border border-border-theme rounded-3xl p-8 shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 ${accentColors[type]}`}>
                        <i className={`${type === 'danger' ? 'ri-alert-line' : type === 'success' ? 'ri-checkbox-circle-line' : 'ri-question-mark'} text-3xl`}></i>
                    </div>

                    <h3 className="text-2xl font-bold tracking-tight text-foreground mb-3">{title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed italic">{description}</p>

                    <div className="flex items-center gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-xl border border-border-theme font-bold text-gray-500 hover:bg-surface-variant transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-accent/40 hover:-translate-y-1 active:translate-y-0 transition-all ${buttonColors[type]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
