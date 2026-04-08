import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setInput, sendMessage, receiveBattleResult, receiveBattleError } from '../../features/chat/chatSlice';

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ChatInput = () => {
  const dispatch = useDispatch();
  const { inputValue, isLoading } = useSelector((s) => s.chat);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    const problem = inputValue.trim();
    if (!problem || isLoading) return;

    dispatch(sendMessage(problem));

    try {
      const response = await axios.post(`${API_URL}/invoke`, {
        input: problem,
      });

      dispatch(receiveBattleResult({
        problem,
        ...response.data.result,
      }));
    } catch (error) {
      dispatch(receiveBattleError(
        error.response?.data?.message || error.message || 'Unable to get a battle result from the backend.'
      ));
    }
  };

  return (
    <section className="bg-[var(--bg-card)] border-t-2 border-black p-4 shrink-0 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-3 items-end">
          
          <div className="flex-1 nb-card !bg-[var(--bg-main)] focus-within:!shadow-[4px_4px_0px_var(--cyan-main)]">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => dispatch(setInput(e.target.value))}
              placeholder="Enter your coding challenge..."
              className="w-full bg-transparent p-3 text-[var(--text-main)] placeholder:text-[var(--text-dim)] font-mono text-xs outline-none resize-none min-h-[44px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !inputValue.trim()}
            className="nb-button bg-[var(--cyan-main)] text-black px-6 h-[44px] text-xs"
          >
            {isLoading ? 'Battling...' : 'Send Battle ⚔️'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChatInput;

