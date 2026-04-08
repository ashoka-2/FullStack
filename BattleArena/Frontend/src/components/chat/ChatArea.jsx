import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import MessageBubble from './MessageBubble';
import BattleResult from '../battle/BattleResult';
import LoadingPulse from './LoadingPulse';

const ChatArea = () => {
  const { messages, isLoading } = useSelector((s) => s.chat);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-6 animate-entrance">
            <div className="mb-6">
              <span className="text-6xl">⚔️</span>
            </div>
            <div className="space-y-3 mb-8">
              <h2 className="text-[var(--text-main)] text-3xl font-bold uppercase tracking-tight">
                ARENA READY
              </h2>
              <p className="text-[var(--text-dim)] text-[10px] font-black uppercase tracking-[0.2em]">
                Two AIs. One Final Result.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {[
                'Bubble Sort in JavaScript',
                'Design a simple Cache',
                'A* Pathfinding Logic',
                'Singleton pattern Example'
              ].map((text) => (
                <button
                  key={text}
                  className="nb-button bg-[var(--bg-main)] p-3 text-left border-[var(--bg-accent)] group"
                  onClick={() => {
                    const textarea = document.querySelector('textarea');
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                    setter.call(textarea, text);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.focus();
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] group-hover:text-[var(--cyan-main)]">
                    {text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-12">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <MessageBubble content={msg.content} />
              ) : (
                <BattleResult battleData={msg.battleData} />
              )}
            </div>
          ))}
        </div>

        {isLoading && <LoadingPulse />}
        <div ref={bottomRef} className="h-6" />
      </div>
    </main>
  );
};

export default ChatArea;
