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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-[#121212] border border-white/5 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                >
                    <RiCloseLine size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                        <RiAlertLine size={32} />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-3">
                        {title}
                    </h2>
                    
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-bold tracking-wide"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-bold tracking-wide shadow-lg shadow-red-500/20"
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
