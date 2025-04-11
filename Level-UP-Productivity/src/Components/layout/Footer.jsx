import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#120E1B80] backdrop-blur-md text-white py-3 sm:py-4 border-t border-[#ffffff10]">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center text-xs sm:text-sm text-[#ffffff70]">
          &copy; {new Date().getFullYear()} Level UP Productivity. Once you add a task, it must be completed.
        </div>
      </div>
    </footer>
  );
};

export default Footer; 