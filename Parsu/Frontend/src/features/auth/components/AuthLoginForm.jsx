import React from 'react';
import {
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiAlertLine,
  RiRefreshLine
} from '@remixicon/react';
import PrimaryButton from '../../Components/PrimaryButton';

export default function AuthLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  unverifiedEmailError,
  resendStatus,
  onResendEmail,
  onSubmit,
  onSwitchMode,
  onFieldFocus,
  onFieldBlur,
  onPasswordTyping,
  triggerTypingNod,
  setBlobMood,
  setBlobGaze,
  setBubbleText,
  setIsPasswordSleeping,
  setClosedEyes,
  activeField,
  isPasswordSleeping
}) {
  return (
    <>
      {/* Unverified Email Notice */}
      {unverifiedEmailError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <RiAlertLine size={16} className="shrink-0 text-amber-400" />
            <span>Email not verified yet. Please verify to log in.</span>
          </div>
          <button
            type="button"
            onClick={onResendEmail}
            disabled={resendStatus === 'Sending...'}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 active:scale-[0.97] transition-all shrink-0 cursor-pointer text-xs flex items-center gap-1"
          >
            <RiRefreshLine size={12} className={resendStatus === 'Sending...' ? 'animate-spin' : ''} />
            <span>{resendStatus === 'Sent!' ? '✓ Sent' : resendStatus === 'Sending...' ? 'Sending...' : 'Resend'}</span>
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--muted)] ml-1">
            Email Address <span className="text-red-400 font-bold ml-0.5">*</span>
          </label>
          <div className="relative">
            <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                triggerTypingNod();
              }}
              onFocus={() => onFieldFocus('email')}
              onBlur={onFieldBlur}
              placeholder="name@example.com"
              className="w-full h-11 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 rounded-full pl-10 pr-4 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] transition-all outline-none"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-medium text-[var(--muted)]">
              Password <span className="text-red-400 font-bold ml-0.5">*</span>
            </label>
            <button
              type="button"
              onClick={() => onSwitchMode('forgot')}
              className="text-xs text-[var(--accent)] hover:underline cursor-pointer font-medium"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => onPasswordTyping(e.target.value, false)}
              onFocus={() => onFieldFocus('password')}
              onBlur={onFieldBlur}
              placeholder="••••••••"
              className="w-full h-11 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 rounded-full pl-10 pr-10 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const next = !showPassword;
                setShowPassword(next);
                if (next) {
                  setIsPasswordSleeping(false);
                  setClosedEyes(false);
                  setBlobMood('shy');
                  setBlobGaze({ x: -20, y: 2 });
                  setBubbleText("Peekaboo! 🫣");
                } else {
                  setClosedEyes(false);
                  setIsPasswordSleeping(false);
                  setBlobMood('curious');
                  setBlobGaze({ x: 28, y: 8 });
                  setBubbleText("Masked again! Eyes open, waiting for you! 👀");
                }
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--fg)] cursor-pointer p-0.5"
            >
              {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Sign In Button */}
        <PrimaryButton
          type="submit"
          disabled={loading}
          loading={loading}
          fullWidth
          size="md"
          className="mt-2"
          onMouseEnter={() => !loading && setBlobMood('happy')}
          onMouseLeave={() => !loading && setBlobMood(activeField ? (activeField.includes('password') && isPasswordSleeping ? 'password' : 'curious') : 'curious')}
        >
          {loading ? 'Signing in...' : 'Sign In to Parsu'}
        </PrimaryButton>
      </form>
    </>
  );
}
