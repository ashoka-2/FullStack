import React, { useState, useRef } from 'react';
import {
  RiCloseLine,
  RiSparklingFill,
  RiUploadCloudLine,
  RiSendPlaneFill,
  RiLoader4Line,
  RiCheckFill,
  RiAlertLine,
  RiImageAddLine,
  RiVideoAddLine,
  RiDeleteBinLine,
  RiInstagramLine,
  RiFacebookBoxLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiYoutubeLine,
  RiTiktokLine,
  RiTimeLine,
  RiExternalLinkLine
} from '@remixicon/react';
import { publishMedia, generateCaption, uploadSocialMediaFiles } from '../service/social.api';

const PLATFORM_ICONS = {
  instagram: RiInstagramLine,
  facebook: RiFacebookBoxLine,
  twitter: RiTwitterXLine,
  linkedin: RiLinkedinBoxLine,
  youtube: RiYoutubeLine,
  tiktok: RiTiktokLine,
};

export default function CreatePostModal({ connectedAccounts = [], onClose, onSuccess }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState(
    connectedAccounts.map(a => a.platform)
  );
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]); // Array of { file, preview, url, isVideo }
  const [postMode, setPostMode] = useState('together');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const fileInputRef = useRef(null);

  const togglePlatform = (platformId) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(prev => prev.filter(p => p !== platformId));
    } else {
      setSelectedPlatforms(prev => [...prev, platformId]);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingMedia(true);
    setErrorMessage('');

    try {
      // 1. Upload files directly to ImageKit CDN via social endpoint
      const uploadRes = await uploadSocialMediaFiles(files);
      const cdnMediaList = uploadRes?.media || [];

      const newMedia = files.map((file, idx) => {
        const isVideo = file.type.startsWith('video/');
        const preview = URL.createObjectURL(file);
        const cdnItem = cdnMediaList[idx];
        return {
          file,
          preview,
          url: cdnItem?.url || preview,
          isVideo,
          name: file.name
        };
      });

      setMediaFiles(prev => [...prev, ...newMedia]);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload media to CDN. Please check your network or try again.");
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiCaption = async () => {
    setIsGeneratingCaption(true);
    setErrorMessage('');
    try {
      const primaryPlatform = selectedPlatforms[0] || 'social media';
      const mediaUrls = mediaFiles.map(m => m.url);
      const res = await generateCaption({
        context: aiTopic || caption,
        platform: primaryPlatform,
        mediaUrls,
        tone: 'engaging'
      });

      if (res?.caption) {
        setCaption(res.caption);
        setShowAiInput(false);
      }
    } catch (err) {
      setErrorMessage("Failed to generate AI caption.");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) {
      setErrorMessage("Please select at least one social media platform.");
      return;
    }
    if (mediaFiles.length === 0 && !caption.trim()) {
      setErrorMessage("Please provide a caption or attach media.");
      return;
    }

    if (isScheduleEnabled && scheduledDateTime) {
      const scheduledMs = new Date(scheduledDateTime).getTime();
      if (isNaN(scheduledMs) || scheduledMs <= Date.now()) {
        setErrorMessage("Please select a future date and time for scheduled publishing.");
        return;
      }
    }

    setIsPublishing(true);
    setErrorMessage('');
    setPublishResult(null);

    try {
      const mediaUrls = mediaFiles.map(m => m.url);
      const isAnyVideo = mediaFiles.some(m => m.isVideo);

      const res = await publishMedia({
        platforms: selectedPlatforms,
        mediaUrls,
        mediaUrl: mediaUrls[0] || '',
        caption: caption.trim(),
        postMode,
        isVideo: isAnyVideo,
        scheduledTime: (isScheduleEnabled && scheduledDateTime) ? new Date(scheduledDateTime).toISOString() : null
      });

      setPublishResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to publish content.";
      setErrorMessage(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[var(--bg-surface)] border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--color-clear-hanada)] to-[var(--accent-cyan)] flex items-center justify-center text-white shadow-md shadow-[var(--accent-cyan)]/20">
              <RiSendPlaneFill size={16} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Create & Publish Post
              </h2>
              <p className="text-xs text-zinc-500">Universal multi-channel publisher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Target Platforms Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Select Destinations ({selectedPlatforms.length} chosen)
            </label>

            {connectedAccounts.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <RiAlertLine size={16} className="shrink-0" />
                <span>No social accounts connected yet. Connect accounts in the Social Hub first!</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {connectedAccounts.map(account => {
                  const Icon = PLATFORM_ICONS[account.platform] || RiSendPlaneFill;
                  const isSelected = selectedPlatforms.includes(account.platform);
                  return (
                    <button
                      key={account.platform}
                      type="button"
                      onClick={() => togglePlatform(account.platform)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-sm shadow-[var(--accent-cyan)]/20 scale-[1.02]'
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="capitalize">{account.platform}</span>
                      {account.platformUsername && (
                        <span className="opacity-70 text-[10px]">(@{account.platformUsername})</span>
                      )}
                      {isSelected && <RiCheckFill size={14} className="ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Caption & AI Enhancement */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Post Caption
              </label>
              <button
                type="button"
                onClick={() => setShowAiInput(!showAiInput)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-cyan)] hover:underline cursor-pointer"
              >
                <RiSparklingFill size={13} />
                <span>{showAiInput ? "Close AI Copilot" : "✨ Write with AI"}</span>
              </button>
            </div>

            {/* AI Prompt Input Bar */}
            {showAiInput && (
              <div className="p-3 mb-2.5 rounded-2xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="What is this post about? (e.g., product launch, tips, travel)"
                  className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isGeneratingCaption}
                  onClick={handleAiCaption}
                  className="px-3 py-1 rounded-xl bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-hover)] text-black text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingCaption ? (
                    <RiLoader4Line size={13} className="animate-spin" />
                  ) : (
                    <RiSparklingFill size={13} />
                  )}
                  <span>Generate</span>
                </button>
              </div>
            )}

            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption, thoughts, emojis, and hashtags..."
              className="w-full bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--accent-cyan)] transition-all resize-none"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-zinc-400">
              <span>Supports hashtags, emojis, and formatting</span>
              <span>{caption.length} characters</span>
            </div>
          </div>

          {/* Media Upload Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Attached Media (Photos or Videos)
            </label>

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 dark:border-white/15 hover:border-[var(--accent-cyan)] dark:hover:border-[var(--accent-cyan)] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-[var(--accent-cyan)]/5"
            >
              <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <RiUploadCloudLine size={28} className="text-[var(--accent-cyan)]" />
                <span className="text-xs font-semibold">
                  {isUploadingMedia ? "Uploading media..." : "Click or drag images & videos here"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  Supports JPG, PNG, MP4, MOV (YouTube Shorts, Instagram Reels, Carousels)
                </span>
              </div>
            </div>

            {/* Previews Grid */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                {mediaFiles.map((item, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 aspect-square bg-black">
                    {item.isVideo ? (
                      <video src={item.preview} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.preview} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                    )}

                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white uppercase">
                      {item.isVideo ? "Video" : "Photo"}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <RiDeleteBinLine size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carousel Mode toggle for multi-image */}
          {mediaFiles.length > 1 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Publishing Mode:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPostMode('together')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    postMode === 'together'
                      ? 'bg-[var(--accent-cyan)] text-black shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Single Carousel / Album
                </button>
                <button
                  type="button"
                  onClick={() => setPostMode('separately')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    postMode === 'separately'
                      ? 'bg-[var(--accent-cyan)] text-black shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Individual Posts
                </button>
              </div>
            </div>
          )}

          {/* Native Platform Scheduling */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiTimeLine size={16} className="text-[var(--accent-cyan)]" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Schedule Release (Native Platform Timing)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduleEnabled}
                  onChange={(e) => setIsScheduleEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-[var(--accent-cyan)]"></div>
              </label>
            </div>

            {isScheduleEnabled && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full bg-white dark:bg-black/30 border border-zinc-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--accent-cyan)]"
                />
                <p className="text-[10px] text-zinc-400">
                  Platforms like YouTube natively hold your video private and release it publicly at this designated time.
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
              <RiAlertLine size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Result Feedback */}
          {publishResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <RiCheckFill size={16} />
                <span>{publishResult.message || "Content published successfully!"}</span>
              </div>
              {publishResult.results?.successful?.map((s, i) => (
                <div key={i} className="text-[11px] opacity-90 pl-5 flex items-center justify-between flex-wrap gap-1">
                  <span>
                    ✓ {s.platform}: {s.scheduledAt ? 'Scheduled' : 'Published'} {s.postType}
                    {s.scheduledAt && ` (Goes live: ${new Date(s.scheduledAt).toLocaleString()})`}
                  </span>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-[var(--accent-cyan)] hover:text-[#1da9bc] flex items-center gap-1 ml-2 cursor-pointer"
                    >
                      <span>View Live Post</span>
                      <RiExternalLinkLine size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPublishing || connectedAccounts.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-cyan)] to-[#0ea5e9] hover:from-[#1da9bc] hover:to-[#0284c7] text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RiLoader4Line size={16} className="animate-spin" />
                  <span>Publishing Across Channels...</span>
                </>
              ) : (
                <>
                  <RiSendPlaneFill size={16} />
                  <span>Publish to {selectedPlatforms.length} Channel{selectedPlatforms.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
