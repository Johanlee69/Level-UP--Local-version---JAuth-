import React from 'react';
import { useLevel } from '../../../Context/LevelContext';

const LevelDetailsPopup = () => {
  const { level, xp, nextLevelXp, progress, totalXp, XP_VALUES } = useLevel();
  
  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-[#362f2f] backdrop-blur-md border border-[#ffffff20] rounded-xl p-4 shadow-lg z-50 text-white">
      <div className="flex items-center mb-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5D1BE3] to-[#1072F1] flex items-center justify-center">
            <span className="text-xl font-bold">{level}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white text-purple-600 text-xs font-bold px-1 rounded">
            LEVEL
          </div>
        </div>
        <div className="ml-3">
          <div className="text-xs opacity-75">Total XP</div>
          <div className="text-lg font-semibold">{totalXp} XP</div>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span>Progress to Level {level + 1}</span>
          <span>{xp} / {nextLevelXp} XP</span>
        </div>
        
        <div className="w-full bg-[#ffffff20] rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#5D1BE3] to-[#1072F1] h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-xs opacity-75">
          {Math.round(progress * 100)}% to next level
        </div>
      </div>
      
      <div className="border-t border-[#ffffff20] pt-2">
        <h3 className="text-sm font-semibold mb-1">XP Rewards</h3>
        <ul className="text-xs space-y-1 opacity-80">
          <li>• Daily Task: <span className="font-semibold">+{XP_VALUES.DAILY_TASK} XP</span></li>
          <li>• Custom/Calendar Task: <span className="font-semibold">+{XP_VALUES.BASE_TASK} XP</span></li>
          <li className="pl-4">- Low Priority: <span className="font-semibold">×{XP_VALUES.PRIORITY_MULTIPLIER_LOW}</span></li>
          <li className="pl-4">- Medium Priority: <span className="font-semibold">×{XP_VALUES.PRIORITY_MULTIPLIER_MEDIUM}</span></li>
          <li className="pl-4">- High Priority: <span className="font-semibold">×{XP_VALUES.PRIORITY_MULTIPLIER_HIGH}</span></li>
        </ul>
      </div>
    </div>
  );
};

export default LevelDetailsPopup; 