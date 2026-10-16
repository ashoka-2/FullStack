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
import PrimaryButton from '../../Components/PrimaryButton';
import { Group, GroupLabel } from '../../Components/GroupedList';

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
    <form onSubmit={handleSaveProfile} className="space-y-7">
      
      {/* ── Avatar Section (Minimal AI-UI 96dp centered Avatar) ── */}
      <div className="flex flex-col items-center text-center p-6 rounded-[28px] bg-[var(--surface)] border border-[var(--line)]">
        <div className="relative mb-4">
          <img 
            src={avatarUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-[var(--line-strong)] shadow-sm bg-[var(--surface-2)]"
          />
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center shadow-md">
            <RiCameraLine size={16} />
          </div>
        </div>

        <p className="text-base font-semibold text-[var(--text)]">
          {username || 'Anonymous User'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {user?.email}
        </p>

        {/* Preset Avatars Row */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-[var(--text-subtle)] font-medium mr-1">Presets:</span>
          {PRESET_AVATARS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAvatarUrl(preset)}
              className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                avatarUrl === preset ? 'border-[var(--accent)] scale-110 shadow-sm' : 'border-[var(--line)] opacity-60 hover:opacity-100'
              }`}
              title={`Avatar preset ${i + 1}`}
            >
              <img src={preset} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Form Inputs (Minimal AI-UI Grouped Fields) ── */}
      <div>
        <GroupLabel>Identity Details</GroupLabel>
        <div className="flex flex-col gap-3">
          {/* Avatar URL Input */}
          <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">
              Avatar Image URL
            </label>
            <input 
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-4 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono text-xs"
            />
          </div>

          {/* Username */}
          <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">
              Username
            </label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-4 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
            />
          </div>

          {/* Email (Read-Only) */}
          <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5 opacity-80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <span>Email Address</span>
                <RiLock2Line size={13} />
              </label>
              <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)] tracking-wider">
                Locked
              </span>
            </div>
            <input 
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full px-4 text-sm text-[var(--text-muted)] cursor-not-allowed select-none font-mono"
            />
            <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">
              Email is permanently tied to your account identity.
            </p>
          </div>
        </div>
      </div>

      {/* ── Account Badges ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] text-xs text-[var(--text-muted)]">
          <RiShieldCheckLine size={14} className="text-[var(--accent-text)]" />
          <span>Provider: <strong className="text-[var(--text)] capitalize">{user?.authProvider || 'Email'}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] text-xs text-[var(--text-muted)]">
          <RiCheckLine size={14} className="text-[var(--success)]" />
          <span>Status: <strong className="text-[var(--success)]">{user?.verified ? 'Verified Account' : 'Standard'}</strong></span>
        </div>
      </div>

      {/* ── Submit Action ── */}
      <div className="pt-2">
        <PrimaryButton
          type="submit"
          disabled={loading}
          loading={loading}
          icon={RiSaveLine}
          iconPosition="left"
          fullWidth
          size="md"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </PrimaryButton>
      </div>

    </form>
  );
};

export default ProfileSettingsForm;
