import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../../app/toast.slice';

const Toast = ({ id, message, type }) => {
    const dispatch = useDispatch();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 4600); // Trigger exit animation slightly before removal

        const removeTimer = setTimeout(() => {
            dispatch(removeToast(id));
        }, 5000); // Match absolute lifecycle

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [dispatch, id]);

    const handleManualDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            dispatch(removeToast(id));
        }, 300); // wait for exit animation
    };

    const getToastStyles = () => {
        switch (type) {
            case 'error':
                return 'border-red-500/50 bg-white/90 dark:bg-red-950/20 text-red-900 dark:text-red-200 shadow-red-500/10';
            case 'success':
                return 'border-emerald-500/50 bg-white/90 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 shadow-emerald-500/10';
            case 'info':
                return 'border-blue-500/50 bg-white/90 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 shadow-blue-500/10';
            default:
                return 'border-border-theme bg-white/90 dark:bg-surface/90 text-foreground shadow-black/5';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <i className="ri-error-warning-line text-red-500 text-xl"></i>;
            case 'success':
                return <i className="ri-checkbox-circle-line text-emerald-500 text-xl"></i>;
            case 'info':
                return <i className="ri-information-line text-blue-500 text-xl"></i>;
            default:
                return <i className="ri-notification-3-line text-accent text-xl"></i>;
        }
    };

    return (
        <div 
            className={`flex items-center gap-4 p-4 pr-12 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${
                isExiting ? 'toast-slide-out' : 'toast-slide-in'
            } ${getToastStyles()}`}
            style={{ width: 'max-content', minWidth: '320px', maxWidth: '450px' }}
        >
            <div className="flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold tracking-tight">{message}</p>
            </div>
            <button 
                onClick={handleManualDismiss}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            >
                <i className="ri-close-line text-lg"></i>
            </button>
        </div>
    );
};

export const ToastContainer = () => {
    const toasts = useSelector((state) => state.toast.toasts);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
};
