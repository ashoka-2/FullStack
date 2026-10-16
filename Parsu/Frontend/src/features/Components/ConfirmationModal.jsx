import React from 'react';
import { RiDeleteBinLine, RiCloseLine, RiAlertLine } from '@remixicon/react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Delete Chat", 
    message = "Are you sure you want to delete this? This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            {/* Backdrop Scrim */}
            <div 
                className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />
            
            {/* Modal Dialog Content */}
            <div className="relative w-full max-w-[340px] bg-[var(--raised)] border border-[var(--line)] rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 select-none">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                    aria-label="Close"
                >
                    <RiCloseLine size={18} />
                </button>

                <div className="flex flex-col items-center text-center pt-2">
                    <div className="w-12 h-12 rounded-full bg-[var(--danger)]/12 flex items-center justify-center text-[var(--danger)] mb-4">
                        <RiAlertLine size={24} />
                    </div>

                    <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
                        {title}
                    </h2>
                    
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                        {message}
                    </p>

                    <div className="flex gap-2.5 w-full">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-full bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] transition-all text-sm font-medium cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 h-11 rounded-full bg-[var(--danger)] text-white hover:opacity-90 transition-all text-sm font-medium cursor-pointer shadow-sm"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
