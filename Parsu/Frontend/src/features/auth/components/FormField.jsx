import React, { useState } from 'react';
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react';

const FormField = ({ label, type, value, onChange, placeholder, name, required = true, icon: Icon = null }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={name} className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-0.5">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-2xl py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan)]/25 hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-200 text-sm sm:text-base font-medium ${
            Icon ? 'pl-11 pr-4' : 'px-4'
          } ${isPassword ? 'pr-11' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer p-1"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <RiEyeOffLine size={18} />
            ) : (
              <RiEyeLine size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormField;
