import React, { useState, useEffect } from 'react';
import { useLevel } from '../../../Context/LevelContext';

const LevelPopup = () => {
  const [visible, setVisible] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [animation, setAnimation] = useState('');
  const { level } = useLevel();
  
  // Track previous level to detect level changes
  const [prevLevel, setPrevLevel] = useState(level);
  
  useEffect(() => {
    // Check if level has increased
    if (level > prevLevel && prevLevel > 0) {
      setNewLevel(level);
      showLevelUpPopup();
    }
    
    // Update previous level
    setPrevLevel(level);
  }, [level, prevLevel]);
  
  const showLevelUpPopup = () => {
    setVisible(true);
    setAnimation('slide-in');
    
    // After showing for 3 seconds, slide out
    setTimeout(() => {
      setAnimation('slide-out');
      
      // After animation completes, hide the popup
      setTimeout(() => {
        setVisible(false);
      }, 500);
    }, 3000);
  };
  
  if (!visible) return null;
  
  return (
    <div className={`fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 ${animation} mb-100`}>
      <div className="flex items-center">
        <div className="w-12 h-12 bg-[#9370da] bg-opacity-20 rounded-full flex items-center justify-center mr-3">
          <span className="text-2xl font-bold">{newLevel}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold">Level Up!</h3>
          <p className="text-sm text-white text-opacity-90">Yatta ! You've reached level {newLevel}</p>
        </div>
      </div>
    </div>
  );
};

export default LevelPopup; 