import React from 'react';
import MarkdownRenderer from '../ui/MarkdownRenderer';

const JudgeCard = ({ judge }) => {
  const { solution_1_score, solution_2_score, solution_1_reasoning, solution_2_reasoning } = judge;
  const winner = solution_1_score >= solution_2_score ? 1 : 2;

  return (
    <section className="nb-card !bg-[var(--bg-main)] mt-10 overflow-hidden">
      
      <div className="bg-[var(--cyan-main)] p-4 border-b-4 border-black flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xl">⚖️</span>
          <h2 className="text-black text-lg font-bold uppercase tracking-tight">
            FINAL VERDICT
          </h2>
        </div>
        <div className="bg-black text-white px-3 py-1 font-black uppercase text-[9px] tracking-widest">
          AGENT {winner} WINS
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-y-4 md:divide-y-0 md:divide-x-4 border-black divide-black">
        
        <div className={`p-6 ${winner === 1 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-main)] opacity-60'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-[var(--bg-accent)] pb-2">
            <span className="text-2xl font-bold text-[var(--cyan-main)]">01</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-dim)]">Analysis MISTRAL</span>
          </div>
          <div className="text-sm">
            <MarkdownRenderer content={solution_1_reasoning} />
          </div>
        </div>

        <div className={`p-6 ${winner === 2 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-main)] opacity-60'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-[var(--bg-accent)] pb-2">
            <span className="text-2xl font-bold text-[var(--cyan-main)]">02</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-dim)]">Analysis COHERE</span>
          </div>
          <div className="text-sm">
            <MarkdownRenderer content={solution_2_reasoning} />
          </div>
        </div>

      </div>
    </section>
  );
};

export default JudgeCard;
