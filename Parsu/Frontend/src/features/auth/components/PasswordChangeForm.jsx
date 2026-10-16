import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../utils/toast.slice';
import { useAuth } from '../hook/useAuth';
import {
  RiShieldKeyholeLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
} from '@remixicon/react';
import PrimaryButton from '../../Components/PrimaryButton';
import { GroupLabel } from '../../Components/GroupedList';

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
    <form onSubmit={handleUpdatePassword} className="space-y-7">
      
      {/* ── Security Banner ── */}
      <div className="flex items-center gap-3.5 p-5 rounded-[28px] bg-[var(--surface)] border border-[var(--line)]">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent-text)] shrink-0">
          <RiShieldKeyholeLine size={20} />
        </div>
        <div>
          <h2 className="text-[15px] font-medium text-[var(--text)]">Account Credentials</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Use at least 6 characters with uppercase and numbers</p>
        </div>
      </div>

      {/* ── Grouped Password Fields ── */}
      <div>
        <GroupLabel>Update Credentials</GroupLabel>
        <div className="flex flex-col gap-3">
          
          {/* Current Password */}
          <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">
              Current Password
            </label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full pl-4 pr-11 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer p-1"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">
              New Password
            </label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full pl-4 pr-11 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer p-1"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="p-4 rounded-[20px] bg-[var(--surface)] flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">
              Confirm New Password
            </label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-[var(--surface-2)] border border-[var(--line)] rounded-full pl-4 pr-11 text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer p-1"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Submit Action ── */}
      <div className="pt-2">
        <PrimaryButton
          type="submit"
          disabled={passwordLoading}
          loading={passwordLoading}
          icon={RiLockPasswordLine}
          iconPosition="left"
          fullWidth
          size="md"
        >
          {passwordLoading ? 'Updating…' : 'Update Password'}
        </PrimaryButton>
      </div>

    </form>
  );
};

export default PasswordChangeForm;
