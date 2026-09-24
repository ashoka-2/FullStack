import React from 'react';
import {
  RiUser3Line,
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line
} from '@remixicon/react';

export default function AuthRegisterForm({
  username,
  setUsername,
  email,
  setEmail,
  password,
  confirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  onSubmit,
  onFieldFocus,
  onFieldBlur,
  onPasswordTyping,
  triggerTypingNod,
  setBlobMood,
  setBlobGaze,
  setBubbleText,
  setIsPasswordSleeping,
  setClosedEyes,
  activeField
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Username Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-300 ml-0.5">
          Username <span className="text-red-400 font-bold ml-0.5">*</span>
        </label>
        <div className="relative">
          <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              triggerTypingNod();
            }}
            onFocus={() => onFieldFocus('username')}
            onBlur={onFieldBlur}
            placeholder="alex_dev (letters, numbers, _)"
            className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-3.5 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
          />
        </div>
      </div>

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
        <label className="text-xs font-medium text-zinc-300 ml-0.5">
          Password <span className="text-red-400 font-bold ml-0.5">*</span>
        </label>
        <div className="relative">
          <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => onPasswordTyping(e.target.value, false)}
            onFocus={() => onFieldFocus('password')}
            onBlur={onFieldBlur}
            placeholder="Min 6 chars, uppercase & number"
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

      {/* Confirm Password Field */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-300 ml-0.5">
          Confirm Password <span className="text-red-400 font-bold ml-0.5">*</span>
        </label>
        <div className="relative">
          <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => onPasswordTyping(e.target.value, true)}
            onFocus={() => onFieldFocus('confirmPassword')}
            onBlur={onFieldBlur}
            placeholder="Repeat password"
            className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent-cyan)]/30 rounded-xl pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const next = !showConfirmPassword;
              setShowConfirmPassword(next);
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
            {showConfirmPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
          </button>
        </div>
      </div>

      {/* Submit Register Button */}
      <button
        type="submit"
        disabled={loading}
        onMouseEnter={() => !loading && setBlobMood('happy')}
        onMouseLeave={() => !loading && setBlobMood(activeField ? (activeField.includes('password') ? 'password' : 'curious') : 'neutral')}
        className={`w-full h-11 mt-2 bg-[var(--accent-cyan)] hover:bg-[#1bb0c4] active:scale-[0.98] text-zinc-950 font-bold rounded-xl transition-all duration-150 text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 ${loading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        {loading ? (
          <>
            <RiLoader4Line className="animate-spin w-4 h-4" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Free Account</span>
        )}
      </button>
    </form>
  );
}
