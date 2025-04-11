import React from 'react';
import { useLevel } from '../../../Context/LevelContext';

const LevelDetails = () => {
  const { level, xp, nextLevelXp, progress, totalXp } = useLevel();
  
  return (
    <div className="bg-[#362f2f80] backdrop-blur-sm border border-[#ffffff20] rounded-xl p-5 text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5D1BE3] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Your Level
      </h2>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5D1BE3] to-[#1072F1] flex items-center justify-center">
              <span className="text-2xl font-bold">{level}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white text-purple-600 text-xs font-bold px-1 rounded">
              LEVEL
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm opacity-75">Total XP</div>
            <div className="text-xl font-semibold">{totalXp} XP</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress to Level {level + 1}</span>
          <span>{xp} / {nextLevelXp} XP</span>
        </div>
        
        <div className="w-full bg-[#ffffff20] rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-[#5D1BE3] to-[#1072F1] h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-xs opacity-75 mt-1">
          {Math.round(progress * 100)}% to next level
        </div>
      </div>
      
      <div className="mt-6 border-t border-[#ffffff20] pt-4">
        <h3 className="text-lg font-semibold mb-2">How to Earn XP</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Complete a task: <span className="font-semibold">+10 XP</span></li>
          <li>More ways to earn XP coming soon!</li>
        </ul>
      </div>
    </div>
  );
};

export default LevelDetails; 