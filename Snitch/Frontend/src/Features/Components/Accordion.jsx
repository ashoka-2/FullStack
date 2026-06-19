import React, { useState } from "react";

const Accordion = ({ icon, label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-theme/40 last:border-b-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-4 text-left group">
        <div className="flex items-center gap-2.5">
          {icon && <i className={`${icon} text-xs text-accent`} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/70 group-hover:text-accent transition-colors">{label}</span>
        </div>
        <i className={`ri-arrow-down-s-line text-sm text-foreground/30 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="pb-5 text-[11px] text-foreground/60 leading-relaxed font-medium space-y-2">{children}</div>
      </div>
    </div>
  );
};

export default Accordion;
