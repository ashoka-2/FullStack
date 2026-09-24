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
          <label className="text-xs font-medium text-zinc-300 ml-0.5">
            Email Address <span className="text-red-400 font-bold ml-0.5">*</span>
          </label>
          <div className="relative">
            <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
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
              className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between ml-0.5">
            <label className="text-xs font-medium text-zinc-300">
              Password <span className="text-red-400 font-bold ml-0.5">*</span>
            </label>
            <button
              type="button"
              onClick={() => onSwitchMode('forgot')}
              className="text-xs text-[var(--accent-cyan)] hover:underline cursor-pointer font-medium"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => onPasswordTyping(e.target.value, false)}
              onFocus={() => onFieldFocus('password')}
              onBlur={onFieldBlur}
              placeholder="••••••••"
              className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-0.5"
            >
              {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          onMouseEnter={() => !loading && setBlobMood('happy')}
          onMouseLeave={() => !loading && setBlobMood(activeField ? (activeField.includes('password') && isPasswordSleeping ? 'password' : 'curious') : 'curious')}
          className="w-full h-11 mt-2 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
        >
          {loading ? (
            <>
              <RiLoader4Line className="animate-spin w-4 h-4" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In to Parsu</span>
          )}
        </button>
      </form>
    </>
  );
}
