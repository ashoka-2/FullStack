import React from 'react';

const MessageBubble = ({ content }) => {
  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[70%]">
        <div className="flex items-center justify-end gap-2 mb-1 px-1">
          <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest">ME</span>
        </div>
        <div className="nb-card bg-[var(--bg-accent)] p-3 shadow-[2px_2px_0px_var(--cyan-main)]">
          <p className="text-[var(--text-main)] text-xs font-mono leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
