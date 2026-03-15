import React, { useState } from 'react';
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react';

const FormField = ({ label, type, value, onChange, placeholder, name, required = true }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-zinc-400 ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          id={name}
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-[#191a1a] border border-[#2d2e2e] rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#60A6AF] focus:ring-1 focus:ring-[#60A6AF] transition-all duration-200 font-medium"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {showPassword ? (
              <RiEyeOffLine size={20} />
            ) : (
              <RiEyeLine size={20} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormField;
