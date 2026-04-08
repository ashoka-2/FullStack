import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearChat, toggleTheme } from '../../features/chat/chatSlice';

const Header = () => {
  const dispatch = useDispatch();
  const { messages, theme } = useSelector((s) => s.chat);

  return (
    <header className="h-14 bg-[var(--bg-card)] border-b-2 border-black flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <div className="nb-button bg-sky-500 px-3 py-1 -rotate-1 cursor-default">
          <span className="text-black text-sm font-bold uppercase tracking-tighter">
            ⚔️ BattleArena
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="nb-button bg-[var(--bg-accent)] text-[var(--text-main)] px-3 py-1 text-[10px] min-w-[80px]"
        >
          {theme === 'dark' ? '☀️ LIGHT' : '🌙 DARK'}
        </button>

        {messages.length > 0 && (
          <button
            onClick={() => dispatch(clearChat())}
            className="nb-button bg-red-500 text-black px-3 py-1 text-[10px]"
          >
            CLEAR
          </button>
        )}
        
        <div className="hidden sm:flex items-center gap-3 bg-black border-2 border-black px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 text-[9px] font-black uppercase tracking-widest">
            {theme === 'dark' ? 'DARK_MODE' : 'LIGHT_MODE'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
