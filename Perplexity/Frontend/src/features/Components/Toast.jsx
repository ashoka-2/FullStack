import React, { useEffect, useState } from 'react';
import { 
  RiErrorWarningLine, 
  RiCheckboxCircleLine, 
  RiInformationLine, 
  RiCloseLine 
} from '@remixicon/react';

const Toast = ({ message, type = 'error', onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); 
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    error: {      bg: 'bg-[#1a1010] dark:bg-[#1a1010] border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-100',
      icon: <RiErrorWarningLine className="w-5 h-5 text-red-500" />
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-[#101a14] border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-100',
      icon: <RiCheckboxCircleLine className="w-5 h-5 text-emerald-500" />
    },
    info: {
      bg: 'bg-blue-50 dark:bg-[#10161a] border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-100',
      icon: <RiInformationLine className="w-5 h-5 text-blue-500" />
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-md ${styles[type].bg}`}
      >
        <div className="shrink-0">
          {styles[type].icon}
        </div>
        <div className="flex-1 text-sm font-semibold tracking-tight">
          {message}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="shrink-0 ml-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <RiCloseLine className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
