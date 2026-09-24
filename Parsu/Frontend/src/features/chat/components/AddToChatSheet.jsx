import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  RiCloseLine,
  RiCameraLine,
  RiImageLine,
  RiVideoLine,
  RiFileTextLine,
  RiGlobalLine,
  RiNodeTree,
  RiHistoryLine,
  RiArrowRightSLine,
  RiFullscreenLine,
  RiFullscreenExitLine
} from '@remixicon/react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, useDragControls } from 'motion/react';

/**
 * AddToChatSheet Component
 * - Spring slide-up animation
 * - Drag downwards on top handle to dismiss
 * - Non-interfering clicks on action buttons and toggles
 * - Web Search & Memory toggles synced with global state
 * - 4 Quick Media Pickers: Camera, Photos, Videos, Files
 */
const AddToChatSheet = ({
  isOpen,
  onClose,
  onPickCamera,
  onPickPhotos,
  onPickVideos,
  onPickFiles,
  webSearch,
  onToggleWebSearch,
  memoryEnabled,
  onToggleMemory
}) => {
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isSidebarCollapsed = useSelector((state) => state.chat?.isSidebarCollapsed);
  const dragControls = useDragControls();

  // Reset full screen on close
  useEffect(() => {
    if (!isOpen) {
      setIsFullScreen(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9995] pointer-events-none">
          {/* Backdrop with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer pointer-events-auto"
            onClick={onClose}
            aria-label="Close backdrop"
          />

          {/* Centered Modal Workspace Container */}
          <div
            className={`fixed inset-0 ${
              isSidebarCollapsed ? 'lg:left-16' : 'lg:left-56'
            } flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
          >

          {/* Sheet / Modal Container */}
          <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 450) {
                onClose();
              }
            }}
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative w-full ${
              isFullScreen
                ? 'h-[100dvh] rounded-none pt-4'
                : 'sm:max-w-md max-h-[92vh] rounded-t-[32px] sm:rounded-[32px]'
            } bg-[#121214] dark:bg-[var(--bg-surface)] border-t sm:border border-zinc-800/80 p-5 sm:p-6 pb-8 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl select-none overflow-y-auto custom-scrollbar pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle (Only region that initiates vertical drag) */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="w-14 h-1.5 rounded-full bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 mx-auto mb-3 cursor-grab active:cursor-grabbing transition-colors touch-none" 
              title="Drag down to close"
            />

            {/* Header: Close Button, Centered Title & Mobile Fullscreen Button */}
            <div className="flex items-center justify-between mb-5 relative">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Close"
              >
                <RiCloseLine size={22} />
              </button>

              <h2 className="text-[17px] font-semibold text-zinc-100 tracking-tight absolute left-1/2 -translate-x-1/2 pointer-events-none">
                Add to chat
              </h2>

              {/* Mobile Full-Screen Mode Toggle */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setIsFullScreen((prev) => !prev)}
                  className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  title={isFullScreen ? "Exit full screen" : "Make full screen"}
                  aria-label="Toggle full screen"
                >
                  {isFullScreen ? <RiFullscreenExitLine size={19} /> : <RiFullscreenLine size={19} />}
                </button>
                <div className="hidden sm:block w-8" />
              </div>
            </div>

            {/* Top 4 Squircle Action Cards */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-5">
              {/* 1. Camera */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPickCamera?.();
                }}
                className="group flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 border border-white/5 transition-all cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 transition-colors shadow-inner">
                  <RiCameraLine size={22} />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Camera
                </span>
              </button>

              {/* 2. Photos */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPickPhotos?.();
                }}
                className="group flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 border border-white/5 transition-all cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 transition-colors shadow-inner">
                  <RiImageLine size={22} />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Photos
                </span>
              </button>

              {/* 3. Videos */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPickVideos?.();
                }}
                className="group flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 border border-white/5 transition-all cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 transition-colors shadow-inner">
                  <RiVideoLine size={22} />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Videos
                </span>
              </button>

              {/* 4. Files */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPickFiles?.();
                }}
                className="group flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] active:scale-95 border border-white/5 transition-all cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 transition-colors shadow-inner">
                  <RiFileTextLine size={22} />
                </div>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Files
                </span>
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-2">
              {/* Row 1: Web search */}
              <div
                onClick={() => onToggleWebSearch?.()}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] border border-white/5 transition-colors cursor-pointer group select-none active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 shrink-0 transition-colors">
                    <RiGlobalLine size={19} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      Web search
                    </span>
                    <span className="text-xs text-zinc-500">
                      {webSearch ? 'Live internet search active (Tavily)' : 'Pure AI internal model knowledge'}
                    </span>
                  </div>
                </div>

                {/* iOS-Style Toggle Switch */}
                <div
                  role="switch"
                  aria-checked={webSearch}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    webSearch ? 'bg-[var(--accent-cyan)]' : 'bg-[#3a3a3c]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      webSearch ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Connectors (Navigates to /social-connections) */}
              <div
                onClick={() => {
                  onClose();
                  navigate('/social-connections');
                }}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#242426] border border-white/5 transition-colors cursor-pointer group select-none active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 shrink-0 transition-colors">
                    <RiNodeTree size={19} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      Connectors
                    </span>
                    <span className="text-xs text-zinc-500">
                      Connect social platforms & third-party apps
                    </span>
                  </div>
                </div>
                <RiArrowRightSLine size={20} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
              </div>

              {/* Row 3: Memory */}
              <div
                onClick={() => onToggleMemory?.()}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] border border-white/5 transition-colors cursor-pointer group select-none active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#2c2c2e] group-hover:bg-[#38383c] flex items-center justify-center text-zinc-200 shrink-0 transition-colors">
                    <RiHistoryLine size={19} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      Memory
                    </span>
                    <span className="text-xs text-zinc-500">
                      {memoryEnabled ? 'Recalls context across all your chats' : 'Isolated to current chat only'}
                    </span>
                  </div>
                </div>

                {/* iOS-Style Toggle Switch */}
                <div
                  role="switch"
                  aria-checked={memoryEnabled}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    memoryEnabled ? 'bg-[var(--accent-cyan)]' : 'bg-[#3a3a3c]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      memoryEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AddToChatSheet;
