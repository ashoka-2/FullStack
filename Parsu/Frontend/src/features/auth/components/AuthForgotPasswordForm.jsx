import React from 'react';
import {
  RiMailLine,
  RiKey2Line,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiShieldCheckLine
} from '@remixicon/react';

export default function AuthForgotPasswordForm({
  forgotStep,
  setForgotStep,
  email,
  setEmail,
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmNewPassword,
  setShowConfirmNewPassword,
  forgotLoading,
  forgotCooldown,
  onSendOtp,
  onVerifyOtpSubmit,
  onResetPasswordSubmit,
  onSwitchMode,
  onFieldFocus,
  onFieldBlur,
  onPasswordTyping,
  triggerTypingNod,
  setBlobMood
}) {
  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            forgotStep >= 1 
              ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-xs' 
              : 'bg-white/5 text-zinc-500'
          }`}>
            1
          </div>
          <span className={`text-xs font-medium ${forgotStep >= 1 ? 'text-white' : 'text-zinc-500'}`}>
            Email
          </span>
        </div>
        <div className={`h-[2px] flex-1 mx-2 rounded-full transition-all ${
          forgotStep >= 2 ? 'bg-[var(--accent-cyan)]' : 'bg-white/10'
        }`} />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            forgotStep >= 2 
              ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-xs' 
              : 'bg-white/5 text-zinc-500'
          }`}>
            2
          </div>
          <span className={`text-xs font-medium ${forgotStep >= 2 ? 'text-white' : 'text-zinc-500'}`}>
            OTP
          </span>
        </div>
        <div className={`h-[2px] flex-1 mx-2 rounded-full transition-all ${
          forgotStep === 3 ? 'bg-[var(--accent-cyan)]' : 'bg-white/10'
        }`} />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            forgotStep === 3 
              ? 'bg-[var(--accent-cyan)] text-zinc-950 shadow-xs' 
              : 'bg-white/5 text-zinc-500'
          }`}>
            3
          </div>
          <span className={`text-xs font-medium ${forgotStep === 3 ? 'text-white' : 'text-zinc-500'}`}>
            Reset
          </span>
        </div>
      </div>

      {/* Step 1: Enter Email */}
      {forgotStep === 1 && (
        <form onSubmit={onSendOtp} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 leading-relaxed">
            Enter your registered email address to receive a 6-digit OTP code to reset your password.
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 ml-0.5">
              Registered Email <span className="text-red-400 font-bold ml-0.5">*</span>
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

          <button
            type="submit"
            disabled={forgotLoading}
            onMouseEnter={() => !forgotLoading && setBlobMood('happy')}
            onMouseLeave={() => !forgotLoading && setBlobMood('curious')}
            className="w-full h-11 mt-1 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {forgotLoading ? (
              <>
                <RiLoader4Line className="animate-spin w-4 h-4" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Verification Code</span>
                <RiArrowRightLine size={16} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="w-full text-xs text-zinc-400 hover:text-white font-medium py-1.5 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RiArrowLeftLine size={14} /> Back to Sign In
          </button>
        </form>
      )}

      {/* Step 2: Enter & Validate OTP */}
      {forgotStep === 2 && (
        <form onSubmit={onVerifyOtpSubmit} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
            <span className="truncate mr-2">Sent to: <strong className="font-semibold text-white">{email}</strong></span>
            <button
              type="button"
              onClick={() => setForgotStep(1)}
              className="text-xs text-[var(--accent-cyan)] hover:underline font-semibold shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-0.5">
              <label className="text-xs font-medium text-zinc-300">
                6-Digit OTP Code <span className="text-red-400 font-bold ml-0.5">*</span>
              </label>
              <button
                type="button"
                disabled={forgotCooldown > 0 || forgotLoading}
                onClick={onSendOtp}
                className="text-xs text-[var(--accent-cyan)] hover:underline disabled:text-zinc-500 disabled:no-underline font-medium cursor-pointer"
              >
                {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend Code'}
              </button>
            </div>
            <div className="relative">
              <RiKey2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(val);
                  triggerTypingNod();
                }}
                onFocus={() => onFieldFocus('otp')}
                onBlur={onFieldBlur}
                placeholder="123456"
                className="w-full h-11 font-mono text-center tracking-[0.35em] font-bold bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-4 text-base text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-500 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotLoading || otp.trim().length !== 6}
            onMouseEnter={() => !forgotLoading && setBlobMood('happy')}
            onMouseLeave={() => !forgotLoading && setBlobMood('curious')}
            className="w-full h-11 mt-1 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {forgotLoading ? (
              <>
                <RiLoader4Line className="animate-spin w-4 h-4" />
                <span>Validating OTP...</span>
              </>
            ) : (
              <>
                <span>Validate & Continue</span>
                <RiShieldCheckLine size={16} />
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setForgotStep(1)}
              className="text-xs text-zinc-400 hover:text-white font-medium cursor-pointer flex items-center gap-1 active:scale-[0.97]"
            >
              <RiArrowLeftLine size={14} /> Back to Email
            </button>

            <button
              type="button"
              onClick={() => onSwitchMode('login')}
              className="text-xs text-zinc-400 hover:text-white font-medium cursor-pointer active:scale-[0.97]"
            >
              Sign In
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Create New Password */}
      {forgotStep === 3 && (
        <form onSubmit={onResetPasswordSubmit} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <RiShieldCheckLine size={16} className="shrink-0 text-emerald-400" />
            <span>Code verified! Please create your new account password.</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 ml-0.5">
              New Password <span className="text-red-400 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => onPasswordTyping(e.target.value, false, setNewPassword)}
                onFocus={() => onFieldFocus('newPassword')}
                onBlur={onFieldBlur}
                placeholder="Min 6 chars, uppercase & number"
                className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-0.5"
              >
                {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300 ml-0.5">
              Confirm Password <span className="text-red-400 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={(e) => onPasswordTyping(e.target.value, false, setConfirmNewPassword)}
                onFocus={() => onFieldFocus('confirmNewPassword')}
                onBlur={onFieldBlur}
                placeholder="Repeat new password"
                className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-0.5"
              >
                {showConfirmNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={forgotLoading}
            onMouseEnter={() => !forgotLoading && setBlobMood('happy')}
            onMouseLeave={() => !forgotLoading && setBlobMood('curious')}
            className="w-full h-11 mt-1 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {forgotLoading ? (
              <>
                <RiLoader4Line className="animate-spin w-4 h-4" />
                <span>Saving Password...</span>
              </>
            ) : (
              <>
                <span>Save & Sign In</span>
                <RiShieldCheckLine size={16} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="w-full text-xs text-zinc-400 hover:text-white font-medium py-1.5 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RiArrowLeftLine size={14} /> Back to Sign In
          </button>
        </form>
      )}
    </div>
  );
}
