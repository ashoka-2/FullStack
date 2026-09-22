import React, { useEffect } from 'react';
import {
  RiCloseLine,
  RiCameraLine,
  RiImageLine,
  RiVideoLine,
  RiFileTextLine,
  RiInboxArchiveLine,
  RiGlobalLine,
  RiNodeTree,
  RiHistoryLine,
  RiArrowRightSLine
} from '@remixicon/react';
import { useNavigate } from 'react-router';

/**
 * AddToChatSheet Component
 * Exact reproduction of the mobile 'Add to chat' bottom sheet design from the user screenshots:
 * - Rounded grab handle at the top
 * - Close '✕' button and 'Add to chat' title
 * - 4 Squircle Action Cards: Camera, Photos, Videos, Files
 * - List options: Add to project (None >), Web search (toggle), Connectors (>), Memory (toggle)
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9995] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 cursor-pointer"
        onClick={onClose}
        aria-label="Close backdrop"
      />

      {/* Sheet / Modal Container */}
      <div
        className="relative w-full sm:max-w-md bg-[#121214] dark:bg-[#121214] border-t sm:border border-zinc-800/80 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 pb-8 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull / Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto mb-4 sm:hidden" />

        {/* Header: Close Button & Centered Title */}
        <div className="flex items-center justify-between mb-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <RiCloseLine size={22} />
          </button>

          <h2 className="text-[17px] font-semibold text-zinc-100 tracking-tight absolute left-1/2 -translate-x-1/2">
            Add to chat
          </h2>

          <div className="w-8" />
        </div>

        {/* Top 4 Squircle Action Cards */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-6">
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

          {/* 3. Videos (Requested Video Option) */}
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

        {/* Vertical Options List */}
        <div className="space-y-2">
          {/* Row 1: Add to project */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#242426] border border-white/5 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-zinc-200 shrink-0">
                <RiInboxArchiveLine size={19} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-zinc-200 group-hover:text-white">
                  Add to project
                </span>
                <span className="text-xs text-zinc-500 truncate">
                  None
                </span>
              </div>
            </div>
            <RiArrowRightSLine size={20} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
          </div>

          {/* Row 2: Web search (Toggle) */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] border border-white/5 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-zinc-200 shrink-0">
                <RiGlobalLine size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-zinc-200">
                  Web search
                </span>
                <span className="text-xs text-zinc-500">
                  {webSearch ? 'Live internet search active' : 'Pure AI internal knowledge'}
                </span>
              </div>
            </div>

            {/* iOS-Style Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={webSearch}
              onClick={onToggleWebSearch}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                webSearch ? 'bg-[#2970ff]' : 'bg-[#3a3a3c]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  webSearch ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 3: Connectors */}
          <div
            onClick={() => {
              onClose();
              navigate('/socials');
            }}
            className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#242426] border border-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-zinc-200 shrink-0">
                <RiNodeTree size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-zinc-200 group-hover:text-white">
                  Connectors
                </span>
                <span className="text-xs text-zinc-500">
                  Manage social and third-party integrations
                </span>
              </div>
            </div>
            <RiArrowRightSLine size={20} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
          </div>

          {/* Row 4: Memory (Toggle) */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1c1c1e] border border-white/5 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-zinc-200 shrink-0">
                <RiHistoryLine size={19} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-zinc-200">
                  Memory
                </span>
                <span className="text-xs text-zinc-500">
                  {memoryEnabled ? 'Recalls context across all your chats' : 'Isolated to current chat only'}
                </span>
              </div>
            </div>

            {/* iOS-Style Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={memoryEnabled}
              onClick={onToggleMemory}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                memoryEnabled ? 'bg-[#2970ff]' : 'bg-[#3a3a3c]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  memoryEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToChatSheet;
