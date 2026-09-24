import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import { useAuth } from '../hook/useAuth';
import {
  RiShieldKeyholeLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
  RiLoader4Line
} from '@remixicon/react';

const PasswordChangeForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { handleChangePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      dispatch(addToast({ message: "Please enter your current password", type: "error" }));
      return;
    }
    if (newPassword.length < 6) {
      dispatch(addToast({ message: "New password must be at least 6 characters long", type: "error" }));
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      dispatch(addToast({ message: "New password must contain at least one uppercase letter", type: "error" }));
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      dispatch(addToast({ message: "New password must contain at least one number", type: "error" }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(addToast({ message: "New passwords do not match", type: "error" }));
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await handleChangePassword({ currentPassword, newPassword });
      dispatch(addToast({ message: res?.message || "Password updated successfully!", type: "success" }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Change password error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to update password";
      dispatch(addToast({ message: errMsg, type: "error" }));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[var(--bg-surface)] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
          <RiShieldKeyholeLine size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Security & Password</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Update your account password to protect your conversations and account</p>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 ml-0.5">
              Current Password <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                {showCurrentPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 ml-0.5">
              New Password <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6, uppercase & number"
                className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 ml-0.5">
              Confirm Password <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                {showConfirmPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Password must contain at least 6 characters, one uppercase letter, and one number.
          </p>
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-[var(--accent-cyan)] to-[#0ea5e9] hover:from-[#199eb0] hover:to-[#0284c7] text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/10 disabled:opacity-60 shrink-0"
          >
            {passwordLoading ? (
              <>
                <RiLoader4Line size={16} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <RiLockPasswordLine size={16} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
