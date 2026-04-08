import React from 'react';
import MarkdownRenderer from '../ui/MarkdownRenderer';

const SolutionCard = ({ solutionNumber, content, score, isWinner }) => {
  const isOne = solutionNumber === 1;

  return (
    <div className={`nb-card flex flex-col h-full bg-[var(--bg-card)] border-2 ${isWinner ? '!border-[var(--cyan-main)] shadow-[4px_4px_0px_var(--cyan-main)]' : 'opacity-90'}`}>
      
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between border-b-2 border-black shrink-0">
        <h3 className="font-bold text-xs uppercase tracking-widest">
          AGENT {isOne ? 'MISTRAL' : 'COHERE'}
        </h3>
        
        {isWinner && (
          <span className="bg-[var(--cyan-main)] text-black px-2 py-0.5 text-[8px] font-black uppercase rounded">
            WINNER
          </span>
        )}
      </div>

      <div className="bg-[var(--bg-main)] p-3 border-b-2 border-black flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
        <span className="text-[var(--text-dim)]">Combat Rating</span>
        <span className="text-[var(--text-main)] font-bold">{score} / 10</span>
      </div>

      <div className="p-4 flex-1 text-sm text-[var(--text-main)]">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};

export default SolutionCard;
