import React from "react";

const Field = ({ label, hint, children, required }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-foreground/75 flex items-center gap-2">
      {label}
      {required && <span className="text-accent text-xs">*</span>}
      {hint && <span className="text-[10px] text-foreground/30 font-normal ml-auto">{hint}</span>}
    </label>
    {children}
  </div>
);

export default Field;
