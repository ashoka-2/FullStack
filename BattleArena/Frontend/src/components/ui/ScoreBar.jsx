// import React from 'react';

// /**
//  * ScoreBar — horizontal bar showing score out of 10
//  */
// const ScoreBar = ({ score, maxScore = 10, isWinner = false }) => {
//   const pct = Math.min((score / maxScore) * 100, 100);

//   return (
//     <div className="w-full">
//       {/* Track */}
//       <div className="w-full h-5 bg-[#030e20] border-4 border-black relative overflow-hidden">
//         {/* Fill */}
//         <div
//           className="h-full transition-all duration-700 ease-out"
//           style={{
//             width: `${pct}%`,
//             background: isWinner
//               ? 'linear-gradient(90deg, #dec800, #FFE600)'
//               : '#1a2744',
//           }}
//         />
//         {/* Segment marks */}
//         {[...Array(maxScore - 1)].map((_, i) => (
//           <div
//             key={i}
//             className="absolute top-0 h-full w-0.5 bg-black opacity-40"
//             style={{ left: `${((i + 1) / maxScore) * 100}%` }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ScoreBar;
