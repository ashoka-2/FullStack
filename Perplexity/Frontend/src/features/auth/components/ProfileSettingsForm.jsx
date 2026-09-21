import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import { setUser } from '../auth.slice';
import { updateUserProfile } from '../service/auth.api';
import {
  RiUser3Line,
  RiLock2Line,
  RiSaveLine,
  RiLoader4Line,
  RiShieldCheckLine,
  RiCheckLine,
  RiCameraLine
} from '@remixicon/react';

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zoe"
];

const ProfileSettingsForm = ({ user, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePic || '');
  const [preferredModel, setPreferredModel] = useState(user?.preferredModel || 'gemini-1.5-flash');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.profilePic || '');
      setPreferredModel(user.preferredModel || 'gemini-1.5-flash');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      dispatch(addToast({ message: "Username cannot be empty", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserProfile({
        username: username.trim(),
        profilePic: avatarUrl.trim(),
        preferredModel
      });

      if (res.success && res.user) {
        dispatch(setUser(res.user));
        dispatch(addToast({ message: "Profile updated successfully!", type: "success" }));
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Save profile error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to update profile";
      dispatch(addToast({ message: errMsg, type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
        <div className="w-10 h-10 rounded-2xl bg-[#20b8cd]/10 text-[#20b8cd] flex items-center justify-center font-bold">
          <RiUser3Line size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Profile Information</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage your public persona, avatar, and personal details</p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Avatar Preview & Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group">
            <img 
              src={avatarUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
              alt="Profile Avatar"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-zinc-200 dark:border-white/10 shadow-sm"
            />
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer pointer-events-none">
              <RiCameraLine size={24} className="text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Avatar Image URL
            </label>
            <input 
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all"
            />
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] text-zinc-500 font-medium">Or pick an avatar:</span>
              {PRESET_AVATARS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    avatarUrl === preset ? 'border-[#20b8cd] ring-2 ring-[#20b8cd]/30 scale-105' : 'border-zinc-200 dark:border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Username (Editable) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 ml-0.5">
              Username
            </label>
            <div className="relative">
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#20b8cd] focus:ring-1 focus:ring-[#20b8cd] transition-all font-medium"
              />
            </div>
          </div>

          {/* Email (Strictly Read-Only with Lock) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-0.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                <span>Email Address</span>
                <RiLock2Line size={13} className="text-zinc-400" />
              </label>
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                Read-Only
              </span>
            </div>
            <div className="relative">
              <input 
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed select-none font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 ml-0.5">
              Email address cannot be modified to ensure account security.
            </p>
          </div>
        </div>

        {/* Account Meta Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5">
            <RiShieldCheckLine size={14} className="text-emerald-500" />
            <span>Auth: <strong className="text-zinc-800 dark:text-zinc-200 capitalize">{user?.authProvider || 'Email'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5">
            <RiCheckLine size={14} className="text-emerald-500" />
            <span>Status: <strong className="text-emerald-500">{user?.verified ? 'Verified Account' : 'Pending Verification'}</strong></span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {loading ? (
              <>
                <RiLoader4Line size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <RiSaveLine size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettingsForm;
