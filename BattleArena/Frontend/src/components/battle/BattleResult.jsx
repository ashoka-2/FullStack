import React from 'react';
import SolutionCard from './SolutionCard';
import JudgeCard from './JudgeCard';

/**
 * BattleResult — full battle display assembled from battleData
 */
const BattleResult = ({ battleData }) => {
  const { solution_1, solution_2, judge } = battleData;

  const winner1 = judge.solution_1_score >= judge.solution_2_score;
  const winner2 = judge.solution_2_score > judge.solution_1_score;

  return (
    <div className="w-full animate-fadeIn">
      {/* Problem */}

      {/* Solutions — side by side on md+, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SolutionCard
          solutionNumber={1}
          content={solution_1}
          score={judge.solution_1_score}
          isWinner={winner1}
        />
        <SolutionCard
          solutionNumber={2}
          content={solution_2}
          score={judge.solution_2_score}
          isWinner={winner2}
        />
      </div>

      {/* Judge Verdict */}
      <JudgeCard judge={judge} />
    </div>
  );
};

export default BattleResult;