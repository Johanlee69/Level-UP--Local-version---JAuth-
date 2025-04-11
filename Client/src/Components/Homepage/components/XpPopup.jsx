import React, { useState, useEffect } from 'react';

const XpPopup = ({ xpAmount, visible, onClose }) => {
  const [animation, setAnimation] = useState('');
  
  useEffect(() => {
    if (visible) {
      setAnimation('slide-in');
      
      // Auto-close after 2 seconds
      const timer = setTimeout(() => {
        setAnimation('slide-out');
        
        // After animation completes, trigger onClose
        setTimeout(() => {
          if (onClose) onClose();
        }, 500);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);
  
  if (!visible) return null;
  
  return (
    <div className={`fixed top-20 right-8 bg-gradient-to-r from-[#5D1BE3] to-[#1072F1] text-white px-4 py-2 rounded-lg shadow-lg z-50 ${animation}`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-[#9370da] bg-opacity-20 rounded-full flex items-center justify-center mr-2">
          <span className="text-sm font-bold">XP</span>
        </div>
        <div>
          <p className="text-sm font-semibold">+{xpAmount} XP gained!</p>
        </div>
      </div>
    </div>
  );
};

export default XpPopup; 